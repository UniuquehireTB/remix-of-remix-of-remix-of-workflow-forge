import { useState, useEffect, useRef } from "react";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { Check, User as UserIcon, Shield, ShieldOff, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { format } from "date-fns";

interface Member {
    id: number;
    username: string;
    role: string;
}

const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";
};

interface MemberSelectorProps {
    label?: string;
    icon?: any;
    error?: string;
    selected: any[]; // Array of ids (numbers) or objects {id, joinDate}
    onChange: (assignees: any[]) => void;
    canEditMap?: Record<number, boolean>;
    onEditToggle?: (id: number, canEdit: boolean) => void;
    allowedMemberIds?: number[];
    variant?: "tickets" | "notes" | "projects";
    showSelf?: boolean;
    showTeam?: boolean;
    startDate?: string;
    endDate?: string;
}

export function MemberSelector({
    label,
    icon: Icon,
    selected,
    error,
    onChange,
    canEditMap,
    onEditToggle,
    allowedMemberIds,
    variant = "tickets",
    showSelf = true,
    showTeam = true,
    startDate,
    endDate,
}: MemberSelectorProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const currentUser = authService.getCurrentUser();

    const isTickets = variant === "tickets";

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await authService.getMembersList();
                setMembers(data);
            } catch (err) {
                console.error("Failed to load members", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, []);



    const isSelfSelected = selected.some(s => String(typeof s === 'object' ? s.id : s) === String(currentUser?.id));
    const hasTeamSelected = selected.some(s => String(typeof s === 'object' ? s.id : s) !== String(currentUser?.id));

    const isMemberSelected = (id: any) => {
        return selected.some(s => {
            const sid = typeof s === 'object' ? s.id : s;
            return String(sid) === String(id);
        });
    };

    const getJoinDate = (id: number) => {
        const found = selected.find(s => (typeof s === 'object' ? s.id : s) === id);
        return typeof found === 'object' ? found.joinDate : "";
    };

    const toggleMember = (id: number) => {
        if (allowedMemberIds && !allowedMemberIds.includes(id)) return;

        if (isMemberSelected(id)) {
            onChange(selected.filter(s => {
                const sid = typeof s === 'object' ? s.id : s;
                return String(sid) !== String(id);
            }));
        } else {
            const newItem = isTickets
                ? { id, joinDate: "" }
                : id;
            onChange([...selected, newItem]);
        }
    };

    const updateJoinDate = (id: number, date: string) => {
        onChange(selected.map(s => {
            const sid = typeof s === 'object' ? s.id : s;
            if (sid === id) return { id: sid, joinDate: date };
            return s;
        }));
    };

    const hasAllTeamSelected = members.length > 1 && members.filter(m => String(m.id) !== String(currentUser?.id)).every(m => isMemberSelected(m.id));

    const toggleAllTeam = (e: React.MouseEvent) => {
        e.stopPropagation();
        const teamMembers = members.filter(m => m.id !== currentUser?.id);
        const teamIds = teamMembers.map(m => m.id);

        if (hasAllTeamSelected) {
            // Remove all team
            onChange(selected.filter(s => {
                const sid = typeof s === 'object' ? s.id : s;
                return String(sid) === String(currentUser?.id);
            }));
        } else {
            // Add all team without default date
            const newTeam = teamMembers.map(m => {
                const existing = selected.find(s => (typeof s === 'object' ? s.id : s) === m.id);
                if (existing) return existing;
                return isTickets ? { id: m.id, joinDate: "" } : m.id;
            });
            const self = selected.find(s => String(typeof s === 'object' ? s.id : s) === String(currentUser?.id));
            onChange(self ? [self, ...newTeam] : newTeam);
        }
    };

    const filteredMembers = members.filter(m =>
        String(m.id) !== String(currentUser?.id) &&
        (m.username.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return <div className="h-12 bg-muted/20 animate-pulse rounded-xl" />;
    }

    const showSummaryList = isTickets && selected.length > 0;

    return (
        <div className="space-y-1.5 relative" ref={containerRef}>
            {/* Top Row: Label and Quick Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
                    <span className="text-sm font-bold text-foreground tracking-tight">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Self Button */}
                    {showSelf && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleMember(currentUser?.id); }}
                            className={cn(
                                "h-7 px-3 rounded-full border-2 transition-all font-bold text-[9px] flex items-center gap-1.5 uppercase tracking-tighter",
                                isSelfSelected
                                    ? "bg-success/10 border-success/30 text-success"
                                    : "bg-background border-border text-muted-foreground hover:border-primary/30"
                            )}
                        >
                            <UserIcon className="w-3 h-3" />
                            Self
                            {isSelfSelected && <CheckCircle2 className="w-3 h-3 text-success fill-success/10" />}
                        </button>
                    )}

                    {/* Team Button */}
                    {showTeam && (
                        <button
                            type="button"
                            onClick={toggleAllTeam}
                            className={cn(
                                "h-7 px-3 rounded-full border-2 transition-all font-bold text-[9px] flex items-center gap-1.5 uppercase tracking-tighter",
                                hasAllTeamSelected
                                    ? "bg-success/10 border-success/30 text-success"
                                    : "bg-background border-border text-muted-foreground hover:border-primary/30"
                            )}
                        >
                            <Shield className="w-3 h-3" />
                            Team
                            {hasAllTeamSelected && <CheckCircle2 className="w-3 h-3 text-success fill-success/10" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Middle Row: Searchable Input Dropdown */}
            <Popover open={showDropdown} onOpenChange={setShowDropdown}>
                <PopoverAnchor asChild>
                    <div
                        className={cn(
                            "min-h-[44px] py-1.5 rounded-xl border-2 bg-muted/10 transition-all flex flex-wrap items-center px-3 gap-2 group cursor-text",
                            "hover:border-primary/30",
                            showDropdown ? "border-primary shadow-sm" : (error ? "border-destructive" : "border-border")
                        )}
                        onClick={() => {
                            setShowDropdown(true);
                            inputRef.current?.focus();
                        }}
                    >
                        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            <AnimatePresence>
                                {selected.map((s) => {
                                    const id = typeof s === 'object' ? s.id : s;
                                    const joinDate = typeof s === 'object' ? s.joinDate : "";

                                    // Robust member lookup including current user fallback
                                    let m = members.find(member => String(member.id) === String(id));

                                    // If not found in members list, check if it's the current user
                                    if (!m && currentUser && String(currentUser.id) === String(id)) {
                                        m = currentUser;
                                    }

                                    if (!m) return null;

                                    const isInvalid = (() => {
                                        if (!joinDate) return false;
                                        const d = new Date(joinDate);
                                        if (startDate && d < new Date(startDate)) return true;
                                        if (endDate && d > new Date(endDate)) return true;
                                        return false;
                                    })();

                                    return (
                                        <motion.div
                                            key={id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className={cn(
                                                "h-8 bg-background border rounded-xl pl-1 pr-1 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 shadow-sm transition-colors group/badge",
                                                isInvalid ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-primary/30"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black shrink-0">
                                                {String(m.id) === String(currentUser?.id) ? "S" : getInitials(m.username)}
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground whitespace-nowrap">
                                                {String(m.id) === String(currentUser?.id) ? "Self" : m.username}
                                            </span>

                                            {/* Date selection inside badge */}
                                            {isTickets && (
                                                <div className="flex items-center gap-1.5 ml-1">
                                                    <div className="h-4 w-px bg-border/60 mx-1" />
                                                    {!joinDate ? (
                                                        <AnimatedDatePicker
                                                            value=""
                                                            onChange={(v) => updateJoinDate(id, v)}
                                                            className="w-auto"
                                                            disabled={!startDate}
                                                            minDate={startDate}
                                                            triggerClassName="h-6 w-6 p-0 border-none bg-primary/5 hover:bg-primary/10 text-primary !rounded-lg flex items-center justify-center transition-colors"
                                                            placeholder=""
                                                        />
                                                    ) : (
                                                        <AnimatedDatePicker
                                                            value={joinDate}
                                                            onChange={(v) => updateJoinDate(id, v)}
                                                            className="w-auto"
                                                            disabled={!startDate && !endDate}
                                                            minDate={startDate}
                                                            maxDate={endDate}
                                                            triggerClassName="flex shadow-none border-none p-0 bg-transparent h-auto"
                                                        >
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border animate-in fade-in zoom-in-95 duration-200 cursor-pointer transition-colors",
                                                                isInvalid
                                                                    ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                                                                    : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                                            )}>
                                                                <span className="text-[9px] font-black uppercase tracking-tight">
                                                                    START-
                                                                    {(() => {
                                                                        try {
                                                                            const d = new Date(joinDate);
                                                                            return isNaN(d.getTime()) ? "" : format(d, "MMM d");
                                                                        } catch { return ""; }
                                                                    })()}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateJoinDate(id, "");
                                                                    }}
                                                                    className={cn(
                                                                        "w-3.5 h-3.5 rounded-md flex items-center justify-center transition-colors",
                                                                        isInvalid ? "hover:bg-destructive/30" : "hover:bg-primary/30"
                                                                    )}
                                                                >
                                                                    <X className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>
                                                        </AnimatedDatePicker>
                                                    )}
                                                </div>
                                            )}

                                            {/* Access toggle inside badge for notes */}
                                            {!isTickets && onEditToggle && (
                                                <div className="flex items-center gap-1.5 ml-0.5">
                                                    <div className="h-4 w-px bg-border/60 mx-1" />
                                                    <Switch
                                                        checked={!!canEditMap?.[id]}
                                                        onCheckedChange={(v) => onEditToggle(id, v)}
                                                        className="scale-[0.6] data-[state=checked]:bg-success"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMember(id);
                                                }}
                                                className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={selected.length === 0 ? "Search and select members..." : ""}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onFocus={() => setShowDropdown(true)}
                                className="bg-transparent border-none outline-none text-sm font-medium flex-1 min-w-[120px] placeholder:text-muted-foreground/50 h-7"
                            />
                        </div>
                        <PopoverTrigger asChild>
                            <button className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0">
                                <ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />
                            </button>
                        </PopoverTrigger>
                    </div>
                </PopoverAnchor>

                <PopoverContent
                    className="p-0 border-none bg-transparent shadow-none z-[100]"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    style={{ width: containerRef.current?.offsetWidth }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-popover border border-border rounded-2xl shadow-2xl backdrop-blur-xl mx-1"
                    >
                        <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Available Members</span>
                            {selected.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onChange([])}
                                    className="text-[9px] font-bold text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="max-h-[260px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
                            {filteredMembers.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground font-medium">No members found matching your search</p>
                                </div>
                            ) : (
                                filteredMembers.map(m => {
                                    const active = isMemberSelected(m.id);
                                    const isAllowed = !allowedMemberIds || allowedMemberIds.includes(m.id);

                                    return (
                                        <div
                                            key={m.id}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-xl border-2 transition-all",
                                                active ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted/50",
                                                !isAllowed && "opacity-40 grayscale cursor-not-allowed"
                                            )}
                                        >
                                            <div
                                                className="flex items-center gap-2.5 flex-1 cursor-pointer"
                                                onClick={() => isAllowed && toggleMember(m.id)}
                                            >
                                                <div className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0",
                                                    active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {getInitials(m.username)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn("text-xs font-bold truncate tracking-tight", active ? "text-primary" : "text-foreground")}>{m.username}</p>
                                                    <p className="text-[8px] text-muted-foreground font-semibold uppercase leading-none">{m.role}</p>
                                                </div>
                                            </div>

                                            {/* Right side Detail Section */}
                                            <div className="flex items-center gap-2">
                                                {active && isTickets && (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                                        {!getJoinDate(m.id) ? (
                                                            <AnimatedDatePicker
                                                                value=""
                                                                onChange={(v) => updateJoinDate(m.id, v)}
                                                                className="w-auto"
                                                                disabled={!startDate && !endDate}
                                                                minDate={startDate}
                                                                maxDate={endDate}
                                                                triggerClassName="h-9 w-9 p-0 rounded-xl border-2 border-border/50 bg-background hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-sm"
                                                                placeholder=""
                                                            />
                                                        ) : (
                                                            <AnimatedDatePicker
                                                                value={getJoinDate(m.id)}
                                                                onChange={(v) => updateJoinDate(m.id, v)}
                                                                className="w-auto"
                                                                disabled={!startDate && !endDate}
                                                                minDate={startDate}
                                                                maxDate={endDate}
                                                                triggerClassName="flex shadow-none border-none p-0 bg-transparent h-auto"
                                                            >
                                                                <div className="flex items-center gap-2 bg-primary/10 text-primary border-2 border-primary/20 px-3 py-1.5 rounded-xl shadow-sm animate-in zoom-in-95 duration-200 cursor-pointer hover:bg-primary/20 transition-all">
                                                                    <div className="flex flex-col items-start -space-y-0.5">
                                                                        <span className="text-[7px] font-black uppercase tracking-widest opacity-60 text-primary/70">START DATE</span>
                                                                        <span className="text-[10px] font-black tracking-tight">
                                                                            {(() => {
                                                                                try {
                                                                                    const d = new Date(getJoinDate(m.id));
                                                                                    return isNaN(d.getTime()) ? "" : format(d, "MMM d, yyyy");
                                                                                } catch { return ""; }
                                                                            })()}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateJoinDate(m.id, "");
                                                                        }}
                                                                        className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors ml-1"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </AnimatedDatePicker>
                                                        )}
                                                        <div className="bg-success text-white p-1 rounded-full shadow-md shrink-0 ring-4 ring-success/10">
                                                            <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                        </div>
                                                    </div>
                                                )}
                                                {active && !isTickets && onEditToggle && (
                                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
                                                        <Switch
                                                            checked={!!canEditMap?.[m.id]}
                                                            onCheckedChange={(v) => onEditToggle(m.id, v)}
                                                            className="scale-75"
                                                        />
                                                        <div className="bg-success text-white p-1 rounded-full shadow-sm shrink-0">
                                                            <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                        </div>
                                                    </div>
                                                )}
                                                {active && !isTickets && !onEditToggle && (
                                                    <div className="bg-success text-white p-1 rounded-full shadow-sm">
                                                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </PopoverContent>
            </Popover>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-destructive/90 font-medium pl-0.5"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

export function MemberBadges({ members, max = 3 }: { members: Member[], max?: number }) {
    if (!members || members.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

    const shown = members.slice(0, max);
    const extra = members.length - max;

    return (
        <div className="flex items-center -space-x-1.5">
            {shown.map(m => (
                <div
                    key={m.id}
                    title={`${m.username} (${m.role})`}
                    className="w-7 h-7 rounded-lg bg-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary shadow-sm"
                >
                    {getInitials(m.username)}
                </div>
            ))}
            {extra > 0 && (
                <div className="w-7 h-7 rounded-lg bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                    +{extra}
                </div>
            )}
        </div>
    );
}


