import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Calendar, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialProjects, Project, projectStatusColors, priorityColors, teamMembers } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 6;

const emptyProject = (): Partial<Project> => ({
  name: "", client: "", status: "Active", priority: "Medium", progress: 0,
  members: [], techStack: [], dueDate: "", description: "",
});

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editData, setEditData] = useState<Partial<Project>>(emptyProject());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [techInput, setTechInput] = useState("");

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyProject()); setEditingId(null); setDialogOpen(true); setTechInput(""); };
  const openEdit = (p: Project) => { setEditData({ ...p }); setEditingId(p.id); setDialogOpen(true); setTechInput(p.techStack.join(", ")); };

  const handleSave = () => {
    const tech = techInput.split(",").map(s => s.trim()).filter(Boolean);
    if (editingId) {
      setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...editData, techStack: tech } as Project : p));
    } else {
      const newP: Project = {
        id: `p${Date.now()}`, name: editData.name || "Untitled", client: editData.client || "",
        status: (editData.status as any) || "Active", priority: (editData.priority as any) || "Medium",
        progress: editData.progress || 0, members: editData.members || [], techStack: tech,
        dueDate: editData.dueDate || "", description: editData.description || "",
      };
      setProjects(prev => [...prev, newP]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <AppLayout title="Projects" subtitle="Manage your organization's projects">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {["All","Active","On Hold","Completed"].map(s => (
            <Button key={s} variant={statusFilter === s ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search projects..." />
          <Button size="sm" className="gap-1.5 text-xs shrink-0" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map((project, i) => (
          <div key={project.id} className="bg-card border border-border rounded-lg p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{project.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground p-1"><MoreHorizontal className="w-4 h-4" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(project)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(project)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className={cn("text-[10px] font-medium", projectStatusColors[project.status])}>{project.status}</Badge>
              <span className={cn("text-[10px] font-semibold", priorityColors[project.priority])}>{project.priority}</span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {project.techStack.map(t => (
                <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{t}</span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
              <AssigneeBadges ids={project.members} max={3} />
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{project.dueDate}</span></div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No projects found.</p>}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      {/* Create / Edit Dialog */}
      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Project" : "New Project"} onSave={handleSave}>
        <FormField label="Name">
          <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.name || ""} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
        </FormField>
        <FormField label="Client">
          <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.client || ""} onChange={e => setEditData(d => ({ ...d, client: e.target.value }))} />
        </FormField>
        <FormField label="Description">
          <textarea className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" rows={2} value={editData.description || ""} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Status">
            <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.status || "Active"} onChange={e => setEditData(d => ({ ...d, status: e.target.value as any }))}>
              <option>Active</option><option>On Hold</option><option>Completed</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.priority || "Medium"} onChange={e => setEditData(d => ({ ...d, priority: e.target.value as any }))}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </FormField>
        </div>
        <FormField label="Due Date">
          <input type="text" className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" placeholder="e.g. Mar 15, 2026" value={editData.dueDate || ""} onChange={e => setEditData(d => ({ ...d, dueDate: e.target.value }))} />
        </FormField>
        <FormField label="Tech Stack (comma-separated)">
          <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={techInput} onChange={e => setTechInput(e.target.value)} />
        </FormField>
        <FormField label="Members">
          <AssigneeSelector selected={editData.members || []} onChange={members => setEditData(d => ({ ...d, members }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name || "project"} />
    </AppLayout>
  );
};

export default Projects;
