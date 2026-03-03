import { useState, useEffect, useRef } from "react";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { Check, User as UserIcon, Shield, ShieldOff, X, ChevronDown, CheckCircle2, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { format } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    selected: any[]; // Array of ids (numbers) or objects {id, startDate, endDate}
    onChange: (assignees: any[]) => void;
    canEditMap?: Record<number, boolean>;
    onEditToggle?: (id: number, canEdit: boolean) => void;
    allowedMemberIds?: number[];
    variant?: "tickets" | "notes" | "projects";
    showSelf?: boolean;
    showTeam?: boolean;
    startDate?: string;
    endDate?: string;
    labelClassName?: string;
    required?: boolean;
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
    labelClassName,
    required = false,
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

    const getMemberDate = (id: number, type: 'start' | 'end') => {
        const found = selected.find(s => (typeof s === 'object' ? s.id : s) === id);
        if (typeof found !== 'object') return "";
        return type === 'start' ? found.startDate : found.endDate;
    };

    const toggleMember = (id: number) => {
        const alreadySelected = isMemberSelected(id);
        // Only block ADDING if not in allowedMemberIds — never block REMOVING
        if (!alreadySelected && allowedMemberIds && !allowedMemberIds.some(aid => String(aid) === String(id))) return;

        if (alreadySelected) {
            onChange(selected.filter(s => {
                const sid = typeof s === 'object' ? s.id : s;
                return String(sid) !== String(id);
            }));
        } else {
            const newItem = isTickets
                ? { id, startDate: "", endDate: "" }
                : id;
            onChange([...selected, newItem]);
        }
    };

    const updateMemberDate = (id: number, type: 'start' | 'end', date: string) => {
        onChange(selected.map(s => {
            const sid = typeof s === 'object' ? s.id : s;
            if (sid === id) {
                return {
                    ...s,
                    id: sid,
                    [type === 'start' ? 'startDate' : 'endDate']: date
                };
            }
            return s;
        }));
    };

    const eligibleTeamMembers = members.filter(m =>
        String(m.id) !== String(currentUser?.id) &&
        (!allowedMemberIds || allowedMemberIds.some(aid => String(aid) === String(m.id)))
    );

    const hasAllTeamSelected = eligibleTeamMembers.length > 0 && eligibleTeamMembers.every(m => isMemberSelected(m.id));
    const hasAnyTeamSelected = eligibleTeamMembers.some(m => isMemberSelected(m.id));

    const toggleAllTeam = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (hasAllTeamSelected) {
            // Remove all team
            onChange(selected.filter(s => {
                const sid = typeof s === 'object' ? s.id : s;
                return String(sid) === String(currentUser?.id);
            }));
        } else {
            // Add all team without default date
            const newTeam = eligibleTeamMembers.map(m => {
                const existing = selected.find(s => (typeof s === 'object' ? s.id : s) === m.id);
                if (existing) return existing;
                return isTickets ? { id: m.id, startDate: "", endDate: "" } : m.id;
            });
            const self = selected.find(s => String(typeof s === 'object' ? s.id : s) === String(currentUser?.id));
            onChange(self ? [self, ...newTeam] : newTeam);
        }
    };

    const filteredMembers = members.filter(m =>
        String(m.id) !== String(currentUser?.id) &&
        // If allowedMemberIds is set (e.g. ticket has a project), only show project members
        (!allowedMemberIds || allowedMemberIds.some(aid => String(aid) === String(m.id))) &&
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
                    {Icon && <Icon className="w-3.5 h-3.5 text-[#6B778C]" />}
                    <span className={cn("text-[12px] font-bold text-[#6B778C] tracking-tight", labelClassName)}>
                        {label}
                        {required && <span className="text-[#DE350B] ml-1">*</span>}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Self Button */}
                    {showSelf && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleMember(currentUser?.id); }}
                            className={cn(
                                "h-7 px-3 rounded-[3px] border transition-all font-bold text-[10px] flex items-center gap-1.5",
                                isSelfSelected
                                    ? "bg-[#E3FCEF] border-[#00875A]/20 text-[#006644]"
                                    : "bg-white border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"
                            )}
                        >
                            <UserIcon className="w-3 h-3" />
                            Self
                            {isSelfSelected && <CheckCircle2 className="w-3 h-3 text-[#00875A]" />}
                        </button>
                    )}

                    {/* Team Button */}
                    {showTeam && (
                        <button
                            type="button"
                            onClick={toggleAllTeam}
                            className={cn(
                                "h-7 px-3 rounded-[3px] border transition-all font-bold text-[10px] flex items-center gap-1.5",
                                hasAnyTeamSelected
                                    ? "bg-[#E3FCEF] border-[#00875A]/20 text-[#006644]"
                                    : "bg-white border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"
                            )}
                        >
                            <Shield className="w-3 h-3" />
                            Team
                            {hasAnyTeamSelected && <CheckCircle2 className="w-3 h-3 text-[#00875A]" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Middle Row: Searchable Input Dropdown */}
            <Popover open={showDropdown} onOpenChange={setShowDropdown}>
                <PopoverAnchor asChild>
                    <div
                        className={cn(
                            "min-h-[40px] py-1 rounded-[3px] border bg-white transition-all flex flex-wrap items-center px-3 gap-2 group cursor-text",
                            "hover:bg-[#F4F5F7] hover:border-[#DFE1E6]",
                            showDropdown ? "border-[#4C9AFF] bg-white ring-2 ring-[#4C9AFF]/20" : (error ? "border-[#DE350B]" : "border-[#A5ADBA]")
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
                                    const memberStartDate = typeof s === 'object' ? s.startDate : "";
                                    const memberEndDate = typeof s === 'object' ? s.endDate : "";

                                    let m = members.find(member => String(member.id) === String(id));
                                    if (!m && currentUser && String(currentUser.id) === String(id)) {
                                        m = currentUser;
                                    }

                                    if (!m) return null;

                                    const isInvalid = (() => {
                                        if (memberStartDate && startDate && new Date(memberStartDate) < new Date(startDate)) return true;
                                        if (memberStartDate && endDate && new Date(memberStartDate) > new Date(endDate)) return true;
                                        return false;
                                    })();

                                    return (
                                        <motion.div
                                            key={id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={cn(
                                                "h-7 bg-white border border-[#DFE1E6] rounded-[3px] px-1 py-0.5 flex items-center gap-1.5 shadow-sm group/badge",
                                                isInvalid && "border-[#DE350B] bg-[#FFEBE6]"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-5 h-5 rounded-[2px] bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {String(m.id) === String(currentUser?.id) ? "S" : getInitials(m.username)}
                                            </div>
                                            <span className="text-[12px] font-bold text-[#172B4D] whitespace-nowrap">
                                                {String(m.id) === String(currentUser?.id) ? currentUser?.username : m.username}
                                            </span>

                                            {isTickets && (
                                                <div className="flex items-center gap-1 h-full">
                                                    <div className="h-4 w-px bg-[#DFE1E6] mx-0.5" />
                                                    <div className="flex items-center gap-0.5">
                                                        {/* Start Date */}
                                                        <AnimatedDatePicker
                                                            value={memberStartDate}
                                                            onChange={(v) => updateMemberDate(id, 'start', v)}
                                                            className="w-auto"
                                                            minDate={startDate}
                                                            maxDate={endDate}
                                                            disabled={!endDate}
                                                            clearable
                                                            triggerClassName={cn(
                                                                "h-6 min-w-[24px] px-1 rounded-[3px] flex items-center justify-center gap-1.5 transition-colors",
                                                                memberStartDate ? "bg-[#F4F5F7] text-[#42526E] border border-[#DFE1E6]" : "text-[#42526E] hover:bg-[#F4F5F7]",
                                                                !endDate && "opacity-40 grayscale cursor-not-allowed"
                                                            )}
                                                            placeholder=""
                                                            showIcon={true}
                                                            icon={
                                                                !endDate ? (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="w-3.5 h-3.5 opacity-60"><Calendar className="w-full h-full" /></div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="bg-[#172B4D] text-white text-[10px] py-1 px-2 border-none font-bold">Set ticket Due Date first</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                ) : (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="w-3.5 h-3.5 opacity-60"><Calendar className="w-full h-full" /></div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="bg-[#172B4D] text-white text-[10px] py-1 px-2 border-none font-bold">
                                                                                {startDate ? `Range: ${format(new Date(startDate), "MMM d")} - ${format(new Date(endDate), "MMM d")}` : `Must be before ${format(new Date(endDate), "MMM d")}`}
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )
                                                            }
                                                        >
                                                            {memberStartDate && (
                                                                <div className="flex flex-col items-start pr-1 -space-y-0.5">
                                                                    <span className="text-[7px] font-bold text-[#6B778C]/70 uppercase tracking-tighter">Start</span>
                                                                    <span className="text-[9px] font-bold text-[#172B4D]">
                                                                        {(() => {
                                                                            const d = new Date(memberStartDate);
                                                                            return !isNaN(d.getTime()) ? format(d, "MMM d") : "";
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </AnimatedDatePicker>
                                                    </div>
                                                </div>
                                            )}

                                            {!isTickets && onEditToggle && (
                                                <div className="flex items-center gap-1.5 h-full">
                                                    <div className="h-4 w-px bg-[#DFE1E6] mx-0.5" />
                                                    <Switch
                                                        checked={!!canEditMap?.[id]}
                                                        onCheckedChange={(v) => onEditToggle(id, v)}
                                                        className="scale-[0.55] data-[state=checked]:bg-[#00875A]"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMember(id);
                                                }}
                                                className="w-5 h-5 rounded-[2px] flex items-center justify-center hover:bg-[#F4F5F7] text-[#6B778C] transition-colors"
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
                                className="bg-transparent border-none outline-none text-[14px] font-medium flex-1 min-w-[120px] placeholder:text-[#6B778C]/50 h-7 text-[#172B4D]"
                            />
                        </div>
                        <PopoverTrigger asChild>
                            <button className="text-[#6B778C]/70 hover:text-[#0052CC] transition-colors shrink-0 p-1">
                                <ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />
                            </button>
                        </PopoverTrigger>
                    </div>
                </PopoverAnchor>

                <PopoverContent
                    className="p-0 border-none bg-transparent shadow-none z-[1000]"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    style={{ width: containerRef.current?.offsetWidth }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="bg-white border border-[#DFE1E6] rounded-[3px] shadow-[0_8px_24px_rgba(23,43,77,0.12)] max-w-full"
                    >
                        <div className="px-4 py-2.5 border-b border-[#DFE1E6] bg-white flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#6B778C] tracking-wide">Available members</span>
                            {selected.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onChange([])}
                                    className="text-[12px] font-bold text-[#0052CC] hover:underline px-1"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto premium-scrollbar p-1.5 space-y-0.5">
                            {filteredMembers.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-[13px] text-[#6B778C] font-medium leading-relaxed">No members found matching your search</p>
                                </div>
                            ) : (
                                filteredMembers.map(m => {
                                    const active = isMemberSelected(m.id);

                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => toggleMember(m.id)}
                                            className={cn(
                                                "flex items-center justify-between p-2 pl-3 pr-4 rounded-[3px] border border-transparent transition-all cursor-pointer group/item",
                                                active ? "bg-[#F4F5F7]" : "hover:bg-[#FAFBFC] hover:border-[#4C9AFF]/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-[3px] flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                                                    active ? "bg-[#0052CC] text-white" : "bg-[#EBECF0] text-[#42526E]"
                                                )}>
                                                    {getInitials(m.username)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn("text-[13px] font-bold truncate tracking-tight", active ? "text-[#0052CC]" : "text-[#172B4D]")}>{m.username}</p>
                                                    <p className="text-[12px] text-[#6B778C] font-medium">{m.role}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {active && (
                                                    <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                        {isTickets && getMemberDate(m.id, 'start') && (
                                                            <div className="flex flex-col items-end opacity-60">
                                                                <span className="text-[8px] font-bold text-[#6B778C]">Start</span>
                                                                <span className="text-[10px] font-bold text-[#172B4D]">
                                                                    {(() => {
                                                                        const d = new Date(getMemberDate(m.id, 'start'));
                                                                        return !isNaN(d.getTime()) ? format(d, "MMM d") : "";
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="w-6 h-6 rounded-full bg-[#E3FCEF] flex items-center justify-center border border-[#00875A]/20">
                                                            <Check className="w-3.5 h-3.5 text-[#00875A] stroke-[3px]" />
                                                        </div>
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
                        className="text-[11px] text-[#DE350B] font-bold pl-0.5 mt-1"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

export function MemberBadges({ members, max = 3 }: { members: Member[], max?: number }) {
    if (!members || members.length === 0) return <span className="text-[12px] text-[#6B778C]">—</span>;

    const shown = members.slice(0, max);
    const extra = members.length - max;

    return (
        <div className="flex items-center -space-x-2">
            {shown.map(m => (
                <div
                    key={m.id}
                    title={`${m.username} (${m.role})`}
                    className="w-7 h-7 rounded-[3px] bg-[#0052CC] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-offset-0"
                >
                    {getInitials(m.username)}
                </div>
            ))}
            {extra > 0 && (
                <div className="w-7 h-7 rounded-[3px] bg-[#F4F5F7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#42526E]">
                    +{extra}
                </div>
            )}
        </div>
    );
}


