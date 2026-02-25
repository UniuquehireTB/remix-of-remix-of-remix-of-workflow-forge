import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { Check, User as UserIcon, Shield, ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Member {
    id: number;
    username: string;
    role: string;
}

interface MemberSelectorProps {
    selected: number[];
    onChange: (ids: number[]) => void;
    canEditMap?: Record<number, boolean>;
    onEditToggle?: (id: number, canEdit: boolean) => void;
    allowedMemberIds?: number[];
}

export function MemberSelector({ selected, onChange, canEditMap, onEditToggle, allowedMemberIds }: MemberSelectorProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await authService.getMembersList();
                // Double check exclusion on frontend
                setMembers(data.filter((m: Member) => m.id !== currentUser?.id));
            } catch (err) {
                console.error("Failed to load members", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [currentUser?.id]);

    const toggle = (id: number) => {
        // If allowedMemberIds is provided, prevent selecting members not in the list
        if (allowedMemberIds && !allowedMemberIds.includes(id)) return;
        onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    };

    const selectAll = () => {
        const targetMembers = allowedMemberIds
            ? members.filter(m => allowedMemberIds.includes(m.id))
            : members;
        onChange(targetMembers.map(m => m.id));
    };

    const clearAll = () => {
        onChange([]);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex gap-2 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-32 bg-muted rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Members</p>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={selectAll} className="text-[10px] font-bold text-primary hover:underline">Select All</button>
                    <button type="button" onClick={clearAll} className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors">Clear All</button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map(m => {
                    const active = selected.includes(m.id);
                    const canEdit = canEditMap ? !!canEditMap[m.id] : false;
                    const isAllowed = !allowedMemberIds || allowedMemberIds.includes(m.id);

                    return (
                        <div
                            key={m.id}
                            className={cn(
                                "group relative flex flex-col p-3 rounded-2xl border-2 transition-all duration-300",
                                active
                                    ? "bg-primary/5 border-primary/30 shadow-sm"
                                    : "border-border hover:border-primary/20 hover:bg-muted/30",
                                !isAllowed && "opacity-40 grayscale cursor-not-allowed border-dashed"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <button
                                    type="button"
                                    disabled={!isAllowed}
                                    onClick={() => toggle(m.id)}
                                    className={cn(
                                        "flex items-center gap-2.5 flex-1 text-left",
                                        !isAllowed && "cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm shrink-0",
                                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {getInitials(m.username)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("text-xs font-bold leading-none truncate", active ? "text-primary" : "text-foreground")}>
                                                {m.username}
                                            </p>
                                            {!isAllowed && (
                                                <span className="text-[8px] font-black uppercase text-destructive/70 bg-destructive/5 px-1.5 py-0.5 rounded-md border border-destructive/10">
                                                    Not In Project
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium truncate mt-1">{m.role}</p>
                                    </div>
                                    {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </button>
                            </div>

                            {active && onEditToggle && (
                                <div className="mt-2 pt-2 border-t border-primary/10 flex items-center justify-between animate-fade-in">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                        {canEdit ? <Shield className="w-3 h-3 text-primary" /> : <ShieldOff className="w-3 h-3" />}
                                        {canEdit ? "Full Access" : "View Only"}
                                    </div>
                                    <Switch
                                        checked={canEdit}
                                        onCheckedChange={(checked) => onEditToggle(m.id, checked)}
                                        className="scale-75"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function MemberBadges({ members, max = 3 }: { members: Member[], max?: number }) {
    if (!members || members.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

    const shown = members.slice(0, max);
    const extra = members.length - max;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

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
