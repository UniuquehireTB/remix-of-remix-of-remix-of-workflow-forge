const express = require('express');
const router = express.Router();
const { getAllProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { sendInvitations } = require('../controllers/invitationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllProjects);
router.post('/', authMiddleware, createProject);
router.put('/:id', authMiddleware, updateProject);
router.delete('/:id', authMiddleware, deleteProject);
router.post('/:id/invite', authMiddleware, sendInvitations);
router.post('/:id/leave', authMiddleware, async (req, res) => {
    try {
        const { ProjectMember } = require('../models');
        const destroyed = await ProjectMember.destroy({
            where: { projectId: req.params.id, userId: req.user.id }
        });
        if (!destroyed) {
            return res.status(404).json({ message: 'You are not a member of this project.' });
        }
        res.json({ message: 'You have left the project.' });
    } catch (error) {
        console.error('Error leaving project:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
