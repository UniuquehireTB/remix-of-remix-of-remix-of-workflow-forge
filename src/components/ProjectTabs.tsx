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
    scrolled?: boolean;
}

export function ProjectTabs({ projects, activeProjectId, onChange, scrolled }: ProjectTabsProps) {
    const tabs = [
        { id: "All", name: "All Projects" },
        ...projects.map(p => ({ id: p.id, name: p.name }))
    ];

    return (
        <div className={cn(
            "w-full border-b backdrop-blur-xl z-30 flex-shrink-0 transition-all duration-300",
            scrolled
                ? "bg-card/70 border-border/60 shadow-sm"
                : "bg-background/20 border-transparent"
        )}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-10 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {tabs.map((tab) => {
                        const isActive = activeProjectId.toString() === tab.id.toString();
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                className={cn(
                                    "relative py-4 px-1 text-[13px] font-bold transition-all duration-200 whitespace-nowrap",
                                    isActive ? "text-primary" : "text-slate-500 hover:text-foreground"
                                )}
                            >
                                {tab.name}
                                {isActive && (
                                    <motion.div
                                        layoutId="projectActiveTab"
                                        className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-primary rounded-t-sm"
                                        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
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
