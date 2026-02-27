const { Note, Project, NoteShare, User } = require('../models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');

const getAllNotes = async (req, res) => {
    try {
        const { search, type, projectId, filter = 'All', page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        // Get IDs of notes shared with me
        const sharedNoteRecords = await NoteShare.findAll({
            where: { sharedWithUserId: req.user.id },
            attributes: ['noteId', 'canEdit']
        });
        const sharedNoteIds = sharedNoteRecords.map(r => r.noteId);
        const editPermissions = Object.fromEntries(sharedNoteRecords.map(r => [r.noteId, r.canEdit]));

        const whereClause = {
            isActive: true,
            ...(search && {
                [Op.or]: [
                    { title: { [Op.iLike]: `%${search}%` } },
                    { content: { [Op.iLike]: `%${search}%` } }
                ]
            }),
            ...(type && type !== 'All' && { type }),
            ...(projectId && projectId !== 'undefined' && projectId !== 'All' && {
                projectId: projectId === 'null' ? null : projectId
            })
        };

        // Filter logic
        if (filter === 'SharedWithMe') {
            whereClause.id = { [Op.in]: sharedNoteIds };
        } else if (filter === 'SharedByMe') {
            // Get IDs of notes I've shared with others
            const mySharedNoteRecords = await NoteShare.findAll({
                where: { sharedByUserId: req.user.id },
                attributes: ['noteId']
            });
            const mySharedNoteIds = [...new Set(mySharedNoteRecords.map(r => r.noteId))];
            whereClause.id = { [Op.in]: mySharedNoteIds };
        } else {
            // Default: All (Mine + Shared with me)
            whereClause[Op.and] = [
                {
                    [Op.or]: [
                        { userId: req.user.id },
                        { id: { [Op.in]: sharedNoteIds } }
                    ]
                }
            ];
        }

        const { count, rows } = await Note.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                { model: User, as: 'user', attributes: ['id', 'username', 'role'] },
                {
                    model: NoteShare,
                    as: 'shares',
                    attributes: ['id', 'noteId', 'sharedWithUserId', 'canEdit'],
                    include: [{ model: User, as: 'sharedWithUser', attributes: ['id', 'username'] }]
                }
            ],
            order: [
                ['pinned', 'DESC'],
                ['createdAt', 'DESC']
            ],
            distinct: true
        });

        // Add permission flag to each note
        const data = rows.map(note => {
            const noteObj = note.toJSON();
            noteObj.canEdit = note.userId === req.user.id || !!editPermissions[note.id];
            return noteObj;
        });

        res.json({
            data,
            pagination: {
                totalItems: count,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createNote = async (req, res) => {
    try {
        const { title, content, type, listItems, projectId, pinned } = req.body;

        const note = await Note.create({
            title,
            content,
            type: type || 'note',
            listItems,
            projectId: projectId || null,
            pinned: pinned || false,
            userId: req.user.id,
            createdBy: req.user.id,
            modifiedBy: req.user.id
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type, listItems, projectId, pinned } = req.body;

        const note = await Note.findByPk(id);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        // Check ownership or shared edit permission
        let hasPermission = note.userId === req.user.id;
        if (!hasPermission) {
            const share = await NoteShare.findOne({
                where: { noteId: id, sharedWithUserId: req.user.id, canEdit: true }
            });
            if (share) hasPermission = true;
        }

        if (!hasPermission) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        await note.update({
            title,
            content,
            type,
            listItems,
            projectId,
            pinned: note.userId === req.user.id ? pinned : note.pinned, // Only owner can change pinned status? Or allow both?
            modifiedBy: req.user.id
        });

        // If updated by someone else, notify the owner
        if (note.userId !== req.user.id) {
            await createNotification({
                userId: note.userId,
                senderId: req.user.id,
                title: 'Shared Note Updated',
                message: `${req.user.username} updated your shared note: ${title}`,
                type: 'note',
                targetId: note.id
            });
        }

        res.json(note);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const shareNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { shares } = req.body; // Array of objects { userId, canEdit }

        const note = await Note.findOne({ where: { id, userId: req.user.id } });
        if (!note) return res.status(404).json({ message: 'Note not found' });

        // Remove old shares and recreate (Syncing)
        await NoteShare.destroy({ where: { noteId: id } });

        if (shares && Array.isArray(shares)) {
            const shareRecords = shares.map(s => {
                const uid = typeof s === 'object' ? s.userId : s;
                const canEdit = typeof s === 'object' ? !!s.canEdit : false;

                return {
                    noteId: id,
                    sharedWithUserId: uid,
                    sharedByUserId: req.user.id,
                    canEdit: canEdit
                };
            });
            await NoteShare.bulkCreate(shareRecords);

            // Notify each shared user
            for (const s of shares) {
                const uid = typeof s === 'object' ? s.userId : s;
                const canEdit = typeof s === 'object' ? !!s.canEdit : false;
                await createNotification({
                    userId: uid,
                    senderId: req.user.id,
                    title: 'New Note Shared',
                    message: `A note "${note.title}" has been shared with you (${canEdit ? 'Edit access' : 'View only'})`,
                    type: 'note',
                    targetId: id
                });
            }
        }

        res.json({ message: 'Note shared successfully' });
    } catch (error) {
        console.error('Error sharing note:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findOne({ where: { id, userId: req.user.id } });
        if (!note) return res.status(404).json({ message: 'Note not found' });

        // Soft delete
        await note.update({ isActive: false, modifiedBy: req.user.id });
        res.json({ message: 'Note deleted' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const togglePin = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findOne({ where: { id, userId: req.user.id } });
        if (!note) return res.status(404).json({ message: 'Note not found' });

        await note.update({ pinned: !note.pinned, modifiedBy: req.user.id });
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    shareNote
};
