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
import { Pin, Trash2, Check, List, FileText, X, ChevronRight, Hash, Share2, Users, Shield, ShieldAlert, ShieldOff } from "lucide-react";
import { projectService, noteService, authService } from "@/services/authService";
import { MemberSelector } from "@/components/MemberSelector";
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
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUser = authService.getCurrentUser();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await noteService.getAll({
        search,
        type: typeFilter,
        projectId: projectFilter === "All" ? undefined : (projectFilter === "General" ? "null" : projectFilter),
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
  }, [search, typeFilter, projectFilter, page]);

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
    try {
      const shares = sharedUserIds.map(uid => ({
        userId: uid,
        canEdit: !!sharePermissions[uid]
      }));
      await noteService.share(shareTarget.id, shares);
      toast({ title: "✅ Success", description: "Sharing permissions updated." });
      setShareOpen(false);
      fetchNotes();
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to update sharing", variant: "destructive" });
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
    setNewProjectId(projectFilter === "All" || projectFilter === "General" ? null : projectFilter);
    setNewListItems([{ id: "new1", text: "", checked: false }]);
    setEditingId(null); // Fix: Reset editingId so auto-save works for the next new note
    setPanelMode("create");
    setPanelOpen(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast({ title: "⚠️ Title Required", description: "Please enter a title.", variant: "destructive" });
      return;
    }
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
      const newNote = { ...response, user: currentUser, canEdit: true };
      setNotes(prev => [newNote, ...prev]);
      setTotalItems(prev => prev + 1);

      setPanelOpen(false);
      toast({ title: "📝 Note Created", description: "Your note has been saved." });
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to create note", variant: "destructive" });
    }
  };

  const handleUpdate = async (manual = false) => {
    if (!editingId) return;
    setIsSyncing(true);
    const payload = {
      title: newTitle.trim() || "Untitled",
      content: createType === "note" ? newContent.trim() : "",
      type: createType,
      listItems: createType === "list" ? newListItems.filter(i => i.text.trim()) : undefined,
      projectId: newProjectId,
    };
    try {
      await noteService.update(editingId, payload);

      // Update local state immediately for instant feedback
      setNotes(prev => prev.map(n => n.id === editingId ? { ...n, ...payload } : n));

      if (manual) {
        setPanelOpen(false);
        toast({ title: "✅ Note Updated" });
      }
    } catch (err) {
      if (manual) toast({ title: "❌ Error", description: "Failed to update note", variant: "destructive" });
    } finally {
      setIsSyncing(false);
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
    setPanelOpen(false);
  };

  // Auto-save logic
  useEffect(() => {
    if (!panelOpen || !canEdit) return;

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
  }, [newTitle, newContent, newListItems, newProjectId, panelOpen]);

  const togglePin = async (id: number) => {
    try {
      await noteService.togglePin(id);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to toggle pin", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await noteService.delete(deleteTarget.id);
        fetchNotes();
        toast({ title: "🗑️ Note Deleted", variant: "destructive" });
      } catch (err) {
        toast({ title: "❌ Error", description: "Failed to delete note", variant: "destructive" });
      }
    }
    setDeleteTarget(null);
  };

  const getColor = (id: number) => {
    const idx = id % noteColors.length;
    return noteColors[idx];
  };

  const isShared = activeNote && activeNote.userId !== currentUser?.id;
  const canEdit = activeNote ? activeNote.canEdit : true;

  return (
    <AppLayout title="Notes" subtitle="Quick notes and checklists">
      <ProjectTabs projects={projects} activeProjectId={projectFilter} onChange={v => { setProjectFilter(v); setPage(1); }} />

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
            {["All", "note", "list"].map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={cn(
                    "relative px-4 py-1.5 text-xs font-bold transition-all duration-300 rounded-lg whitespace-nowrap capitalize",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10">{t === "All" ? "All Types" : t}</span>
                  {active && (
                    <motion.div
                      layoutId="activeType"
                      className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search notes..." className="flex-1 sm:max-w-xs" />
          <Button onClick={() => openCreate("note")} variant="outline" className="gap-1.5 rounded-xl px-4 shrink-0">
            <FileText className="w-4 h-4" /> Note
          </Button>
          <Button onClick={() => openCreate("list")} variant="outline" className="gap-1.5 rounded-xl px-4 shrink-0">
            <List className="w-4 h-4" /> List
          </Button>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {notes.map((note, i) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "break-inside-avoid rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg group cursor-pointer relative",
              getColor(note.id),
              editingId === note.id && "ring-2 ring-primary/30"
            )}
            onClick={() => openNoteDetail(note)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {note.userId !== currentUser?.id && (
                  <span className="text-[9px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">Shared</span>
                )}
                {note.pinned && (
                  <div className="flex items-center gap-1 text-warning text-[10px] font-bold uppercase tracking-wider">
                    <Pin className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {note.type === "list" ? <List className="w-3.5 h-3.5 text-primary" /> : <FileText className="w-3.5 h-3.5 text-primary" />}
                <span className="text-[10px] font-semibold text-muted-foreground capitalize tracking-tight">{note.type}</span>
              </div>
            </div>

            {/* Title */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-base line-clamp-2 flex-1 tracking-tight">{note.title}</h3>
              {note.userId === currentUser?.id && (
                <button onClick={(e) => { e.stopPropagation(); openShare(note); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Creator info for shared notes */}
            {note.userId !== currentUser?.id && (
              <div className="flex items-center gap-1.5 mb-2.5 opacity-70">
                <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary border border-primary/20">
                  {note.user?.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">From {note.user?.username}</span>
              </div>
            )}

            {/* Content */}
            {note.type === "note" ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6 leading-relaxed mb-4">{note.content}</p>
            ) : (
              <div className="space-y-1.5 mb-4" onClick={e => e.stopPropagation()}>
                {note.listItems?.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                      item.checked ? "bg-primary border-primary" : "bg-card border-border group-hover:border-primary/30"
                    )}>
                      {item.checked && <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3px]" />}
                    </div>
                    <span className={cn("text-xs font-medium truncate", item.checked && "line-through text-muted-foreground/60")}>{item.text}</span>
                  </div>
                ))}
                {(note.listItems?.length || 0) > 5 && (
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">+{note.listItems!.length - 5} more items</p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
              <div className="min-w-0">
                {note.projectId && (
                  <span className="text-[10px] font-bold text-primary/70 bg-primary/5 px-2 py-1 rounded-lg truncate block max-w-[100px] border border-primary/10">
                    {projects.find(p => p.id.toString() === note.projectId.toString())?.name || "Project"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {note.userId === currentUser?.id && (
                  <>
                    <button onClick={() => togglePin(note.id)}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                        note.pinned ? "text-warning bg-warning/10 shadow-sm" : "text-muted-foreground hover:bg-muted")}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(note)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in opacity-40">
          <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-bold text-lg">No notes found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Start by creating a quick note or checklist</p>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "note"} />

      {/* Share Dialog */}
      <CrudDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Note"
        subtitle={`Select members and set individual permissions`}
        icon={<Share2 className="w-5 h-5" />}
        onSave={handleShare}
        saveLabel="Update Permissions"
        size="md"
      >
        <div className="space-y-6">
          <MemberSelector
            label="Share with Members"
            icon={Users}
            showSelf={false}
            variant="notes"
            selected={sharedUserIds}
            onChange={setSharedUserIds}
            canEditMap={sharePermissions}
            onEditToggle={togglePermission}
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
              className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-sm"
              onClick={handleClosePanel}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[70] w-full max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col"
            >
              <div className="px-6 py-6 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10 shadow-inner">
                    {createType === "note" ? <FileText className="w-6 h-6" /> : <List className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black leading-none mb-1.5 tracking-tight">
                      {panelMode === "create" ? "Create New" : (canEdit ? "Edit" : "View")} {createType === "note" ? "Note" : "List"}
                    </h2>
                    <p className="text-[13px] text-muted-foreground font-semibold flex items-center gap-1.5">
                      {isShared ? (
                        <>
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span>Shared by <span className="text-primary">{activeNote?.user?.username}</span></span>
                        </>
                      ) : "Personal space for your thoughts"}
                    </p>
                  </div>
                </div>
                <button onClick={handleClosePanel} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide">
                {!canEdit && (
                  <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm animate-fade-in">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black uppercase tracking-tight">Read-Only Access</p>
                      <p className="text-xs font-semibold opacity-70">You can view content but cannot make any changes.</p>
                    </div>
                  </div>
                )}

                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 ml-1">
                    <FileText className="w-3 h-3" /> Title
                  </label>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Enter a catchy title..."
                    disabled={!canEdit}
                    className="w-full bg-transparent text-3xl font-black focus:outline-none placeholder:text-muted-foreground/20 disabled:opacity-50 transition-all tracking-tight"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 ml-1">
                      <Hash className="w-3 h-3" /> Association
                    </label>
                    <AnimatedDropdown
                      options={[
                        { label: "General Workspace", value: "" },
                        ...projects.map(p => ({ label: p.name, value: p.id.toString() }))
                      ]}
                      value={newProjectId?.toString() || ""}
                      onChange={v => setNewProjectId(v || null)}
                      placeholder="Select project"
                      disabled={!canEdit}
                      className="rounded-2xl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 ml-1">
                    {createType === "note" ? <FileText className="w-3 h-3" /> : <List className="w-3 h-3" />}
                    {createType === "note" ? "Your Thoughts" : "Checklist Items"}
                  </label>

                  {createType === "note" ? (
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/10 to-transparent rounded-[26px] opacity-0 group-hover:opacity-100 transition duration-500 blur" />
                      <textarea
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        placeholder="Start typing your note here... (Markdown supported)"
                        disabled={!canEdit}
                        className="relative w-full bg-muted/30 border border-border/50 rounded-3xl p-6 text-base min-h-[400px] focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none disabled:opacity-60 leading-relaxed font-medium"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 bg-muted/20 border border-border/50 rounded-3xl p-6 shadow-inner">
                      {newListItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 group/item animate-fade-in">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => {
                              const updated = [...newListItems];
                              updated[idx].checked = !updated[idx].checked;
                              setNewListItems(updated);
                            }}
                            className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all disabled:opacity-40 shadow-sm",
                              item.checked ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary/50 bg-card"
                            )}
                          >
                            {item.checked && <Check className="w-4 h-4 text-primary-foreground stroke-[3px]" />}
                          </button>
                          <input
                            value={item.text}
                            disabled={!canEdit}
                            onChange={e => {
                              const updated = [...newListItems];
                              updated[idx].text = e.target.value;
                              setNewListItems(updated);
                            }}
                            placeholder="Something to do..."
                            className={cn(
                              "flex-1 bg-transparent text-sm font-bold focus:outline-none disabled:opacity-50 transition-all",
                              item.checked && "line-through text-muted-foreground font-medium"
                            )}
                          />
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setNewListItems(prev => prev.filter((_, i) => i !== idx))}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setNewListItems(prev => [...prev, { id: `new-${Date.now()}`, text: "", checked: false }])}
                          className="text-[13px] text-primary font-black mt-6 hover:translate-x-1 transition-transform flex items-center gap-3 w-fit"
                        >
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">+</div>
                          Add New Task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={handleClosePanel} className="rounded-xl px-5 h-9 text-xs">
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Close
                  </Button>
                  {isSyncing && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Syncing...
                    </div>
                  )}
                  {!isSyncing && panelMode === "edit" && (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      <Check className="w-3 h-3" />
                      Saved
                    </div>
                  )}
                </div>
                {canEdit && (
                  <Button
                    onClick={() => panelMode === "create" ? handleCreate() : handleUpdate(true)}
                    className="rounded-xl px-5 h-9 text-xs shadow-lg shadow-primary/25"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {panelMode === "create" ? (createType === "note" ? "Build Note" : "Create List") : "Ready"}
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Notes;
