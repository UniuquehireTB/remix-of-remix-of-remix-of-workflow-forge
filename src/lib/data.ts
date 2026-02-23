// Shared types and demo data for the entire app

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TicketStatus = "Open" | "In Progress" | "Review" | "Testing" | "Closed";
export type TicketType = "Bug" | "Feature" | "Improvement" | "Task";
export type TaskStatus = "Open" | "In Progress" | "Review" | "Testing" | "Done";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: "Active" | "On Hold" | "Completed";
  priority: Priority;
  progress: number;
  members: string[]; // team member ids
  techStack: string[];
  dueDate: string;
  description: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  priority: Priority;
  status: TicketStatus;
  assignees: string[]; // team member ids
  projectId: string | null; // null = general
  tags: string[];
  createdDate: string;
  dueDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignees: string[];
  projectId: string | null;
  progress: number;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId: string | null;
  author: string;
  assignees: string[];
  pinned: boolean;
  createdDate: string;
  comments: number;
}

export interface Sheet {
  id: string;
  name: string;
  projectId: string | null;
  assignees: string[];
  columns: SheetColumn[];
  rows: Record<string, string | number | boolean>[];
  createdDate: string;
}

export interface SheetColumn {
  key: string;
  label: string;
  type: "text" | "number" | "status" | "date" | "percent";
}

// Demo team members
export const teamMembers: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", initials: "SC", role: "Developer" },
  { id: "tm2", name: "Alex Kumar", initials: "AK", role: "Designer" },
  { id: "tm3", name: "Mike Johnson", initials: "MJ", role: "Backend Dev" },
  { id: "tm4", name: "Lisa Wang", initials: "LW", role: "QA Engineer" },
  { id: "tm5", name: "James Park", initials: "JP", role: "DevOps" },
  { id: "tm6", name: "Emma Davis", initials: "ED", role: "PM" },
];

export const initialProjects: Project[] = [
  { id: "p1", name: "Mobile App v2", client: "TechCorp", status: "Active", priority: "High", progress: 68, members: ["tm1","tm3","tm4"], techStack: ["React Native","Node.js"], dueDate: "Mar 15, 2026", description: "Complete mobile app redesign" },
  { id: "p2", name: "E-Commerce Platform", client: "ShopWave", status: "Active", priority: "Critical", progress: 42, members: ["tm1","tm2","tm4","tm5"], techStack: ["Next.js","PostgreSQL"], dueDate: "Apr 30, 2026", description: "Full e-commerce solution" },
  { id: "p3", name: "Analytics Dashboard", client: "DataViz Inc", status: "On Hold", priority: "Medium", progress: 85, members: ["tm2","tm6"], techStack: ["React","D3.js"], dueDate: "Feb 28, 2026", description: "Data visualization platform" },
  { id: "p4", name: "API Gateway", client: "CloudFirst", status: "Active", priority: "High", progress: 30, members: ["tm3","tm5"], techStack: ["Go","gRPC"], dueDate: "May 20, 2026", description: "Microservices API gateway" },
];

export const initialTickets: Ticket[] = [
  { id: "TK-1001", title: "Fix login redirect loop on Safari", description: "Users on Safari get stuck in redirect", type: "Bug", priority: "Critical", status: "Open", assignees: ["tm1"], projectId: "p1", tags: ["auth","ios"], createdDate: "Feb 20", dueDate: "Feb 25" },
  { id: "TK-1002", title: "Add export to PDF feature", description: "Allow exporting reports to PDF", type: "Feature", priority: "Medium", status: "In Progress", assignees: ["tm2","tm3"], projectId: "p2", tags: ["export"], createdDate: "Feb 18", dueDate: "Mar 5" },
  { id: "TK-1003", title: "Implement real-time notifications", description: "WebSocket based notifications", type: "Feature", priority: "High", status: "Review", assignees: ["tm3"], projectId: "p1", tags: ["websocket"], createdDate: "Feb 15", dueDate: "Mar 1" },
  { id: "TK-1004", title: "Database query optimization", description: "Slow queries on dashboard", type: "Improvement", priority: "High", status: "Testing", assignees: ["tm5"], projectId: "p4", tags: ["perf"], createdDate: "Feb 12", dueDate: "Feb 28" },
  { id: "TK-1005", title: "E2E tests for checkout flow", description: "Complete test coverage", type: "Task", priority: "High", status: "Closed", assignees: ["tm4"], projectId: "p2", tags: ["qa"], createdDate: "Feb 10", dueDate: "Feb 20" },
  { id: "TK-1006", title: "Update company FAQ page", description: "General content update", type: "Task", priority: "Low", status: "Open", assignees: ["tm6"], projectId: null, tags: ["content"], createdDate: "Feb 22", dueDate: "Mar 10" },
  { id: "TK-1007", title: "Fix broken link in footer", description: "General website fix", type: "Bug", priority: "Medium", status: "Open", assignees: ["tm2"], projectId: null, tags: ["website"], createdDate: "Feb 23", dueDate: "Mar 1" },
];

