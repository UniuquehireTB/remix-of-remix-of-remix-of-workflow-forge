const { Sheet, SheetShare, User } = require('../models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');

// GET all sheets (owned + shared)
exports.getSheets = async (req, res) => {
  try {
    // 1. Get IDs of sheets shared with me
    const shares = await SheetShare.findAll({
      where: { sharedWithUserId: Number(req.user.id) },
      attributes: ['sheetId']
    });
    const sharedSheetIds = shares.map(s => s.sheetId);

    // 2. Query sheets that are mine OR shared with me
    const sheets = await Sheet.findAll({
      where: {
        [Op.or]: [
          { userId: Number(req.user.id) },
          { id: { [Op.in]: sharedSheetIds } }
        ]
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
      ],
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'name', 'updatedAt', 'userId']
    });
    res.json(sheets);
  } catch (error) {
    console.error('Error fetching sheets:', error);
    res.status(500).json({ message: 'Server error fetching sheets', error: error.message });
  }
};

// GET by id
exports.getSheetById = async (req, res) => {
  try {
    const sheet = await Sheet.findOne({ 
      where: { id: req.params.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { 
          model: SheetShare, 
          as: 'shares', 
          include: [{ model: User, as: 'sharedWithUser', attributes: ['id', 'username', 'email'] }] 
        }
      ]
    });

    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    // Check if user is owner
    const isOwner = Number(sheet.userId) === Number(req.user.id);
    // Check if shared
    const share = sheet.shares?.find(s => Number(s.sharedWithUserId) === Number(req.user.id));
    
    if (!isOwner && !share) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = sheet.toJSON();
    result.canEdit = isOwner || (share && share.canEdit);
    result.isOwner = isOwner;

    res.json(result);
  } catch (error) {
    console.error('Error fetching sheet by id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST create sheet
exports.createSheet = async (req, res) => {
  try {
    const newSheet = await Sheet.create({
      userId: req.user.id,
      name: req.body.name || 'Untitled Sheet',
      data: req.body.data || { columns: [], rows: [] }
    });
    res.status(201).json(newSheet);
  } catch (error) {
    console.error('Error creating sheet:', error);
    res.status(500).json({ message: 'Server error creating sheet' });
  }
};

// PUT update sheet
exports.updateSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOne({ 
      where: { id: req.params.id },
      include: [{ model: SheetShare, as: 'shares' }]
    });

    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    const isOwner = Number(sheet.userId) === Number(req.user.id);
    const share = sheet.shares?.find(s => Number(s.sharedWithUserId) === Number(req.user.id));
    const canEdit = isOwner || (share && share.canEdit);

    if (!canEdit) {
      return res.status(403).json({ message: 'No edit permission' });
    }

    if (req.body.name) sheet.name = req.body.name;
    if (req.body.data) sheet.data = req.body.data;
    await sheet.save();

    res.json(sheet);
  } catch (error) {
    console.error('Error saving sheet:', error);
    res.status(500).json({ message: 'Server error saving sheet' });
  }
};

// DELETE sheet
exports.deleteSheet = async (req, res) => {
  try {
    const deleted = await Sheet.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(403).json({ message: 'Only owners can delete sheets' });
    res.json({ message: 'Sheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting sheet:', error);
    res.status(500).json({ message: 'Server error deleting sheet' });
  }
};

// POST share sheet
exports.shareSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { shares } = req.body; // Array of objects { userId, canEdit }

    const sheet = await Sheet.findOne({ where: { id, userId: req.user.id } });
    if (!sheet) return res.status(404).json({ message: 'Sheet not found or you are not the owner' });

    // Remove old shares and recreate (Syncing)
    await SheetShare.destroy({ where: { sheetId: id } });

    if (shares && Array.isArray(shares)) {
      const shareRecords = shares.map(s => {
        const uid = typeof s === 'object' ? s.userId : s;
        const canEdit = typeof s === 'object' ? !!s.canEdit : false;

        return {
          sheetId: id,
          sharedWithUserId: uid,
          sharedByUserId: req.user.id,
          canEdit: canEdit
        };
      });
      await SheetShare.bulkCreate(shareRecords);

      // Notify each shared user
      for (const s of shares) {
        const uid = typeof s === 'object' ? s.userId : s;
        const canEdit = typeof s === 'object' ? !!s.canEdit : false;
        await createNotification({
          userId: uid,
          senderId: req.user.id,
          title: 'New Sheet Shared',
          message: `A sheet "${sheet.name}" has been shared with you (${canEdit ? 'Edit access' : 'View only'})`,
          type: 'sheet',
          targetId: id
        });
      }
    }

    res.json({ message: 'Sheet shared successfully' });
  } catch (error) {
    console.error('Error sharing sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
