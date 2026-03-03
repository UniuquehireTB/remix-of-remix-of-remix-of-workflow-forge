const { ProjectInvitation, Project, User, ProjectMember } = require('../models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');

/**
 * POST /projects/:id/invite
 * Body: { userIds: number[] }
 * Send invitations to users for a project.
 * Already-members and already-pending invites are skipped.
 */
const sendInvitations = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'No users specified for invitation.' });
        }

        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Fetch existing members to skip them
        const existingMembers = await ProjectMember.findAll({
            where: { projectId, userId: { [Op.in]: userIds } },
            attributes: ['userId']
        });
        const existingMemberIds = existingMembers.map(m => m.userId);

        // Fetch already-pending invitations to avoid duplicates
        const existingInvites = await ProjectInvitation.findAll({
            where: { projectId, userId: { [Op.in]: userIds }, status: 'pending' },
            attributes: ['userId']
        });
        const alreadyInvitedIds = existingInvites.map(i => i.userId);

        const toInvite = userIds.filter(uid =>
            uid !== req.user.id &&                   // skip the sender
            !existingMemberIds.includes(uid) &&       // skip existing members
            !alreadyInvitedIds.includes(uid)          // skip already-pending
        );

        if (toInvite.length === 0) {
            return res.json({ message: 'All selected users are already members or have pending invitations.', invited: 0 });
        }

        // Create invitation records
        const invitations = toInvite.map(userId => ({
            projectId: parseInt(projectId),
            userId,
            invitedBy: req.user.id,
            status: 'pending'
        }));
        await ProjectInvitation.bulkCreate(invitations);

        // Send notifications to each invited user
        for (const userId of toInvite) {
            await createNotification({
                userId,
                senderId: req.user.id,
                title: 'Project Invitation',
                message: `You have been invited to join the project: ${project.name}. Please accept or decline.`,
                type: 'project_invite',
                targetId: parseInt(projectId)
            });
        }

        res.json({ message: `${toInvite.length} invitation(s) sent.`, invited: toInvite.length });
    } catch (error) {
        console.error('Error sending invitations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /invitations/pending
 * Get all pending project invitations for the current user.
 */
const getPendingInvitations = async (req, res) => {
    try {
        const invitations = await ProjectInvitation.findAll({
            where: { userId: req.user.id, status: 'pending' },
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'client', 'projectCode']
                },
                {
                    model: User,
                    as: 'inviter',
                    attributes: ['id', 'username', 'role']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(invitations);
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * PUT /invitations/:id/respond
 * Body: { action: 'accept' | 'decline' }
 * Respond to a project invitation.
 */
const respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be accept or decline.' });
        }

        const invitation = await ProjectInvitation.findOne({
            where: { id, userId: req.user.id, status: 'pending' },
            include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }]
        });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found or already responded.' });
        }

        if (action === 'accept') {
            // Add user to ProjectMembers
            const alreadyMember = await ProjectMember.findOne({
                where: { projectId: invitation.projectId, userId: req.user.id }
            });
            if (!alreadyMember) {
                await ProjectMember.create({
                    projectId: invitation.projectId,
                    userId: req.user.id
                });
            }
            await invitation.update({ status: 'accepted' });

            // Notify the inviter
            await createNotification({
                userId: invitation.invitedBy,
                senderId: req.user.id,
                title: 'Invitation Accepted',
                message: `${req.user.username} accepted your invitation to join ${invitation.project.name}.`,
                type: 'project',
                targetId: invitation.projectId
            });

            res.json({ message: `You have joined ${invitation.project.name}.`, status: 'accepted' });
        } else {
            await invitation.update({ status: 'declined' });

            // Notify the inviter
            await createNotification({
                userId: invitation.invitedBy,
                senderId: req.user.id,
                title: 'Invitation Declined',
                message: `${req.user.username} declined the invitation to join ${invitation.project.name}.`,
                type: 'project',
                targetId: invitation.projectId
            });

            res.json({ message: `You declined the invitation to ${invitation.project.name}.`, status: 'declined' });
        }
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { sendInvitations, getPendingInvitations, respondToInvitation };
