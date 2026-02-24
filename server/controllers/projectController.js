const { Project, User, ProjectMember } = require('../models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');

const getAllProjects = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            isActive: true,
            ...(search && {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { client: { [Op.iLike]: `%${search}%` } }
                ]
            })
        };

        // Role-based filtering
        // If not Architect, only show projects where the user is a member
        if (req.user.role !== 'Architect') {
            const userProjectIds = await ProjectMember.findAll({
                where: { userId: req.user.id },
                attributes: ['projectId']
            });
            const projectIds = userProjectIds.map(pm => pm.projectId);
            whereClause.id = { [Op.in]: projectIds };
        }

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

        const project = await Project.create({
            name,
            client,
            description,
            createdBy: req.user.id,
            modifiedBy: req.user.id
        });

        if (members && Array.isArray(members)) {
            const memberAssociations = members.map(userId => ({
                projectId: project.id,
                userId: userId
            }));
            await ProjectMember.bulkCreate(memberAssociations);

            // Notify Members
            for (const userId of members) {
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
        if (members && Array.isArray(members)) {
            // Get current members to notify only new ones (optional, user said "update also")
            // Let's just notify all in the new list for simplicity as per request
            await ProjectMember.destroy({ where: { projectId: id } });

            const memberAssociations = members.map(userId => ({
                projectId: id,
                userId: userId
            }));
            await ProjectMember.bulkCreate(memberAssociations);

            for (const userId of members) {
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

module.exports = {
    getAllProjects,
    createProject,
    updateProject
};
