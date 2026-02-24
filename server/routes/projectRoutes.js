const express = require('express');
const router = express.Router();
const { getAllProjects, createProject, updateProject } = require('../controllers/projectController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllProjects);
router.post('/', authMiddleware, createProject);
router.put('/:id', authMiddleware, updateProject);

module.exports = router;
