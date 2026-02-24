const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Ticket = require('./Ticket');
const TicketAssignee = require('./TicketAssignee');
const Note = require('./Note');
const NoteShare = require('./NoteShare');
const Notification = require('./Notification');

// Project <-> User (Members)
Project.belongsToMany(User, { through: ProjectMember, as: 'members', foreignKey: 'projectId' });
User.belongsToMany(Project, { through: ProjectMember, as: 'projects', foreignKey: 'userId' });

Project.hasMany(ProjectMember, { foreignKey: 'projectId' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(ProjectMember, { foreignKey: 'userId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });

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

module.exports = {
    User,
    Project,
    ProjectMember,
    Ticket,
    TicketAssignee,
    Note,
    NoteShare,
    Notification
};
