import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Pencil, Trash2, FolderKanban, Building2, FileText, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { MemberSelector, MemberBadges } from "@/components/MemberSelector";
import { projectStatusColors } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { projectService, authService } from "@/services/authService";

const CAN_MANAGE_PROJECTS = ['Architect', 'Manager', 'System Architect', 'Senior Developer', 'Technical Analyst'];

const PAGE_SIZE = 10;

interface Project {
  id: number;
  name: string;
  client: string;
  description: string;
  members: any[];
}

const emptyProject = (): Partial<Project> => ({
  name: "", client: "",
  members: [], description: "",
});

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalItems: 0, itemsLeft: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editData, setEditData] = useState<Partial<Project>>(emptyProject());
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentUser = authService.getCurrentUser();
  const canManage = CAN_MANAGE_PROJECTS.includes(currentUser?.role || '');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectService.getAll({
        search,
        page,
        limit: PAGE_SIZE
      });
      setProjects(response.data);
      setPagination(response.pagination);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, page]);

  const openCreate = () => {
    setEditData(emptyProject());
    setEditingId(null);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditData({
      ...p,
      members: p.members?.map(m => m.id)
    });
    setEditingId(p.id);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (skipToast = false) => {
    const e: Record<string, string> = {};
    if (!editData.name?.trim()) e.name = "Project name is required";
    if (!editData.client?.trim()) e.client = "Client name is required";
    if (!editData.description?.trim()) e.description = "Description is required";
    setErrors(e);
    if (!skipToast && Object.keys(e).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(e).join(" • "), variant: "destructive" });
    }
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = {
        ...editData,
        members: editData.members?.map((m: any) => typeof m === 'object' ? m.id : m)
      };

      if (editingId) {
        await projectService.update(editingId, payload);
        toast({ title: "✅ Project Updated", description: `${editData.name} has been updated successfully.` });
      } else {
        await projectService.create(payload);
        toast({ title: "🎉 Project Created", description: `${editData.name} has been created successfully.` });
      }
      fetchProjects();
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to save project", variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Projects" subtitle="Manage your organization's projects">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search projects by title or client..." />
        </div>
        <div className="flex items-center gap-3">
          {pagination.itemsLeft > 0 && (
            <Badge variant="secondary" className="px-3 py-1.5 rounded-xl bg-primary/5 text-primary border-primary/10">
              {pagination.itemsLeft} items left
            </Badge>
          )}
          {canManage && (
            <Button onClick={openCreate} className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 shrink-0">
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/20 rounded-2xl p-6 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate pr-2">{project.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {project.client}
                        </p>
                      </div>
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl bg-popover border border-border shadow-xl z-50">
                          <DropdownMenuItem onClick={() => openEdit(project)} className="cursor-pointer">
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(project)} className="text-destructive cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3 min-h-[3rem]">{project.description}</p>

                  <div className="flex items-center justify-between pt-5 border-t border-border/50">
                    <MemberBadges members={project.members} max={4} />
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        {project.members?.length || 0}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-24 glass rounded-3xl border-dashed border-2">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold mb-2">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your search or create a new project.</p>
            </div>
          )}

          <div className="mt-12 flex items-center justify-center">
            <PaginationControls page={page} totalPages={pagination.totalPages} onPageChange={setPage} totalItems={pagination.totalItems} pageSize={PAGE_SIZE} />
          </div>
        </>
      )}

      <CrudDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Project" : "Create Project"}
        subtitle={editingId ? "Modify project information" : "Start a new collaboration space"}
        icon={<FolderKanban className="w-5 h-5" />}
        onSave={handleSave}
        saveLabel={editingId ? "Update Project" : "Create Project"}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Project Name" icon={FolderKanban} required error={errors.name}>
              <input className={cn("premium-input", errors.name && "!border-destructive focus:ring-destructive/20")}
                placeholder="Enter project name..." value={editData.name || ""} onChange={e => { setEditData(d => ({ ...d, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }} />
            </FormField>
            <FormField label="Client" icon={Building2} required error={errors.client}>
              <input className={cn("premium-input", errors.client && "!border-destructive focus:ring-destructive/20")}
                placeholder="Client or company name..." value={editData.client || ""} onChange={e => { setEditData(d => ({ ...d, client: e.target.value })); setErrors(p => ({ ...p, client: "" })); }} />
            </FormField>
          </div>
          <FormField label="Description" icon={FileText} required error={errors.description}>
            <textarea className={cn("premium-input min-h-[100px] resize-none", errors.description && "!border-destructive focus:ring-destructive/20")}
              placeholder="Brief project description..." rows={3} value={editData.description || ""} onChange={e => { setEditData(d => ({ ...d, description: e.target.value })); setErrors(p => ({ ...p, description: "" })); }} />
          </FormField>
          <FormField label="Members" icon={Users}>
            <MemberSelector
              variant="projects"
              showSelf={false}
              showTeam={false}
              selected={editData.members || []}
              onChange={members => setEditData(d => ({ ...d, members }))}
            />
          </FormField>
        </div>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { }} itemName={deleteTarget?.name || "project"} />
    </AppLayout>
  );
};

export default Projects;
