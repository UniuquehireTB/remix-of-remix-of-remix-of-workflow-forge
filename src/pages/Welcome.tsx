import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FolderKanban, Ticket, FileText, Users, ArrowRight, CheckCircle2, Zap, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { projectService, authService } from "@/services/authService";
import { ProjectSidebarForm } from "@/components/ProjectSidebarForm";
import { useToast } from "@/hooks/use-toast";

const features = [
    {
        icon: Ticket,
        title: "Issue Tracking",
        desc: "Create, assign, and prioritize tickets. Track bugs and features with full lifecycle management.",
        color: "#0052CC",
        bg: "#DEEBFF",
    },
    {
        icon: LayoutDashboard,
        title: "Project Boards",
        desc: "Visualize work across projects. Filter by status, priority, type, and assignee in seconds.",
        color: "#00875A",
        bg: "#E3FCEF",
    },
    {
        icon: FileText,
        title: "Notes & Checklists",
        desc: "Capture decisions, requirements, and task lists — linked directly to your projects.",
        color: "#BF2600",
        bg: "#FFEBE6",
    },
    {
        icon: Users,
        title: "Team Collaboration",
        desc: "Invite members, assign roles, share notes, and track who's working on what.",
        color: "#5243AA",
        bg: "#EAE6FF",
    },
];

const Welcome = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState({ name: "", client: "", description: "", members: [] });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [checking, setChecking] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const currentUser = authService.getCurrentUser();

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
            toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        const startTime = Date.now();
        setIsSaving(true);
        try {
            await projectService.create({
                ...editData,
                members: editData.members.map((m: any) => typeof m === 'object' ? m.id : m)
            });

            const elapsed = Date.now() - startTime;
            setTimeout(() => {
                setIsSaving(false);
                setDialogOpen(false);
                setIsCreating(true);
                setTimeout(() => {
                    toast({ title: "Project Created", description: "Your first project is ready!", variant: "success" });
                    navigate("/tickets", { replace: true });
                }, 1500);
            }, Math.max(0, 1500 - elapsed));
        } catch (err) {
            setIsSaving(false);
            toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
        }
    };

    if (checking) return null;

    return (
        <AppLayout title="Welcome" subtitle="Get started with your first project" hideLinks={true}>
            <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
                <AnimatePresence mode="wait">
                    {isCreating ? (
                        <motion.div
                            key="spinner"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] space-y-5"
                        >
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-[#0052CC]/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FolderKanban className="w-8 h-8 text-[#0052CC]" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-[20px] font-bold text-[#172B4D] tracking-tight mb-1">Setting up your workspace...</h2>
                                <p className="text-[14px] text-[#6B778C]">Preparing your first project and team dashboard</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-[1100px] mx-auto px-6 py-12"
                        >
                            {/* Hero Section */}
                            <div className="bg-white rounded-[4px] border border-[#DFE1E6] shadow-sm overflow-hidden mb-8">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Left: Blue accent panel */}
                                    <div className="lg:w-2 bg-[#0052CC] shrink-0" />

                                    {/* Right: Content */}
                                    <div className="flex-1 px-8 py-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-[3px] bg-[#DEEBFF] flex items-center justify-center">
                                                    <FolderKanban className="w-5 h-5 text-[#0052CC]" />
                                                </div>
                                                <span className="text-[12px] font-bold text-[#0052CC] uppercase tracking-widest">TrackFlow</span>
                                            </div>
                                            <h1 className="text-[28px] font-bold text-[#172B4D] leading-tight tracking-tight mb-3">
                                                Welcome{currentUser?.username ? `, ${currentUser.username}` : ""}! 👋
                                            </h1>
                                            <p className="text-[15px] text-[#42526E] leading-relaxed max-w-md mb-6">
                                                You're all set up and ready to go. Create your first project to start tracking tickets, managing your team, and shipping faster.
                                            </p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Button
                                                    onClick={() => setDialogOpen(true)}
                                                    className="rounded-[3px] px-6 h-10 text-[14px] font-bold bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-none gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Create your first project
                                                </Button>
                                                <span className="text-[12px] text-[#6B778C] font-medium flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00875A]" />
                                                    Free to start, no credit card required
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats badges */}
                                        <div className="flex flex-col gap-3 shrink-0">
                                            {[
                                                { label: "Projects", value: "0", hint: "Create your first" },
                                                { label: "Tickets", value: "0", hint: "Once you have a project" },
                                                { label: "Team Members", value: "1", hint: "Just you for now" },
                                            ].map((stat) => (
                                                <div key={stat.label} className="flex items-center gap-4 bg-[#F4F5F7] border border-[#DFE1E6] rounded-[3px] px-5 py-3 min-w-[200px]">
                                                    <div className="text-[24px] font-bold text-[#172B4D] leading-none">{stat.value}</div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-[#172B4D]">{stat.label}</div>
                                                        <div className="text-[11px] text-[#6B778C]">{stat.hint}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Grid */}
                            <h2 className="text-[13px] font-bold text-[#6B778C] uppercase tracking-widest mb-4">What you can do with TrackFlow</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {features.map((f, i) => (
                                    <motion.div
                                        key={f.title}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.07 }}
                                        className="bg-white border border-[#DFE1E6] rounded-[4px] p-5 hover:shadow-md hover:border-[#4C9AFF] transition-all duration-200 group cursor-default"
                                    >
                                        <div
                                            className="w-9 h-9 rounded-[3px] flex items-center justify-center mb-4"
                                            style={{ background: f.bg }}
                                        >
                                            <f.icon className="w-4.5 h-4.5" style={{ color: f.color }} />
                                        </div>
                                        <h3 className="text-[14px] font-bold text-[#172B4D] mb-2 group-hover:text-[#0052CC] transition-colors">{f.title}</h3>
                                        <p className="text-[13px] text-[#6B778C] leading-relaxed">{f.desc}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Quick start strip */}
                            <div className="bg-[#172B4D] rounded-[4px] px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[3px] bg-[#0052CC] flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-bold text-white mb-0.5">Ready to get started?</div>
                                        <div className="text-[13px] text-[#B3BAC5]">Create a project and invite your team — takes less than 2 minutes.</div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setDialogOpen(true)}
                                    className="rounded-[3px] px-6 h-9 text-[13px] font-bold bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-none gap-2 shrink-0"
                                >
                                    Get started
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>
        </AppLayout>
    );
};

export default Welcome;
