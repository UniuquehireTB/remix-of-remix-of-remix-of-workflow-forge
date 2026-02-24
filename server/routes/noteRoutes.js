const express = require('express');
const router = express.Router();
const { getAllNotes, createNote, updateNote, deleteNote, togglePin, shareNote } = require('../controllers/noteController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllNotes);
router.post('/', authMiddleware, createNote);
router.put('/:id', authMiddleware, updateNote);
router.delete('/:id', authMiddleware, deleteNote);
router.put('/:id/pin', authMiddleware, togglePin);
router.post('/:id/share', authMiddleware, shareNote);

module.exports = router;