export const initialTasks: Task[] = [
  { id: "TSK-001", title: "Implement user auth flow", description: "OAuth + email login", priority: "High", status: "In Progress", assignees: ["tm1","tm3"], projectId: "p1", progress: 60, dueDate: "Feb 28", estimatedHours: 16, actualHours: 10 },
  { id: "TSK-002", title: "Design system components", description: "Build reusable UI library", priority: "Medium", status: "In Progress", assignees: ["tm2"], projectId: "p2", progress: 40, dueDate: "Mar 5", estimatedHours: 24, actualHours: 8 },
  { id: "TSK-003", title: "API rate limiting", description: "Implement rate limiter", priority: "Critical", status: "Open", assignees: ["tm3","tm5"], projectId: "p4", progress: 0, dueDate: "Feb 25", estimatedHours: 8, actualHours: 0 },
  { id: "TSK-004", title: "Database migration", description: "Migrate to PostgreSQL 16", priority: "High", status: "Review", assignees: ["tm5"], projectId: "p4", progress: 90, dueDate: "Mar 1", estimatedHours: 12, actualHours: 14 },
  { id: "TSK-005", title: "Update internal wiki", description: "General documentation task", priority: "Low", status: "Open", assignees: ["tm6"], projectId: null, progress: 0, dueDate: "Mar 15", estimatedHours: 4, actualHours: 0 },
  { id: "TSK-006", title: "Setup monitoring alerts", description: "General ops task", priority: "Medium", status: "Done", assignees: ["tm5","tm3"], projectId: null, progress: 100, dueDate: "Feb 20", estimatedHours: 6, actualHours: 5 },
];

export const initialNotes: Note[] = [
  { id: "N-001", title: "API Design Guidelines", content: "RESTful conventions, versioning strategy, and error handling patterns...", projectId: "p4", author: "tm3", assignees: ["tm3","tm5"], pinned: true, createdDate: "Feb 22", comments: 5 },
  { id: "N-002", title: "Sprint 14 Planning", content: "Key objectives: auth overhaul, push notifications, performance...", projectId: "p1", author: "tm1", assignees: ["tm1","tm3","tm4"], pinned: true, createdDate: "Feb 20", comments: 8 },
  { id: "N-003", title: "UX Research Findings", content: "User interviews revealed pain points in data export workflow...", projectId: "p3", author: "tm2", assignees: ["tm2"], pinned: false, createdDate: "Feb 15", comments: 12 },
  { id: "N-004", title: "Office Policies Update", content: "General notes about office policies and procedures...", projectId: null, author: "tm6", assignees: ["tm6"], pinned: false, createdDate: "Feb 18", comments: 2 },
];

export const initialSheets: Sheet[] = [
  {
    id: "SH-001", name: "Budget Tracker", projectId: "p2", assignees: ["tm1","tm6"], createdDate: "Feb 10",
    columns: [
      { key: "item", label: "Item", type: "text" },
      { key: "status", label: "Status", type: "status" },
      { key: "amount", label: "Amount ($)", type: "number" },
      { key: "progress", label: "Progress", type: "percent" },
    ],
    rows: [
      { item: "Design Phase", status: "Done", amount: 5000, progress: 100 },
      { item: "Development", status: "In Progress", amount: 15000, progress: 45 },
      { item: "QA Testing", status: "Open", amount: 3000, progress: 0 },
    ],
  },
  {
    id: "SH-002", name: "General Tracking", projectId: null, assignees: ["tm6","tm5"], createdDate: "Feb 15",
    columns: [
      { key: "task", label: "Task", type: "text" },
      { key: "owner", label: "Owner", type: "text" },
      { key: "due", label: "Due Date", type: "date" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { task: "License renewal", owner: "Emma Davis", due: "Mar 1", status: "Open" },
      { task: "Server maintenance", owner: "James Park", due: "Feb 28", status: "In Progress" },
    ],
  },
];

// Helpers
export function getTeamMember(id: string) {
  return teamMembers.find(m => m.id === id);
}

export function getProject(id: string | null) {
  if (!id) return null;
  return initialProjects.find(p => p.id === id);
}

export const statusColors: Record<string, string> = {
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-warning/10 text-warning",
  Review: "bg-info/10 text-info",
  Testing: "bg-success/10 text-success",
  Closed: "bg-muted text-muted-foreground",
  Done: "bg-success/10 text-success",
};

export const priorityColors: Record<string, string> = {
  Low: "text-muted-foreground",
  Medium: "text-warning",
  High: "text-primary",
  Critical: "text-destructive",
};

export const projectStatusColors: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  "On Hold": "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-muted text-muted-foreground border-border",
};
