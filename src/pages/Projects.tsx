import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Pencil, Trash2, FolderKanban, Building2, FileText, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { DeleteDialog } from "@/components/CrudDialog";
import { MemberBadges } from "@/components/MemberSelector";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { projectService, authService } from "@/services/authService";
import { ProjectSidebarForm } from "@/components/ProjectSidebarForm";
import { ProjectDetailView } from "@/components/ProjectDetailView";

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
  const [descriptionTarget, setDescriptionTarget] = useState<Project | null>(null);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectService.delete(deleteTarget.id);
      toast({ title: "🗑️ Project Deleted", description: `${deleteTarget.name} has been removed.`, variant: "destructive" });
      fetchProjects();
      if (descriptionTarget?.id === deleteTarget.id) setDescriptionTarget(null);
      setDeleteTarget(null);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Projects" subtitle="Manage your organization's projects">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 py-1">
        <div className="flex-1 max-w-md flex bg-muted/30 p-1 rounded-xl border border-border/50 h-9 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-card">
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search projects by title or client..."
            className="w-full h-full"
            inputClassName="h-full !py-0 !rounded-lg !bg-transparent border-none focus:ring-0 shadow-none"
          />
        </div>
        <div className="flex items-center gap-3">
          {pagination.itemsLeft > 0 && (
            <Badge variant="secondary" className="px-3 py-1.5 rounded-xl bg-primary/5 text-primary border-primary/10 h-9 flex items-center">
              {pagination.itemsLeft} items left
            </Badge>
          )}
          {canManage && (
            <Button
              onClick={openCreate}
              className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 h-9 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold text-xs">Create Project</span>
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
                  onClick={() => setDescriptionTarget(project)}
                  className={cn(
                    "group relative bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/20 rounded-2xl p-6 transition-all duration-300 cursor-pointer",
                    descriptionTarget?.id === project.id && "ring-2 ring-primary/20 bg-primary/5"
                  )}
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
                    {/* Dropdown removed per user request */}
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

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {(dialogOpen || descriptionTarget) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setDescriptionTarget(null);
              setDialogOpen(false);
            }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebars */}
      <AnimatePresence mode="popLayout">
        {descriptionTarget && (
          <ProjectDetailView
            key={`detail-${descriptionTarget.id}`}
            project={descriptionTarget}
            onClose={() => setDescriptionTarget(null)}
            onEdit={(p) => openEdit(p)}
            onDelete={(p) => setDeleteTarget(p)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {dialogOpen && (
          <ProjectSidebarForm
            key="project-form"
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title={editingId ? "Edit Project" : "Create Project"}
            subtitle={editingId ? "Modify project information" : "Start a new collaboration space"}
            onSave={handleSave}
            editData={editData}
            setEditData={setEditData}
            errors={errors}
            setErrors={setErrors}
            isEditing={!!editingId}
          />
        )}
      </AnimatePresence>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name || "project"} />
    </AppLayout>
  );
};

export default Projects;
