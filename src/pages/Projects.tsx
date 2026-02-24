import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Pencil, Trash2, FolderKanban, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialProjects, Project, projectStatusColors } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const PAGE_SIZE = 8;

const emptyProject = (): Partial<Project> => ({
  name: "", client: "", status: "Active", priority: "Medium", progress: 0,
  members: [], techStack: [], dueDate: "", description: "",
});

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editData, setEditData] = useState<Partial<Project>>(emptyProject());
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyProject()); setEditingId(null); setErrors({}); setDialogOpen(true); };
  const openEdit = (p: Project) => { setEditData({ ...p }); setEditingId(p.id); setErrors({}); setDialogOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editData.name?.trim()) e.name = "Project name is required";
    if (!editData.client?.trim()) e.client = "Client name is required";
    if (!editData.description?.trim()) e.description = "Description is required";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(e).join(" • "), variant: "destructive" });
    }
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
        status: "Active", priority: "Medium",
        progress: 0, members: editData.members || [], techStack: [],
        dueDate: "", description: editData.description || "",
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
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search projects..." className="w-full sm:max-w-sm" />
        <Button onClick={openCreate} className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 shrink-0">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-2xl p-5 card-hover group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{project.name}</h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" />
                    {project.client}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl bg-popover border border-border shadow-xl z-50">
                  <DropdownMenuItem onClick={() => openEdit(project)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(project)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {project.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
            )}

            <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg mb-3", projectStatusColors[project.status])}>{project.status}</Badge>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <AssigneeBadges ids={project.members} max={3} />
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> {project.members.length}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No projects found</p>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Project" : "Add Project"} onSave={handleSave}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Project Name" icon={FolderKanban} required error={errors.name}>
            <input className={cn("premium-input", errors.name && "border-destructive focus:ring-destructive/20 focus:border-destructive")}
              placeholder="Enter project name..." value={editData.name || ""} onChange={e => { setEditData(d => ({ ...d, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }} />
          </FormField>
          <FormField label="Client" icon={Building2} required error={errors.client}>
            <input className={cn("premium-input", errors.client && "border-destructive focus:ring-destructive/20 focus:border-destructive")}
              placeholder="Client or company name..." value={editData.client || ""} onChange={e => { setEditData(d => ({ ...d, client: e.target.value })); setErrors(p => ({ ...p, client: "" })); }} />
          </FormField>
        </div>
        <FormField label="Description" icon={FileText} required error={errors.description}>
          <textarea className={cn("premium-input min-h-[100px] resize-none", errors.description && "border-destructive focus:ring-destructive/20 focus:border-destructive")}
            placeholder="Brief project description..." rows={3} value={editData.description || ""} onChange={e => { setEditData(d => ({ ...d, description: e.target.value })); setErrors(p => ({ ...p, description: "" })); }} />
        </FormField>
        <FormField label="Members" icon={Users}>
          <AssigneeSelector selected={editData.members || []} onChange={members => setEditData(d => ({ ...d, members }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name || "project"} />
    </AppLayout>
  );
};

export default Projects;
