import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { projectService } from "@/services/authService";
import { ProjectSidebarForm } from "@/components/ProjectSidebarForm";
import { useToast } from "@/hooks/use-toast";

const Welcome = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState({ name: "", client: "", description: "", members: [] });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [checking, setChecking] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const checkProjects = async () => {
            try {
                const response = await projectService.getAll({ limit: 1 });
                if (response.data.length > 0) {
                    navigate("/tickets", { replace: true });
                }
            } catch (err) {
                console.error("Failed to check projects", err);
            } finally {
                setChecking(false);
            }
        };
        checkProjects();
    }, [navigate]);

    const handleSave = async () => {
        const e: Record<string, string> = {};
        if (!editData.name?.trim()) e.name = "Project name is required";
        if (!editData.client?.trim()) e.client = "Client name is required";
        if (!editData.description?.trim()) e.description = "Description is required";

        if (Object.keys(e).length > 0) {
            setErrors(e);
            toast({ title: "⚠️ Validation Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        try {
            setDialogOpen(false);
            setIsCreating(true);

            await projectService.create({
                ...editData,
                members: editData.members.map((m: any) => typeof m === 'object' ? m.id : m)
            });

            // Simulate real setup time for better UX
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast({ title: "🎉 Project Created", description: "Your first project is ready!" });
            navigate("/tickets", { replace: true });
        } catch (err) {
            setIsCreating(false);
            toast({ title: "❌ Error", description: "Failed to create project", variant: "destructive" });
        }
    };

    if (checking) return null;

    return (
        <AppLayout title="Welcome" subtitle="Get started with your first project" hideNav={true} centerContent={true}>
            <AnimatePresence mode="wait">
                {isCreating ? (
                    <motion.div
                        key="spinner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center space-y-4"
                    >
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FolderKanban className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-black tracking-tight mb-1">Setting up your workspace...</h2>
                            <p className="text-muted-foreground text-sm">Preparing your first project and team dashboard</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6 max-w-xl mx-auto px-8"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FolderKanban className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-black mb-3 tracking-tight text-foreground">Welcome to TrackFlow</h1>
                        <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                            Every great achievement starts with a single project. Create your first workspace to begin tracking tickets and managing your team.
                        </p>
                        <Button
                            onClick={() => setDialogOpen(true)}
                            size="lg"
                            className="rounded-xl px-8 h-12 text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95 bg-primary text-primary-foreground border-none"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Project
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {dialogOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDialogOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
                {dialogOpen && (
                    <ProjectSidebarForm
                        key="project-form"
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        title="Create Project"
                        subtitle="Start a new collaboration space"
                        onSave={handleSave}
                        editData={editData}
                        setEditData={setEditData}
                        errors={errors}
                        setErrors={setErrors}
                        isEditing={false}
                    />
                )}
            </AnimatePresence>
        </AppLayout>
    );
};

export default Welcome;
