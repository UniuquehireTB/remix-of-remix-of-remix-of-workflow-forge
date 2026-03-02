import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Pencil, Trash2, FolderKanban, Building2, FileText, LayoutGrid, LifeBuoy } from "lucide-react";
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
  projectCode?: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentUser = authService.getCurrentUser();
  const canManage = CAN_MANAGE_PROJECTS.includes(currentUser?.role || '');

  const location = useLocation();
  const navigate = useNavigate();
  const isFirstTime = location.state?.firstTime;

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

      // If no projects found and no search is active, go to welcome
      if (response.data.length === 0 && !search && page === 1) {
        navigate("/welcome", { replace: true });
      }
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // If we're redirected here specifically to create the first project, open the dialog automatically
    if (isFirstTime && !dialogOpen && projects.length === 0 && !loading) {
      openCreate();
    }
  }, [search, page, isFirstTime]);

  useEffect(() => {
    if (descriptionTarget) {
      const updated = projects.find(p => p.id === descriptionTarget.id);
      if (updated) {
        setDescriptionTarget(updated);
      }
    }
  }, [projects]);

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
      toast({ title: "Validation Error", description: Object.values(e).join(" • "), variant: "destructive" });
    }
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const startTime = Date.now();
    setIsSaving(true);
    try {
      const payload = {
        ...editData,
        members: editData.members?.map((m: any) => typeof m === 'object' ? m.id : m)
      };

      if (editingId) {
        const updatedProject = await projectService.update(editingId, payload);
        toast({ title: "Project Updated", description: `${editData.name} has been updated successfully.`, variant: "success" });

        // If we are currently viewing this project in the details drawer, update it immediately
        if (descriptionTarget?.id === editingId) {
          setDescriptionTarget(updatedProject);
        }
      } else {
        await projectService.create(payload);
        toast({ title: "Project Created", description: `${editData.name} has been created successfully.`, variant: "success" });

        if (projects.length === 0) {
          navigate("/tickets");
          return;
        }
      }
      await fetchProjects();
      setEditingId(null);
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save project", variant: "destructive" });
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setIsSaving(false), Math.max(0, 1500 - elapsed));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await projectService.delete(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Project Deleted", description: `${deleteTarget.name} has been removed.`, variant: "success" });
      fetchProjects();
      if (descriptionTarget?.id === deleteTarget.id) setDescriptionTarget(null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout title="Projects" subtitle="Manage your organization's projects">
      <div className="flex-1 overflow-y-auto premium-scrollbar px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 py-1 w-full">
            <div className="flex-1 max-w-sm flex bg-white border border-border rounded-[3px] h-9 transition-all duration-200 focus-within:ring-1 focus-within:ring-[#0052CC] focus-within:border-[#0052CC] group">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Search projects..."
                className="w-full h-full"
                inputClassName="h-full !py-0 !rounded-[2px] !bg-transparent border-none focus:ring-0 shadow-none text-[14px]"
              />
            </div>
            <div className="flex items-center gap-3">
              {canManage && (
                <Button
                  onClick={openCreate}
                  className="gap-2 rounded-[3px] px-4 h-9 shrink-0 bg-[#0052CC] hover:bg-[#0747A6] text-white border-none transition-all font-bold text-[14px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-44 bg-[#F4F5F7] rounded-[3px] border border-border" />
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setDescriptionTarget(project)}
                      className={cn(
                        "group relative bg-white border border-border shadow-sm hover:shadow-md hover:border-[#4C9AFF] rounded-[3px] p-5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full ring-offset-0",
                        descriptionTarget?.id === project.id && "ring-2 ring-[#0052CC] ring-offset-0"
                      )}
                    >
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-[3px] bg-[#0052CC] flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-[18px]">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-[16px] text-[#172B4D] truncate group-hover:text-[#0052CC] transition-colors">{project.name}</h3>
                            <p className="text-[12px] text-[#6B778C] flex items-center gap-1.5 mt-0.5 font-medium">
                              <Building2 className="w-3 h-3" />
                              {project.client}
                            </p>
                          </div>
                        </div>

                        <p className="text-[14px] text-[#42526E] line-clamp-2 min-h-[2.5rem] leading-relaxed italic opacity-80">
                          {project.description || "No description provided."}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#6B778C]" />
                          <span className="text-[12px] font-bold text-[#42526E]">{project.members?.length || 0}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#6B778C] bg-[#F4F5F7] px-2 py-0.5 rounded-[2px] border border-border">
                          {project.projectCode || "N/A"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-12 flex items-center justify-center">
                <PaginationControls
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={pagination.totalItems}
                  pageSize={PAGE_SIZE}
                  className="rounded-[3px]"
                />
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
                key={`project-detail-${descriptionTarget.id}`}
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
                isSaving={isSaving}
              />
            )}
          </AnimatePresence>

          <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name || "project"} loading={isDeleting} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Projects;
