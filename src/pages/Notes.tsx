import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pin, Trash2, Check, List, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { DeleteDialog } from "@/components/CrudDialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const PAGE_SIZE = 12;

interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: "note" | "list";
  listItems?: { id: string; text: string; checked: boolean }[];
  pinned: boolean;
  createdDate: string;
}

const noteColors = [
  "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/30",
  "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/30",
  "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/30",
  "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/30",
  "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800/30",
  "bg-card border-border",
];

const initialNotes: NoteItem[] = [
  { id: "N-001", title: "API Design Guidelines", content: "RESTful conventions, versioning strategy, and error handling patterns...", type: "note", pinned: true, createdDate: "Feb 22" },
  { id: "N-002", title: "Sprint 14 Planning", content: "Key objectives: auth overhaul, push notifications, performance...", type: "note", pinned: true, createdDate: "Feb 20" },
  { id: "N-003", title: "Shopping List", content: "", type: "list", listItems: [
    { id: "l1", text: "Buy groceries", checked: true },
    { id: "l2", text: "Review PRs", checked: false },
    { id: "l3", text: "Update docs", checked: false },
  ], pinned: false, createdDate: "Feb 18" },
  { id: "N-004", title: "Meeting Notes", content: "Discuss roadmap for Q2, review team capacity and sprint velocity.", type: "note", pinned: false, createdDate: "Feb 15" },
];

