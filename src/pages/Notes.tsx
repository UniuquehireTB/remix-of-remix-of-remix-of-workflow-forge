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
import { Pin, Trash2, Check, List, FileText, X, ChevronRight, Hash, Share2, Users, Shield, ShieldAlert, ShieldOff, CheckCircle2 } from "lucide-react";
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

    if (canEdit) {
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
  const canEdit = activeNote
    ? (activeNote.userId === currentUser?.id || !!activeNote.canEdit)
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
                  + Create note
                </Button>
                <Button
                  onClick={() => openCreate("list")}
                  className="gap-1.5 rounded-[3px] px-4 h-8 shrink-0 bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-none font-bold text-[13px]"
                >
                  + Create list
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
                    "break-inside-avoid rounded-[3px] border border-[#DFE1E6] p-5 transition-all duration-200 hover:shadow-md hover:border-[#4C9AFF] group cursor-pointer relative bg-white flex flex-col min-h-[140px]",
                    editingId === note.id && "ring-2 ring-[#0052CC] ring-offset-0"
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
                      <p className="text-[14px] text-[#42526E] line-clamp-5 leading-relaxed mb-4 italic opacity-90 break-words overflow-hidden">{note.content || "No content."}</p>
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
                            <span className={cn("text-[13px] font-medium truncate", item.checked ? "line-through text-[#6B778C]/70 italic" : "text-[#172B4D]")}>{item.text}</span>
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
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0052CC] bg-[#DEEBFF]/30 px-2 py-0.5 rounded-[2px] border border-[#B3D4FF]/30 truncate max-w-[120px]">
                          <span>{projects.find(p => p.id.toString() === note.projectId.toString())?.name || "Project"}</span>
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
                      <ChevronRight className="w-4 h-4 text-[#6B778C] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {!loading && notes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                <div className="w-20 h-20 rounded-[3px] bg-[#F4F5F7] border border-[#DFE1E6] flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-[#6B778C] opacity-40" />
                </div>
                <p className="text-[#172B4D] font-bold text-xl">No documents yet</p>
                <p className="text-[14px] text-[#6B778C] mt-2">Capture ideas, project plans, and team tasks in a clean workspace.</p>
                <div className="flex gap-4 mt-8">
                  <Button onClick={() => openCreate("note")} className="bg-[#0052CC] hover:bg-[#0747A6] rounded-[3px] h-10 px-6 font-bold text-[12px]">Create note</Button>
                  <Button variant="outline" onClick={() => openCreate("list")} className="border-[#DFE1E6] hover:bg-[#F4F5F7] rounded-[3px] h-10 px-6 font-bold text-[12px]">Create checklist</Button>
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
                    className="fixed top-0 right-0 z-[70] w-full max-w-2xl h-full bg-white border-l border-border shadow-2xl flex flex-col"
                  >
                    {/* Panel Toolbar */}
                    <div className="px-6 py-3 border-b border-border/60 flex items-center justify-between bg-white shrink-0 min-h-[56px]">
                      <div className="flex items-center gap-4">
                        <span className="text-[18px] font-bold text-[#172B4D] capitalize">
                          {panelMode === "create" ? "New" : "Document"} {createType}
                        </span>
                        <div className="w-px h-4 bg-border/60" />
                        {isSyncing && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#0052CC] animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC]" />
                            Saving...
                          </div>
                        )}
                        {!isSyncing && panelMode === "edit" && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#00875A]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Saved
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {activeNote?.userId === currentUser?.id && panelMode === "edit" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E] hover:bg-[#F4F5F7]" onClick={() => openShare(activeNote!)}>
                            <Share2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]" onClick={handleClosePanel}>
                          <X className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto premium-scrollbar flex flex-col min-h-0 bg-white">
                      <div className="flex-1 px-10 py-10 space-y-10 max-w-3xl mx-auto w-full">
                        {!canEdit && (
                          <div className="flex items-center gap-3.5 p-4 rounded-[3px] bg-[#FFF0B3] border border-[#FFAB00]/20 text-[#172B4D] shadow-sm">
                            <ShieldAlert className="w-5 h-5 text-[#FFAB00]" />
                            <div>
                              <p className="text-[12px] font-bold">Read-only document</p>
                              <p className="text-[13px] opacity-80">You don't have permission to edit this page.</p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="Page Title"
                            disabled={!canEdit}
                            className="w-full bg-transparent text-4xl font-bold focus:outline-none placeholder:text-[#DFE1E6] text-[#172B4D] disabled:opacity-50 transition-all tracking-tight leading-tight"
                            autoFocus
                          />

                          <div className="flex items-center gap-6 pt-2">
                            <div className="flex-1 max-w-[240px] space-y-1.5">
                              <label className="text-[11px] font-bold text-[#6B778C]">Associated project</label>
                              <AnimatedDropdown
                                options={projects.map(p => ({ label: p.name, value: p.id.toString() }))}
                                value={newProjectId?.toString() || ""}
                                onChange={v => setNewProjectId(v || null)}
                                placeholder="None"
                                disabled={!canEdit}
                                size="sm"
                                triggerClassName="h-8 rounded-[3px] border-[#DFE1E6] bg-[#FAFBFC] hover:bg-[#EBECF0] text-[13px] font-bold text-[#172B4D]"
                              />
                            </div>

                            {isShared && (
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#6B778C]">Author</label>
                                <div className="flex items-center gap-2 h-8">
                                  <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-[10px] font-bold text-white uppercase">{activeNote?.user?.username.charAt(0)}</div>
                                  <span className="text-[13px] font-bold text-[#172B4D]">{activeNote?.user?.username}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="h-px bg-border/40" />

                        <div className="space-y-6">
                          {createType === "note" ? (
                            <textarea
                              value={newContent}
                              onChange={e => setNewContent(e.target.value)}
                              placeholder="Start writing..."
                              disabled={!canEdit}
                              className="w-full bg-transparent border-none text-[16px] min-h-[500px] focus:outline-none transition-all resize-none disabled:opacity-60 leading-relaxed font-normal text-[#172B4D] placeholder:text-[#DFE1E6]"
                            />
                          ) : (
                            <div className="space-y-4 pt-2">
                              {newListItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 group/item">
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => {
                                      const updated = [...newListItems];
                                      updated[idx].checked = !updated[idx].checked;
                                      setNewListItems(updated);
                                    }}
                                    className={cn(
                                      "w-5 h-5 rounded-[2px] border flex items-center justify-center transition-all shadow-none",
                                      item.checked ? "bg-[#00875A] border-[#00875A]" : "bg-white border-[#DFE1E6] hover:border-[#4C9AFF]"
                                    )}
                                  >
                                    {item.checked && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                  </button>
                                  <input
                                    value={item.text}
                                    disabled={!canEdit}
                                    onChange={e => {
                                      const updated = [...newListItems];
                                      updated[idx].text = e.target.value;
                                      setNewListItems(updated);
                                    }}
                                    placeholder="Task description..."
                                    className={cn(
                                      "flex-1 bg-transparent text-[15px] font-medium focus:outline-none disabled:opacity-50 transition-all text-[#172B4D]",
                                      item.checked && "line-through text-[#6B778C] italic"
                                    )}
                                  />
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => setNewListItems(prev => prev.filter((_, i) => i !== idx))}
                                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded-[3px] hover:bg-[#FFEBE6] text-[#6B778C] hover:text-[#DE350B] transition-all"
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
                                  className="text-[14px] text-[#0052CC] font-bold mt-4 hover:bg-[#DEEBFF] px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-2 w-fit"
                                >
                                  <span>+ Add task</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-5 border-t border-border/60 bg-[#FAFBFC] flex items-center justify-end gap-3 shrink-0">
                      <Button variant="ghost" onClick={handleClosePanel} className="rounded-[3px] h-9 px-6 font-bold text-[#42526E] hover:bg-[#EBECF0]">
                        Close
                      </Button>
                      {canEdit && (
                        <Button
                          onClick={() => panelMode === "create" ? handleCreate() : handleUpdate(true)}
                          loading={isSaving}
                          className="rounded-[3px] h-9 px-8 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold shadow-none text-[13px]"
                        >
                          {panelMode === "create" ? "Create Page" : "Done"}
                        </Button>
                      )}
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
