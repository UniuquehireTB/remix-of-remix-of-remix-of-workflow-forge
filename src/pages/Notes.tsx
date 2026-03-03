import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { DeleteDialog, CrudDialog } from "@/components/CrudDialog";
import { FilterDropdown, AnimatedDropdown } from "@/components/AnimatedDropdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectTabs } from "@/components/ProjectTabs";
import { Pin, Trash2, Check, List, FileText, X, ChevronRight, Hash, Share2, Users, Shield, ShieldAlert, ShieldOff, CheckCircle2, Pencil } from "lucide-react";
import { projectService, noteService, authService } from "@/services/authService";
import { MemberSelector } from "@/components/MemberSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormField } from "@/components/FormField";
import { Switch } from "@/components/ui/switch";

const PAGE_SIZE = 12;

interface NoteItem {
  id: number;
  title: string;
  content: string;
  type: "note" | "list";
  listItems?: { id: string; text: string; checked: boolean }[];
  pinned: boolean;
  projectId: any | null;
  userId: number;
  user?: { id: number; username: string };
  shares?: any[];
  canEdit?: boolean;
}

const noteColors = [
  "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/30",
  "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/30",
  "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/30",
  "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/30",
  "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800/30",
  "bg-card border-border",
];

const Notes = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("All");
  const [projectFilter, setProjectFilter] = useState<any>("All");
  const [deleteTarget, setDeleteTarget] = useState<NoteItem | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [createType, setCreateType] = useState<"note" | "list">("note");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newProjectId, setNewProjectId] = useState<any | null>(null);
  const [newListItems, setNewListItems] = useState<{ id: string; text: string; checked: boolean }[]>([{ id: "new1", text: "", checked: false }]);
  const [loading, setLoading] = useState(true);

  // Sharing State
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<NoteItem | null>(null);
  const [sharedUserIds, setSharedUserIds] = useState<number[]>([]);
  const [sharePermissions, setSharePermissions] = useState<Record<number, boolean>>({});

  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 10);
  };

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUser = authService.getCurrentUser();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await noteService.getAll({
        search,
        type: typeFilter,
        filter: ownershipFilter,
        projectId: projectFilter === "All" ? undefined : projectFilter,
        page,
        limit: PAGE_SIZE
      });
      setNotes(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      toast({ title: "❌ Error", description: err.response?.data?.error || "Failed to load notes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll({ limit: 100 });
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [search, typeFilter, ownershipFilter, projectFilter, page]);



  useEffect(() => {
    fetchProjects();
  }, []);

  const openNoteDetail = (note: NoteItem) => {
    setActiveNote(note);
    setEditingId(note.id);
    setCreateType(note.type);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewProjectId(note.projectId);
    setNewListItems(note.listItems || [{ id: "new1", text: "", checked: false }]);
    setPanelMode("edit");
    setIsEditing(false); // Initially read-only
    setPanelOpen(true);
  };

  const openShare = (note: NoteItem) => {
    setShareTarget(note);
    const ids = note.shares?.map(s => s.sharedWithUser.id) || [];
    const perms: Record<number, boolean> = {};
    note.shares?.forEach(s => {
      perms[s.sharedWithUser.id] = !!s.canEdit;
    });
    setSharedUserIds(ids);
    setSharePermissions(perms);
    setShareOpen(true);
  };

  const handleShare = async () => {
    if (!shareTarget) return;
    const startTime = Date.now();
    setIsSharing(true);
    try {
      const shares = sharedUserIds.map(uid => ({
        userId: uid,
        canEdit: !!sharePermissions[uid]
      }));
      await noteService.share(shareTarget.id, shares);
      toast({ title: "Permissions Updated", description: "Sharing permissions updated.", variant: "success" });
      setShareOpen(false);
      fetchNotes();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update sharing", variant: "destructive" });
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setIsSharing(false), Math.max(0, 1500 - elapsed));
    }
  };

  const togglePermission = (userId: number, canEdit: boolean) => {
    setSharePermissions(prev => ({ ...prev, [userId]: canEdit }));
  };

  const openCreate = (type: "note" | "list") => {
    setActiveNote(null);
    setCreateType(type);
    setNewTitle("");
    setNewContent("");
    setNewProjectId(projectFilter === "All" ? (projects.length > 0 ? projects[0].id : null) : projectFilter);
    setNewListItems([{ id: "new1", text: "", checked: false }]);
    setEditingId(null); // Fix: Reset editingId so auto-save works for the next new note
    setPanelMode("create");
    setIsEditing(true); // Create mode should allow editing immediately
    setPanelOpen(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast({ title: "Title Required", description: "Please enter a title.", variant: "warning" });
      return;
    }
    const startTime = Date.now();
    setIsSaving(true);
    const payload = {
      title: newTitle.trim() || "Untitled",
      content: createType === "note" ? newContent.trim() : "",
      type: createType,
      listItems: createType === "list" ? newListItems.filter(i => i.text.trim()) : undefined,
      projectId: newProjectId,
    };
    try {
      const response = await noteService.create(payload);

      // Add to local state immediately for instant feedback
      const newNote = response;
      setNotes(prev => [newNote, ...prev]);
      setTotalItems(prev => prev + 1);

      setPanelOpen(false);
      toast({ title: "Note Created", description: "Your note has been saved.", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setIsSaving(false), Math.max(0, 1500 - elapsed));
    }
  };

  const handleUpdate = async (manual = false) => {
    if (!editingId) return;
    const startTime = Date.now();
    if (manual) setIsSaving(true);
    setIsSyncing(true);
    const payload = {
      title: newTitle.trim() || "Untitled",
      content: createType === "note" ? newContent.trim() : "",
      type: createType,
      listItems: createType === "list" ? newListItems.filter(i => i.text.trim()) : undefined,
      projectId: newProjectId,
    };
    try {
      const updatedNote = await noteService.update(editingId, payload);

      // Update local state immediately with full populated object
      setNotes(prev => prev.map(n => n.id === editingId ? updatedNote : n));

      // Fix: Keep activeNote in sync to prevent access control issues
      if (activeNote?.id === editingId) {
        setActiveNote(updatedNote);
      }

      if (manual) {
        setPanelOpen(false);
        toast({ title: "Note Updated", variant: "success" });
      }
    } catch (err) {
      if (manual) toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
    } finally {
      setIsSyncing(false);
      if (manual) {
        const elapsed = Date.now() - startTime;
        setTimeout(() => setIsSaving(false), Math.max(0, 1500 - elapsed));
      }
    }
  };

  const handleCreateSilent = async () => {
    try {
      const response = await noteService.create({
        title: newTitle.trim() || "Untitled",
        content: createType === "note" ? newContent.trim() : "",
        type: createType,
        listItems: createType === "list" ? newListItems.filter(i => i.text.trim()) : undefined,
        projectId: newProjectId,
      });
      const createdNote = response;
      const newNote = { ...createdNote, user: currentUser, canEdit: true };
      setNotes(prev => [newNote, ...prev]);
      setTotalItems(prev => prev + 1);
    } catch (err) {
      console.error("Silent create failed", err);
    }
  };

  const handleDeleteDirect = async (id: number) => {
    try {
      await noteService.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      setTotalItems(prev => prev - 1);
    } catch (err) {
      console.error("Failed to delete empty note", err);
    }
  };

  const handleClosePanel = () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (canEdit && isEditing) {
      const isEmpty = !newTitle.trim() && (createType === "note" ? !newContent.trim() : !newListItems.filter(i => i.text.trim()).length);

      if (panelMode === "edit" && editingId) {
        if (isEmpty) {
          handleDeleteDirect(editingId);
          setEditingId(null);
          setPanelMode("create");
        } else {
          handleUpdate(false);
        }
      } else if (panelMode === "create" && !editingId && !isSyncing) {
        if (!isEmpty) {
          handleCreateSilent();
        }
      }
    }
    setPanelOpen(false);
  };

  // Auto-save logic
  useEffect(() => {
    if (!panelOpen || !canEdit || !isEditing) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      const isEmpty = !newTitle.trim() && (createType === "note" ? !newContent.trim() : !newListItems.filter(i => i.text.trim()).length);

      if (panelMode === "edit" && editingId) {
        if (isEmpty) {
          handleDeleteDirect(editingId);
          setEditingId(null);
          setPanelMode("create");
        } else {
          handleUpdate(false);
        }
      } else if (panelMode === "create" && !isSyncing && !editingId) {
        if (!isEmpty) {
          try {
            setIsSyncing(true);
            const response = await noteService.create({
              title: newTitle.trim() || "Untitled",
              content: createType === "note" ? newContent.trim() : "",
              type: createType,
              listItems: createType === "list" ? newListItems.filter(i => i.text.trim()) : undefined,
              projectId: newProjectId,
            });
            const createdNote = response;
            setEditingId(createdNote.id);
            setPanelMode("edit");
            const newNote = { ...createdNote, user: currentUser, canEdit: true };
            setNotes(prev => [newNote, ...prev]);
            setActiveNote(newNote); // Fix: Set activeNote for the newly created note
            setTotalItems(prev => prev + 1);
          } catch (err) {
            console.error("Auto-create failed", err);
          } finally {
            setIsSyncing(false);
          }
        }
      }
    }, 500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [newTitle, newContent, newListItems, newProjectId, panelOpen, isEditing]);

  const togglePin = async (id: number) => {
    try {
      await noteService.togglePin(id);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    } catch (err) {
      toast({ title: "Error", description: "Failed to toggle pin", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await noteService.delete(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Note Deleted", variant: "success" });
      fetchNotes();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const getColor = (id: number) => {
    const idx = id % noteColors.length;
    return noteColors[idx];
  };

  const isShared = activeNote && activeNote.userId !== currentUser?.id;

  // Robust check for canEdit: either the flag is true, or the current user is the owner,
  // or the current user is in the shares list with canEdit: true
  const canEdit = activeNote
    ? (
      activeNote.userId === currentUser?.id ||
      !!activeNote.canEdit ||
      activeNote.shares?.some((s: any) => s.sharedWithUser?.id === currentUser?.id && s.canEdit)
    )
    : true;

  return (
    <AppLayout title="Notes" subtitle="Quick notes and checklists">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
        <div className="bg-white border-b border-border/60 z-20 shrink-0">
          <ProjectTabs
            projects={projects}
            activeProjectId={projectFilter}
            onChange={v => { setProjectFilter(v); setPage(1); }}
            scrolled={scrolled}
          />
        </div>
        <div
          className="flex-1 overflow-y-auto premium-scrollbar scroll-smooth"
          onScroll={handleScroll}
        >

          <div className="max-w-[1400px] mx-auto w-full flex flex-col px-4 sm:px-6 lg:px-8 py-4 gap-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                  {[
                    { label: "All", value: "All" },
                    { label: "Shared", value: "SharedByMe" },
                    { label: "Received", value: "SharedWithMe" },
                  ].map((f) => {
                    const active = ownershipFilter === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => { setOwnershipFilter(f.value); setPage(1); }}
                        className={cn(
                          "px-3 py-1.5 text-[13px] font-medium transition-all duration-200 rounded-[3px] whitespace-nowrap",
                          active
                            ? "bg-[#0052CC] text-white"
                            : "bg-[#F4F5F7] text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D]"
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <AnimatedDropdown
                    options={[
                      { label: "All Types", value: "All" },
                      { label: "Only Notes", value: "note" },
                      { label: "Only Lists", value: "list" },
                    ]}
                    value={typeFilter}
                    onChange={(v) => { setTypeFilter(v); setPage(1); }}
                    placeholder="All Types"
                    size="sm"
                    className="w-auto"
                    triggerClassName="border-border border !rounded-[3px] h-8 !bg-white text-[13px] font-medium shadow-none min-w-[110px] px-3"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="flex-1 sm:max-w-xs flex bg-[#FAFBFC] border border-[#DFE1E6] rounded-[3px] h-8 transition-all duration-200 focus-within:ring-1 focus-within:ring-[#0052CC] focus-within:border-[#0052CC] focus-within:bg-white group">
                  <SearchBar
                    value={search}
                    onChange={v => { setSearch(v); setPage(1); }}
                    placeholder="Search notes..."
                    className="w-full h-full"
                    inputClassName="h-full !py-0 !rounded-[2px] !bg-transparent border-none focus:ring-0 shadow-none text-[13px]"
                  />
                </div>
                <Button
                  onClick={() => openCreate("note")}
                  className="gap-1.5 rounded-[3px] px-4 h-8 shrink-0 bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-none font-bold text-[13px]"
                >
                  + Create Note
                </Button>
                <Button
                  onClick={() => openCreate("list")}
                  className="gap-1.5 rounded-[3px] px-4 h-8 shrink-0 bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-none font-bold text-[13px]"
                >
                  + Create List
                </Button>
              </div>
            </div>

            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pt-2">
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "break-inside-avoid rounded-xl border border-[#DFE1E6] p-6 transition-all duration-300 hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] hover:border-[#4C9AFF]/50 group cursor-pointer relative bg-white flex flex-col min-h-[160px]",
                    editingId === note.id && "ring-2 ring-[#0052CC] ring-offset-2"
                  )}
                  onClick={() => openNoteDetail(note)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {note.userId !== currentUser?.id && (
                        <span className="text-[10px] font-bold bg-[#DEEBFF] text-[#0052CC] px-2 py-0.5 rounded-[2px] border border-[#B3D4FF]">Shared</span>
                      )}
                      {note.pinned && (
                        <div className="flex items-center gap-1 text-[#BF2600] text-[10px] font-bold">
                          <Pin className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {note.type === "list" ? <List className="w-3.5 h-3.5 text-[#6B778C]" /> : <FileText className="w-3.5 h-3.5 text-[#6B778C]" />}
                      <span className="text-[10px] font-bold text-[#6B778C] capitalize">{note.type}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-[16px] text-[#172B4D] line-clamp-2 flex-1 tracking-tight group-hover:text-[#0052CC] transition-colors leading-snug break-words overflow-hidden">{note.title}</h3>
                  </div>

                  {/* Creator info for shared notes */}
                  {note.userId !== currentUser?.id && (
                    <div className="flex items-center gap-2 mb-3 opacity-80">
                      <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        {note.user?.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[12px] font-bold text-[#6B778C]">{note.user?.username}</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 overflow-hidden">
                    {note.type === "note" ? (
                      <p className="text-[14px] text-[#42526E] line-clamp-5 leading-relaxed mb-4 opacity-90 break-words overflow-hidden">{note.content || "No content."}</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {note.listItems?.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-4 h-4 rounded-[2px] border flex items-center justify-center shrink-0 transition-all",
                              item.checked ? "bg-[#00875A] border-[#00875A]" : "bg-[#FAFBFC] border-[#DFE1E6] group-hover:border-[#4C9AFF]"
                            )}>
                              {item.checked && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                            </div>
                            <span className={cn("text-[13px] font-medium truncate", item.checked ? "line-through text-[#6B778C]/70" : "text-[#172B4D]")}>{item.text}</span>
                          </div>
                        ))}
                        {(note.listItems?.length || 0) > 4 && (
                          <p className="text-[12px] text-[#6B778C] font-bold mt-2">+{note.listItems!.length - 4} more tasks</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/60">
                    <div className="min-w-0">
                      {note.projectId && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#42526E] bg-[#F4F5F7] px-2 py-0.5 rounded-full border border-[#DFE1E6] truncate max-w-[120px] shrink-0">
                          <Hash className="w-2.5 h-2.5 opacity-50 shrink-0" />
                          <span className="truncate">{projects.find(p => p.id.toString() === note.projectId.toString())?.name || "Project"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {note.userId === currentUser?.id && (
                        <>
                          <button onClick={() => togglePin(note.id)}
                            className={cn("w-7 h-7 rounded-[3px] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                              note.pinned ? "text-[#BF2600] bg-[#FFEBE6] shadow-none" : "text-[#42526E] hover:bg-[#F4F5F7]")}>
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(note)}
                            className="w-7 h-7 rounded-[3px] flex items-center justify-center text-[#42526E] hover:text-[#DE350B] hover:bg-[#FFEBE6] transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {note.userId === currentUser?.id && (
                        <button onClick={() => openShare(note)}
                          className="w-7 h-7 rounded-[3px] flex items-center justify-center text-[#42526E] hover:text-[#0052CC] hover:bg-[#DEEBFF] transition-all opacity-0 group-hover:opacity-100">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {!loading && notes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 animate-fade-in group">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#0052CC]/10 blur-3xl rounded-full scale-150 group-hover:bg-[#0052CC]/20 transition-all duration-700" />
                  <div className="relative w-24 h-24 rounded-2xl bg-white border border-[#DFE1E6] flex items-center justify-center shadow-sm">
                    <FileText className="w-10 h-10 text-[#0052CC] opacity-60" />
                  </div>
                </div>
                <h3 className="text-[#172B4D] font-bold text-xl tracking-tight">Your creative space is empty</h3>
                <p className="text-[14px] text-[#6B778C] mt-2 max-w-sm text-center leading-relaxed font-medium">Capture fleeting thoughts, draft plans, and organize your tasks in one place.</p>
                <div className="flex gap-4 mt-10">
                  <Button onClick={() => openCreate("note")} className="bg-[#0052CC] hover:bg-[#0747A6] rounded-lg h-11 px-8 font-bold text-[13px] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">Create first note</Button>
                  <Button variant="outline" onClick={() => openCreate("list")} className="border-[#DFE1E6] hover:bg-[#F4F5F7] rounded-lg h-11 px-8 font-bold text-[13px] text-[#42526E] transition-all">New checklist</Button>
                </div>
              </div>
            )}

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              className="rounded-[3px] mt-8"
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "note"} loading={isDeleting} />

            {/* Share Dialog */}
            <CrudDialog
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              title="Share Page"
              subtitle={`Grant access to specific team members`}
              icon={<Share2 className="w-5 h-5 text-[#0052CC]" />}
              onSave={handleShare}
              saveLabel="Save Permissions"
              size="md"
              loading={isSharing}
            >
              <div className="space-y-6 py-4">
                <MemberSelector
                  label="Team Members"
                  icon={Users}
                  showSelf={false}
                  variant="notes"
                  selected={sharedUserIds}
                  onChange={setSharedUserIds}
                  canEditMap={sharePermissions}
                  onEditToggle={togglePermission}
                  labelClassName="text-[#6B778C] font-bold text-[12px]"
                />
              </div>
            </CrudDialog>

            {/* Side Panel Design */}
            <AnimatePresence>
              {panelOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
                    onClick={handleClosePanel}
                  />
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed top-0 right-0 z-[70] w-full max-w-[550px] h-full bg-white border-l border-[#EBECF0] shadow-2xl flex flex-col font-sans"
                  >
                    {/* Panel Toolbar */}
                    <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-[#EBECF0] shrink-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7 h-7 rounded-[4px] flex items-center justify-center text-white",
                          createType === "list" ? "bg-[#403294]" : "bg-[#0747A6]"
                        )}>
                          {createType === "list" ? <List className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#172B4D] leading-none mb-0.5">
                            {panelMode === "create" ? "Create New" : "Edit Document"}
                          </span>
                          <span className="text-[10px] font-medium text-[#6B778C] capitalize">{createType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn("h-8 w-8 rounded-[3px] transition-all", isEditing ? "text-[#0052CC] bg-[#DEEBFF]" : "text-[#42526E] hover:bg-[#EBECF0]")}
                                  onClick={() => setIsEditing(!isEditing)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">
                                {isEditing ? "Disable Editing" : "Enable Editing"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {isSyncing ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#DEEBFF] text-[#0052CC] text-[10px] font-bold">
                            Saving...
                          </div>
                        ) : (panelMode === "edit" && isEditing) && (
                          <div className="flex items-center gap-1.5 text-[#006644] text-[10px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                          </div>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E] hover:bg-[#EBECF0]" onClick={handleClosePanel}>
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto premium-scrollbar flex flex-col min-h-0 bg-white">
                      <div className="p-6 space-y-5">
                        {!isEditing && (
                          <div className="flex items-center gap-3 p-3 rounded-[3px] bg-[#F4F5F7] border border-[#EBECF0] text-[#172B4D]">
                            <Shield className="w-3.5 h-3.5 text-[#6B778C]" />
                            <span className="text-[12px] font-medium">Read-only mode. Click the pencil icon to edit.</span>
                          </div>
                        )}

                        {canEdit && isEditing && (
                          <div className="flex items-center gap-3 p-3 rounded-[3px] bg-[#E3FCEF]/50 border border-[#006644]/20 text-[#006644]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-medium">Edit mode active. All changes are auto-saved.</span>
                          </div>
                        )}

                        {!canEdit && (
                          <div className="flex items-center gap-3 p-3 rounded-[3px] bg-[#FFF0B3]/50 border border-[#FFAB00]/20 text-[#172B4D]">
                            <ShieldAlert className="w-3.5 h-3.5 text-[#BF6000]" />
                            <span className="text-[12px] font-medium">Read-only document (Shared).</span>
                          </div>
                        )}

                        <div className="space-y-5">
                          {/* Project Field - Full Width */}
                          <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#6B778C] block">Associated Project</label>
                            <AnimatedDropdown
                              options={projects.map(p => ({ label: p.name, value: p.id.toString() }))}
                              value={newProjectId?.toString() || ""}
                              onChange={v => setNewProjectId(v || null)}
                              placeholder="None"
                              disabled={!canEdit || !isEditing}
                              size="sm"
                              triggerClassName="w-full h-9 rounded-[3px] border-[#EBECF0] bg-white hover:border-[#DFE1E6] text-[13px] font-medium text-[#172B4D] px-3.5 shadow-none transition-all focus:border-[#0052CC]"
                            />
                          </div>

                          {/* Title Area */}
                          <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#6B778C] block">
                              {createType === "note" ? "Note Title" : "List Title"}
                            </label>
                            <input
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                              placeholder={`Enter ${createType} title...`}
                              disabled={!canEdit || !isEditing}
                              className="w-full bg-white border border-[#EBECF0] rounded-[3px] px-3.5 py-3 text-[18px] font-bold focus:outline-none focus:border-[#0052CC] placeholder:text-[#C1C7D0] text-[#172B4D] disabled:opacity-70 transition-all shadow-none"
                              autoFocus
                            />
                          </div>

                          {/* Editor Content Area */}
                          <div className="space-y-1.5 flex-1 flex flex-col min-h-[450px]">
                            <label className="text-[12px] font-bold text-[#6B778C] block">
                              {createType === "note" ? "Page Content" : "Checklist Items"}
                            </label>
                            <div className="flex-1 bg-white border border-[#EBECF0] rounded-[3px] transition-all focus-within:border-[#0052CC] flex flex-col">
                              {createType === "note" ? (
                                <textarea
                                  value={newContent}
                                  onChange={e => setNewContent(e.target.value)}
                                  placeholder="Start writing..."
                                  disabled={!canEdit || !isEditing}
                                  className="w-full flex-1 bg-transparent border-none p-3.5 text-[14px] focus:outline-none transition-all resize-none disabled:opacity-80 leading-relaxed font-normal text-[#172B4D] placeholder:text-[#C1C7D0]"
                                />
                              ) : (
                                <div className="p-4 space-y-3">
                                  {newListItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group/item border-b border-[#F4F5F7] pb-2 last:border-0 last:pb-0">
                                      <button
                                        type="button"
                                        disabled={!canEdit || !isEditing}
                                        onClick={() => {
                                          const updated = [...newListItems];
                                          updated[idx].checked = !updated[idx].checked;
                                          setNewListItems(updated);
                                        }}
                                        className={cn(
                                          "w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all bg-white",
                                          item.checked ? "bg-[#36B37E] border-[#36B37E]" : "border-[#DFE1E6] hover:border-[#4C9AFF]"
                                        )}
                                      >
                                        {item.checked && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                      </button>
                                      <input
                                        value={item.text}
                                        disabled={!canEdit || !isEditing}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            setNewListItems(prev => [...prev, { id: `new-${Date.now()}`, text: "", checked: false }]);
                                          }
                                        }}
                                        onChange={e => {
                                          const updated = [...newListItems];
                                          updated[idx].text = e.target.value;
                                          setNewListItems(updated);
                                        }}
                                        placeholder="Add task..."
                                        className={cn(
                                          "flex-1 bg-transparent text-[14px] font-medium focus:outline-none disabled:opacity-70 transition-all text-[#172B4D]",
                                          item.checked && "line-through text-[#6B778C]/70"
                                        )}
                                      />
                                      {canEdit && isEditing && newListItems.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setNewListItems(prev => prev.filter((_, i) => i !== idx))}
                                          className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-[4px] hover:bg-[#FFEBE6] text-[#6B778C] hover:text-[#DE350B] transition-opacity"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  {canEdit && isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => setNewListItems(prev => [...prev, { id: `new-${Date.now()}`, text: "", checked: false }])}
                                      className="w-full flex items-center gap-3 px-0.5 py-2 text-[#0052CC] hover:text-[#0747A6] group transition-colors"
                                    >
                                      <div className="w-5 h-5 rounded-[4px] border border-dashed border-[#B3D4FF] flex items-center justify-center group-hover:border-[#0052CC] transition-colors">
                                        <span className="text-[16px] leading-none mb-0.5 font-bold">+</span>
                                      </div>
                                      <span className="text-[13px] font-bold">New Item</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#EBECF0] bg-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#6B778C]">
                        <Shield className="w-3 h-3" /> PRIVATE {createType.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={handleClosePanel} className="rounded-[3px] h-9 px-5 font-bold text-[#42526E] hover:bg-[#EBECF0]">
                          Cancel
                        </Button>
                        {canEdit && (
                          <Button
                            onClick={() => panelMode === "create" ? handleCreate() : handleUpdate(true)}
                            loading={isSaving}
                            className="rounded-[3px] h-9 px-8 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold shadow-none text-[13px]"
                          >
                            {panelMode === "create" ? "Create Page" : "Save Changes"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Notes;
