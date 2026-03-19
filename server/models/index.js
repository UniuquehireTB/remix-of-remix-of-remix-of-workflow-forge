const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const ProjectInvitation = require('./ProjectInvitation');
const Ticket = require('./Ticket');
const TicketAssignee = require('./TicketAssignee');
const Note = require('./Note');
const NoteShare = require('./NoteShare');
const Notification = require('./Notification');
const Comment = require('./Comment');
const Sheet = require('./Sheet');
const SheetShare = require('./SheetShare');

// Project <-> User (Members)
Project.belongsToMany(User, { through: ProjectMember, as: 'members', foreignKey: 'projectId' });
User.belongsToMany(Project, { through: ProjectMember, as: 'projects', foreignKey: 'userId' });

Project.hasMany(ProjectMember, { foreignKey: 'projectId' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(ProjectMember, { foreignKey: 'userId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });

// ProjectInvitation associations
Project.hasMany(ProjectInvitation, { foreignKey: 'projectId', as: 'invitations' });
ProjectInvitation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(ProjectInvitation, { foreignKey: 'userId', as: 'receivedInvitations' });
ProjectInvitation.belongsTo(User, { foreignKey: 'userId', as: 'invitee' });

User.hasMany(ProjectInvitation, { foreignKey: 'invitedBy', as: 'sentInvitations' });
ProjectInvitation.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });

// Project <-> Ticket
Project.hasMany(Ticket, { foreignKey: 'projectId', as: 'tickets' });
Ticket.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Ticket <-> User (Assignees)
Ticket.belongsToMany(User, { through: TicketAssignee, as: 'assignees', foreignKey: 'ticketId' });
User.belongsToMany(Ticket, { through: TicketAssignee, as: 'assignedTickets', foreignKey: 'userId' });

Ticket.hasMany(TicketAssignee, { foreignKey: 'ticketId' });
TicketAssignee.belongsTo(Ticket, { foreignKey: 'ticketId' });

// User <-> Note
User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Project <-> Note
Project.hasMany(Note, { foreignKey: 'projectId', as: 'notes' });
Note.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Note <-> NoteShare
Note.hasMany(NoteShare, { foreignKey: 'noteId', as: 'shares' });
NoteShare.belongsTo(Note, { foreignKey: 'noteId' });

User.hasMany(NoteShare, { foreignKey: 'sharedWithUserId', as: 'receivedNotes' });
NoteShare.belongsTo(User, { foreignKey: 'sharedWithUserId', as: 'sharedWithUser' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Ticket <-> Comment
Ticket.hasMany(Comment, { foreignKey: 'ticketId', as: 'comments' });
Comment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Sheet
User.hasMany(Sheet, { foreignKey: 'userId', as: 'sheets' });
Sheet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sheet <-> SheetShare
Sheet.hasMany(SheetShare, { foreignKey: 'sheetId', as: 'shares' });
SheetShare.belongsTo(Sheet, { foreignKey: 'sheetId' });

User.hasMany(SheetShare, { foreignKey: 'sharedWithUserId', as: 'receivedSheets' });
SheetShare.belongsTo(User, { foreignKey: 'sharedWithUserId', as: 'sharedWithUser' });

module.exports = {
    User,
    Project,
    ProjectMember,
    ProjectInvitation,
    Ticket,
    TicketAssignee,
    Note,
    NoteShare,
    Notification,
    Comment,
    Sheet,
    SheetShare
};