const Notes = () => {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [deleteTarget, setDeleteTarget] = useState<NoteItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<"note" | "list">("note");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newListItems, setNewListItems] = useState<{ id: string; text: string; checked: boolean }[]>([{ id: "new1", text: "", checked: false }]);
  const titleRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const sorted = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (isCreating && titleRef.current) titleRef.current.focus();
  }, [isCreating]);

  const handleCreate = () => {
    if (!newTitle.trim() && !newContent.trim() && createType === "note") { setIsCreating(false); return; }
    if (!newTitle.trim() && createType === "list") { setIsCreating(false); return; }
    const newN: NoteItem = {
      id: `N-${Date.now().toString().slice(-3)}`,
      title: newTitle.trim() || "Untitled",
      content: createType === "note" ? newContent.trim() : "",
      type: createType,
      listItems: createType === "list" ? newListItems.filter(i => i.text.trim()) : undefined,
      pinned: false,
      createdDate: "Just now",
    };
    setNotes(prev => [newN, ...prev]);
    setNewTitle(""); setNewContent(""); setNewListItems([{ id: "new1", text: "", checked: false }]);
    setIsCreating(false);
    toast({ title: "📝 Note Created", description: "Your note has been saved." });
  };

  const updateNote = (id: string, field: "title" | "content", value: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const updateListItem = (noteId: string, itemId: string, field: "text" | "checked", value: string | boolean) => {
    setNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      listItems: n.listItems?.map(i => i.id === itemId ? { ...i, [field]: value } : i)
    } : n));
  };

  const addListItemToNote = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      listItems: [...(n.listItems || []), { id: `li-${Date.now()}`, text: "", checked: false }]
    } : n));
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

  const saveAndClose = (id: string) => {
    setEditingId(null);
    toast({ title: "✅ Note Saved" });
  };

  const getColor = (id: string) => {
    const idx = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % noteColors.length;
    return noteColors[idx];
  };

  return (
    <AppLayout title="Notes" subtitle="Quick notes and checklists">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">All Types</option>
            <option value="note">Notes</option>
            <option value="list">Lists</option>
          </select>
        </div>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search notes..." className="w-full sm:max-w-xs" />
      </div>

      {/* Create Note/List Inline */}
      <div className="mb-6">
        {!isCreating ? (
          <div className="w-full max-w-xl mx-auto flex items-center gap-2">
            <button onClick={() => { setCreateType("note"); setIsCreating(true); }}
              className="flex-1 flex items-center gap-3 px-5 py-4 bg-card border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-200 shadow-sm">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Take a note...</span>
            </button>
            <button onClick={() => { setCreateType("list"); setIsCreating(true); }}
              className="flex items-center gap-2 px-5 py-4 bg-card border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-200 shadow-sm">
              <List className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">New list</span>
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mx-auto bg-card border-2 border-primary/20 rounded-2xl shadow-lg shadow-primary/5 overflow-hidden">
            <input ref={titleRef} value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Title" className="w-full px-5 pt-4 pb-1 bg-transparent text-lg font-bold placeholder:text-muted-foreground/40 focus:outline-none" />
            {createType === "note" ? (
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                placeholder="Take a note..." rows={3}
                className="w-full px-5 py-2 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none resize-none" />
            ) : (
              <div className="px-5 py-2 space-y-2">
                {newListItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={item.checked} onChange={e => {
                      const updated = [...newListItems]; updated[idx].checked = e.target.checked; setNewListItems(updated);
                    }} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                    <input value={item.text} onChange={e => {
                      const updated = [...newListItems]; updated[idx].text = e.target.value; setNewListItems(updated);
                    }} placeholder="List item..." className="flex-1 bg-transparent text-sm focus:outline-none" />
                  </div>
                ))}
                <button onClick={() => setNewListItems(prev => [...prev, { id: `new-${Date.now()}`, text: "", checked: false }])}
                  className="text-xs text-primary font-semibold hover:text-primary/80">+ Add item</button>
              </div>
            )}
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
              "break-inside-avoid rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg group",
              getColor(note.id),
              editingId === note.id && "ring-2 ring-primary/30"
            )}
            onClick={() => { if (editingId !== note.id) setEditingId(note.id); }}
          >
            {note.pinned && (
              <div className="flex items-center gap-1 text-warning text-[10px] font-bold uppercase tracking-wider mb-2">
                <Pin className="w-3 h-3" /> Pinned
              </div>
            )}

            {/* Type badge */}
            <div className="flex items-center gap-1 mb-2">
              {note.type === "list" ? <List className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-primary" />}
              <span className="text-[10px] font-semibold text-muted-foreground capitalize">{note.type}</span>
            </div>

            {/* Title */}
            {editingId === note.id ? (
              <input value={note.title} onChange={e => updateNote(note.id, "title", e.target.value)}
                onClick={e => e.stopPropagation()} className="w-full text-base font-bold bg-transparent focus:outline-none mb-2" autoFocus />
            ) : (
              <h3 className="font-bold text-base mb-2 line-clamp-2">{note.title}</h3>
            )}

            {/* Content */}
            {note.type === "note" ? (
              editingId === note.id ? (
                <textarea value={note.content} onChange={e => updateNote(note.id, "content", e.target.value)}
                  onClick={e => e.stopPropagation()} className="w-full text-sm bg-transparent focus:outline-none resize-none min-h-[60px]" rows={4} />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{note.content}</p>
              )
            ) : (
              <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                {note.listItems?.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={item.checked}
                      onChange={e => updateListItem(note.id, item.id, "checked", e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                    {editingId === note.id ? (
                      <input value={item.text} onChange={e => updateListItem(note.id, item.id, "text", e.target.value)}
                        className="flex-1 bg-transparent text-sm focus:outline-none" />
                    ) : (
                      <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>{item.text}</span>
                    )}
                  </div>
                ))}
                {editingId === note.id && (
                  <button onClick={() => addListItemToNote(note.id)} className="text-xs text-primary font-semibold">+ Add item</button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">{note.createdDate}</span>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {editingId === note.id && (
                  <button onClick={() => saveAndClose(note.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-success/10 text-success hover:bg-success/20 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => togglePin(note.id)}
                  className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100",
                    note.pinned ? "text-warning bg-warning/10" : "text-muted-foreground hover:bg-muted")}>
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(note)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
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
          <p className="text-xs text-muted-foreground/60 mt-1">Click "Take a note..." or "New list" to create one</p>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={sorted.length} pageSize={PAGE_SIZE} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "note"} />
    </AppLayout>
  );
};

export default Notes;
