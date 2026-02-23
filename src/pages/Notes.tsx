import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pin, Trash2, MoreHorizontal, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { DeleteDialog } from "@/components/CrudDialog";
import { initialNotes, Note, initialProjects, getProject } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 12;

// Random pastel colors for note cards
const noteColors = [
  "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/30",
  "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/30",
  "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/30",
  "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/30",
  "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800/30",
  "bg-card border-border",
];

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === "All" || (projectFilter === "General" ? n.projectId === null : n.projectId === projectFilter);
    return matchSearch && matchProject;
  });

  // Sort: pinned first
  const sorted = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (isCreating && titleRef.current) titleRef.current.focus();
  }, [isCreating]);

  const handleCreate = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsCreating(false);
      return;
    }
    const newN: Note = {
      id: `N-${Date.now().toString().slice(-3)}`,
      title: newTitle.trim() || "Untitled",
      content: newContent.trim(),
      projectId: null,
      author: "tm1",
      assignees: [],
      pinned: false,
      createdDate: "Just now",
      comments: 0,
    };
    setNotes(prev => [newN, ...prev]);
    setNewTitle("");
    setNewContent("");
    setIsCreating(false);
    toast({ title: "📝 Note Created", description: "Your note has been saved." });
  };

  const updateNote = (id: string, field: "title" | "content", value: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setNotes(prev => prev.filter(n => n.id !== deleteTarget.id));
      toast({ title: "🗑️ Note Deleted", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const getColor = (id: string) => {
    const idx = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % noteColors.length;
    return noteColors[idx];
  };

  return (
    <AppLayout title="Notes" subtitle="Quick notes and ideas">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl overflow-x-auto">
          <button onClick={() => { setProjectFilter("All"); setPage(1); }} className={cn("px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", projectFilter === "All" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>All</button>
          <button onClick={() => { setProjectFilter("General"); setPage(1); }} className={cn("px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", projectFilter === "General" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>General</button>
          {initialProjects.map(p => (
            <button key={p.id} onClick={() => { setProjectFilter(p.id); setPage(1); }} className={cn("px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", projectFilter === p.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{p.name}</button>
          ))}
        </div>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search notes..." className="w-full sm:max-w-xs" />
      </div>

      {/* Create Note Inline (Google Keep style) */}
      <div className="mb-6">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full max-w-xl mx-auto flex items-center gap-3 px-5 py-4 bg-card border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Take a note...</span>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mx-auto bg-card border-2 border-primary/20 rounded-2xl shadow-lg shadow-primary/5 overflow-hidden"
          >
            <input
              ref={titleRef}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-5 pt-4 pb-1 bg-transparent text-lg font-bold placeholder:text-muted-foreground/40 focus:outline-none"
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Take a note..."
              rows={3}
              className="w-full px-5 py-2 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
              <button onClick={() => { setIsCreating(false); setNewTitle(""); setNewContent(""); }} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleCreate} className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary rounded-lg shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">Save</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {paginated.map((note, i) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "break-inside-avoid rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg group cursor-pointer",
              getColor(note.id)
            )}
            onClick={() => setEditingId(editingId === note.id ? null : note.id)}
          >
            {/* Pin indicator */}
            {note.pinned && (
              <div className="flex items-center gap-1 text-warning text-[10px] font-bold uppercase tracking-wider mb-2">
                <Pin className="w-3 h-3" /> Pinned
              </div>
            )}

            {/* Title */}
            {editingId === note.id ? (
              <input
                value={note.title}
                onChange={e => updateNote(note.id, "title", e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full text-base font-bold bg-transparent focus:outline-none mb-2"
                autoFocus
              />
            ) : (
              <h3 className="font-bold text-base mb-2 line-clamp-2">{note.title}</h3>
            )}

            {/* Content */}
            {editingId === note.id ? (
              <textarea
                value={note.content}
                onChange={e => updateNote(note.id, "content", e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full text-sm bg-transparent focus:outline-none resize-none min-h-[60px]"
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{note.content}</p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">
                {note.projectId ? getProject(note.projectId)?.name : "General"} · {note.createdDate}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => togglePin(note.id)} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", note.pinned ? "text-warning bg-warning/10" : "text-muted-foreground hover:bg-muted")}>
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(note)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-muted-foreground font-medium">No notes yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click "Take a note..." to create one</p>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={sorted.length} pageSize={PAGE_SIZE} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "note"} />
    </AppLayout>
  );
};

export default Notes;
