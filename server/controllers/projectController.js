const { Project, User, ProjectMember } = require('../models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');

const getAllProjects = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            isActive: true,
        };

        // Search filter
        if (search) {
            whereClause[Op.and] = whereClause[Op.and] || [];
            whereClause[Op.and].push({
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { client: { [Op.iLike]: `%${search}%` } }
                ]
            });
        }

        // Universal rule for ALL roles — show only projects where:
        // the user is a ProjectMember  OR  the user is the creator
        const userProjectIds = await ProjectMember.findAll({
            where: { userId: req.user.id },
            attributes: ['projectId']
        });
        const memberProjectIds = userProjectIds.map(pm => pm.projectId);
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({
            [Op.or]: [
                { id: { [Op.in]: memberProjectIds } },
                { createdBy: req.user.id }
            ]
        });

        const { count, rows } = await Project.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'username', 'role'],
                    through: { attributes: [] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const totalItems = count;
        const itemsLeft = Math.max(0, totalItems - (page * limit));

        // Adding YesNo indicator based on hasBalanceData (demo field)
        const formattedRows = rows.map(p => {
            const project = p.toJSON();
            project.YesOrNo = p.hasBalanceData ? 'Y' : 'N';
            return project;
        });

        res.json({
            data: formattedRows,
            pagination: {
                totalItems,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                itemsLeft,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createProject = async (req, res) => {
    try {
        const { name, client, description, members } = req.body;

        // Generate Project Code (Name[2] + Client[2] + 6 digits)
        const namePart = (name || "").substring(0, 2).toUpperCase();
        const clientPart = (client || "").substring(0, 2).toUpperCase();
        const prefix = (namePart.padEnd(2, 'P') + clientPart.padEnd(2, 'C')); // P for Project, C for Client if names too short

        const lastProject = await Project.findOne({
            order: [['id', 'DESC']],
            paranoid: false // Include soft-deleted projects for unique sequence
        });

        let nextNumber = 1;
        if (lastProject && lastProject.projectCode) {
            const lastCode = lastProject.projectCode;
            // Extract numeric part (last 6 digits)
            const lastNumericPart = lastCode.slice(-6);
            if (!isNaN(parseInt(lastNumericPart))) {
                nextNumber = parseInt(lastNumericPart) + 1;
            }
        }

        const projectCode = `${prefix}${String(nextNumber).padStart(6, '0')}`;

        const project = await Project.create({
            name,
            client,
            description,
            projectCode,
            createdBy: req.user.id,
            modifiedBy: req.user.id
        });

        // Ensure the creator is always included in the members list
        const membersList = Array.isArray(members) ? [...members] : [];
        if (!membersList.includes(req.user.id)) {
            membersList.push(req.user.id);
        }

        const memberAssociations = membersList.map(userId => ({
            projectId: project.id,
            userId: userId
        }));
        await ProjectMember.bulkCreate(memberAssociations);

        // Notify Members (skip notifying the creator themselves)
        for (const userId of membersList) {
            if (userId !== req.user.id) {
                await createNotification({
                    userId,
                    senderId: req.user.id,
                    title: 'Added to Project',
                    message: `You have been added to the project: ${name}`,
                    type: 'project',
                    targetId: project.id
                });
            }
        }

        const createdProject = await Project.findByPk(project.id, {
            include: [{ model: User, as: 'members', attributes: ['id', 'username', 'role'], through: { attributes: [] } }]
        });

        res.status(201).json(createdProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, client, description, members } = req.body;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update project fields
        await project.update({
            name,
            client,
            description,
            modifiedBy: req.user.id
        });

        // Sync members: Remove all old members and add the new list
        // Always ensure the original creator remains a member
        const membersList = Array.isArray(members) ? [...members] : [];
        if (project.createdBy && !membersList.includes(project.createdBy)) {
            membersList.push(project.createdBy);
        }

        await ProjectMember.destroy({ where: { projectId: id } });

        const memberAssociations = membersList.map(userId => ({
            projectId: id,
            userId: userId
        }));
        await ProjectMember.bulkCreate(memberAssociations);

        for (const userId of membersList) {
            if (userId !== req.user.id) {
                await createNotification({
                    userId,
                    senderId: req.user.id,
                    title: 'Project Updated',
                    message: `Project ${name} membership details were updated`,
                    type: 'project',
                    targetId: id
                });
            }
        }

        const updatedProject = await Project.findByPk(id, {
            include: [{ model: User, as: 'members', attributes: ['id', 'username', 'role'], through: { attributes: [] } }]
        });

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Soft delete: Set isActive to false
        await project.update({
            isActive: false,
            modifiedBy: req.user.id
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllProjects,
    createProject,
    updateProject,
    deleteProject
};
