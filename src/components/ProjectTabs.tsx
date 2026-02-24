import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Project {
    id: any;
    name: string;
}

interface ProjectTabsProps {
    projects: Project[];
    activeProjectId: any;
    onChange: (id: any) => void;
}

export function ProjectTabs({ projects, activeProjectId, onChange }: ProjectTabsProps) {
    const tabs = [
        { id: "All", name: "All Projects" },
        { id: "General", name: "General" },
        ...projects.map(p => ({ id: p.id, name: p.name }))
    ];

    return (
        <div className="w-full border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-[64px] z-30 mb-6 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full">
                <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-1" style={{ scrollbarWidth: 'none' }}>
                    {tabs.map((tab) => {
                        const isActive = activeProjectId.toString() === tab.id.toString();
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                className={cn(
                                    "relative py-3 px-3 first:pl-0 text-sm font-bold transition-all duration-200 whitespace-nowrap",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.name}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
