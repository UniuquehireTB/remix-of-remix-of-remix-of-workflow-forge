const { Ticket, User, Project, TicketAssignee, ProjectMember } = require('../models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');
const { sequelize } = require('../db');

const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, type, priority, status, projectId, startDate, endDate, assigneeId } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            isActive: true,
            ...(search && {
                [Op.or]: [
                    { title: { [Op.iLike]: `%${search}%` } },
                    { ticketId: { [Op.iLike]: `%${search}%` } }
                ]
            }),
            ...(type && { type }),
            ...(priority && { priority }),
            ...(status && { status }),
            ...(projectId && projectId !== 'undefined' && projectId !== 'All' && {
                projectId: projectId === 'null' ? null : projectId
            })
        };

        // Date range filtering
        if (startDate && startDate !== 'null') {
            const sDate = new Date(startDate);
            if (!isNaN(sDate.getTime())) {
                whereClause.startDate = { [Op.gte]: sDate };
            }
        }
        if (endDate && endDate !== 'null') {
            const eDate = new Date(endDate);
            if (!isNaN(eDate.getTime())) {
                whereClause.endDate = { [Op.lte]: eDate };
            }
        }

        // Visibility Logic: 
        // 1. Architect and Manager see all
        // 2. Others only see tickets for projects they are members of
        const elevatedRoles = ['Architect', 'Manager', 'System Architect', 'Technical Analyst'];
        if (!elevatedRoles.includes(req.user.role)) {
            const userProjectIds = await ProjectMember.findAll({
                where: { userId: req.user.id },
                attributes: ['projectId']
            });
            const projectIds = userProjectIds.map(pm => pm.projectId).filter(id => id != null);

            whereClause[Op.and] = [
                {
                    [Op.or]: [
                        { projectId: { [Op.in]: projectIds } },
                        { projectId: null } // Allow seeing global tickets
                    ]
                }
            ];
        }

        if (assigneeId && assigneeId !== 'All') {
            const ticketAssignees = await TicketAssignee.findAll({
                where: { userId: assigneeId },
                attributes: ['ticketId']
            });
            const ticketIds = ticketAssignees.map(ta => ta.ticketId);
            whereClause.id = { [Op.in]: ticketIds };
        }

        const { count, rows } = await Ticket.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            distinct: true, // Crucial when including collections with pagination
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                {
                    model: User,
                    as: 'assignees',
                    attributes: ['id', 'username', 'role'],
                    through: { attributes: ['joinDate'] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            data: rows,
            pagination: {
                totalItems: count,
                currentPage: page,
                itemsPerPage: limit,
                itemsLeft: Math.max(0, count - (page * limit)),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

const createTicket = async (req, res) => {
    try {
        const { title, description, type, priority, projectId, assignees, startDate, endDate } = req.body;

        // Validation
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date cannot be later than end date' });
        }

        if (assignees && Array.isArray(assignees)) {
            for (const a of assignees) {
                if (typeof a === 'object' && a.joinDate) {
                    const joinDate = new Date(a.joinDate);
                    if (startDate && joinDate < new Date(startDate)) {
                        return res.status(400).json({ message: `Assignee join date cannot be earlier than ticket start date` });
                    }
                    if (endDate && joinDate > new Date(endDate)) {
                        return res.status(400).json({ message: `Assignee join date cannot be later than ticket end date` });
                    }
                }
            }
        }

        // Generate Ticket ID (TK-XXXX)
        const lastTicket = await Ticket.findOne({ order: [['id', 'DESC']] });
        const nextIdNumber = lastTicket ? lastTicket.id + 1001 : 1001;
        const ticketIdString = `TK-${nextIdNumber}`;

        const ticket = await Ticket.create({
            ticketId: ticketIdString,
            title,
            description,
            type,
            priority,
            status: 'Open', // Fixed initial status
            projectId: projectId || null,
            startDate,
            endDate,
            createdBy: req.user.id,
            modifiedBy: req.user.id
        });

        if (assignees && Array.isArray(assignees)) {
            const assigneeAssociations = assignees.map(a => {
                const userId = typeof a === 'object' ? a.id : a;
                let joinDate = typeof a === 'object' ? a.joinDate : null;
                if (joinDate === "" || joinDate === "Invalid date") joinDate = null;

                return {
                    ticketId: ticket.id,
                    userId,
                    joinDate
                };
            });
            await TicketAssignee.bulkCreate(assigneeAssociations);

            // Notify Assignees
            for (const a of assignees) {
                const userId = typeof a === 'object' ? a.id : a;
                await createNotification({
                    userId,
                    senderId: req.user.id,
                    title: 'New Ticket Assigned',
                    message: `You have been assigned to ticket: ${title}`,
                    type: 'ticket',
                    targetId: ticket.id
                });
            }
        }

        const fullTicket = await Ticket.findByPk(ticket.id, {
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                { model: User, as: 'assignees', attributes: ['id', 'username', 'role'], through: { attributes: ['joinDate'] } }
            ]
        });

        res.status(201).json(fullTicket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const ticket = await Ticket.findByPk(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const updateData = { status, modifiedBy: req.user.id };
        if (status === 'Closed') {
            updateData.closedAt = new Date();
        } else {
            updateData.closedAt = null;
        }

        await ticket.update(updateData);

        // Notify Assignees + Creator
        const ticketId = ticket.id;
        const assignees = await TicketAssignee.findAll({ where: { ticketId } });
        const userIdsToNotify = new Set(assignees.map(a => a.userId));
        userIdsToNotify.add(ticket.createdBy);

        for (const userId of userIdsToNotify) {
            await createNotification({
                userId,
                senderId: req.user.id,
                title: 'Ticket Status Updated',
                message: `Ticket ${ticket.ticketId} status changed to ${status}`,
                type: 'ticket',
                targetId: ticketId
            });
        }

        res.json({ message: 'Status updated', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type, priority, projectId, assignees, startDate, endDate, status, closedAt } = req.body;

        // Validation
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date cannot be later than end date' });
        }

        if (assignees && Array.isArray(assignees)) {
            for (const a of assignees) {
                if (typeof a === 'object' && a.joinDate) {
                    const joinDate = new Date(a.joinDate);
                    if (startDate && joinDate < new Date(startDate)) {
                        return res.status(400).json({ message: `Assignee join date cannot be earlier than ticket start date` });
                    }
                    if (endDate && joinDate > new Date(endDate)) {
                        return res.status(400).json({ message: `Assignee join date cannot be later than ticket end date` });
                    }
                }
            }
        }

        const ticket = await Ticket.findByPk(id, {
            include: [{ model: User, as: 'assignees' }]
        });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const { extendReason } = req.body;
        let updatedHistory = ticket.dueHistory || [];

        // If endDate is changed and it's an extension, and a reason is provided
        if (endDate && ticket.endDate && new Date(endDate) > new Date(ticket.endDate) && extendReason) {
            updatedHistory = [...updatedHistory, {
                from: ticket.endDate,
                to: endDate,
                reason: extendReason,
                username: req.user.username,
                userId: req.user.id,
                timestamp: new Date()
            }];
        }

        await ticket.update({
            title, description, type, priority, projectId, startDate, endDate, status, closedAt,
            dueHistory: updatedHistory,
            modifiedBy: req.user.id
        });

        // Sync Assignees
        if (assignees && Array.isArray(assignees)) {
            await TicketAssignee.destroy({ where: { ticketId: id } });
            const assigneeAssociations = assignees.map(a => {
                const userId = typeof a === 'object' ? a.id : a;
                let joinDate = typeof a === 'object' ? a.joinDate : null;
                if (joinDate === "" || joinDate === "Invalid date") joinDate = null;

                return {
                    ticketId: id,
                    userId,
                    joinDate
                };
            });
            await TicketAssignee.bulkCreate(assigneeAssociations);

            // Notify Assignees + Creator
            const ticketIdVal = id;
            const assigneesData = await TicketAssignee.findAll({ where: { ticketId: ticketIdVal } });
            const notifyIds = new Set(assigneesData.map(a => a.userId));
            notifyIds.add(ticket.createdBy);

            for (const userId of notifyIds) {
                await createNotification({
                    userId,
                    senderId: req.user.id,
                    title: 'Ticket Updated',
                    message: `Ticket ${ticket.ticketId} updated by ${req.user.username}.${endDate !== ticket.endDate ? ' Due date changed.' : ''}`,
                    type: 'ticket',
                    targetId: ticketIdVal
                });
            }
        }

        const fullTicket = await Ticket.findByPk(id, {
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                { model: User, as: 'assignees', attributes: ['id', 'username', 'role'], through: { attributes: ['joinDate'] } }
            ]
        });

        res.json(fullTicket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findByPk(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        await ticket.update({ isActive: false, modifiedBy: req.user.id });
        res.json({ message: 'Ticket deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findByPk(id, {
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                { model: User, as: 'assignees', attributes: ['id', 'username', 'role'], through: { attributes: ['joinDate'] } }
            ]
        });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getTicketStatsByProject = async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

        const whereClause = {
            isActive: true,
            ...(projectId && projectId !== 'All' && {
                projectId: projectId === 'null' ? null : projectId
            })
        };

        const stats = await Ticket.findAll({
            where: whereClause,
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        const counts = {
            'Open': 0,
            'In Progress': 0,
            'On Hold': 0,
            'Closed': 0,
            'total': 0
        };

        stats.forEach(s => {
            const count = parseInt(s.dataValues.count);
            counts.total += count;
            if (counts.hasOwnProperty(s.status)) {
                counts[s.status] = count;
            }
        });

        res.json(counts);
    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const extendTicketDueDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { endDate, reason } = req.body;

        const ticket = await Ticket.findByPk(id, {
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                { model: User, as: 'assignees', attributes: ['id', 'username', 'role'], through: { attributes: ['joinDate'] } }
            ]
        });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const history = ticket.dueHistory || [];
        const newHistoryItem = {
            from: ticket.endDate,
            to: endDate,
            reason: reason || 'Date extended',
            username: req.user.username,
            userId: req.user.id,
            timestamp: new Date()
        };

        const updatedHistory = [...history, newHistoryItem];

        await ticket.update({
            endDate,
            dueHistory: updatedHistory,
            modifiedBy: req.user.id
        });

        // Notify Assignees + Creator
        const notifyIds = new Set(ticket.assignees.map(a => a.id));
        notifyIds.add(ticket.createdBy);

        for (const userId of notifyIds) {
            if (userId === req.user.id) continue;
            await createNotification({
                userId,
                senderId: req.user.id,
                title: 'Ticket Due Date Extended',
                message: `Ticket ${ticket.ticketId} due date extended to ${endDate} by ${req.user.username}`,
                type: 'ticket',
                targetId: id
            });
        }

        res.json({ message: 'Due date extended', ticket });
    } catch (error) {
        console.error('Error extending due date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllTickets,
    getTicketById,
    createTicket,
    updateTicketStatus,
    updateTicket,
    deleteTicket,
    getTicketStatsByProject,
    extendTicketDueDate
};
