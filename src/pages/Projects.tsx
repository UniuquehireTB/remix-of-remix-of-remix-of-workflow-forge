import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Calendar, Pencil, Trash2, FolderKanban, Building2, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialProjects, Project, projectStatusColors, teamMembers } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyProject()); setEditingId(null); setErrors({}); setDialogOpen(true); };
  const openEdit = (p: Project) => { setEditData({ ...p }); setEditingId(p.id); setErrors({}); setDialogOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editData.name?.trim()) e.name = "Project name is required";
    if (!editData.client?.trim()) e.client = "Client name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingId) {
      setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...editData } as Project : p));
      toast({ title: "✅ Project Updated", description: `${editData.name} has been updated successfully.` });
    } else {
      const newP: Project = {
        id: `p${Date.now()}`, name: editData.name || "Untitled", client: editData.client || "",
        status: (editData.status as any) || "Active", priority: (editData.priority as any) || "Medium",
        progress: editData.progress || 0, members: editData.members || [], techStack: editData.techStack || [],
        dueDate: editData.dueDate || "", description: editData.description || "",
      };
      setProjects(prev => [...prev, newP]);
      toast({ title: "🎉 Project Created", description: `${newP.name} has been created successfully.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast({ title: "🗑️ Project Deleted", description: `${deleteTarget.name} has been removed.`, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  return (
    <AppLayout title="Projects" subtitle="Manage your organization's projects">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl">
          {["All", "Active", "On Hold", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                statusFilter === s
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search projects..." />
          <Button onClick={openCreate} className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {paginated.map((project, i) => (
          <div
            key={project.id}
            className="bg-card border border-border rounded-2xl p-6 card-hover animate-slide-up group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{project.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" />
                    {project.client}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => openEdit(project)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(project)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {project.description && (
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className={cn("text-[10px] font-bold px-2.5 py-1 rounded-lg", projectStatusColors[project.status])}>{project.status}</Badge>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold text-primary">{project.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <AssigneeBadges ids={project.members} max={3} />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">{project.dueDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No projects found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or create a new project</p>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Project" : "Create New Project"} onSave={handleSave}>
        <FormField label="Project Name" icon={FolderKanban} required error={errors.name}>
          <input className="premium-input" placeholder="Enter project name..." value={editData.name || ""} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
        </FormField>
        <FormField label="Client" icon={Building2} required error={errors.client}>
          <input className="premium-input" placeholder="Client or company name..." value={editData.client || ""} onChange={e => setEditData(d => ({ ...d, client: e.target.value }))} />
        </FormField>
        <FormField label="Description" icon={FileText}>
          <textarea className="premium-input min-h-[80px] resize-none" placeholder="Brief project description..." rows={2} value={editData.description || ""} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status" icon={Activity}>
            <select className="premium-select" value={editData.status || "Active"} onChange={e => setEditData(d => ({ ...d, status: e.target.value as any }))}>
              <option>Active</option><option>On Hold</option><option>Completed</option>
            </select>
          </FormField>
          <FormField label="Due Date" icon={Calendar}>
            <input className="premium-input" placeholder="e.g. Mar 15, 2026" value={editData.dueDate || ""} onChange={e => setEditData(d => ({ ...d, dueDate: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Members" icon={Users}>
          <AssigneeSelector selected={editData.members || []} onChange={members => setEditData(d => ({ ...d, members }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name || "project"} />
    </AppLayout>
  );
};

export default Projects;
