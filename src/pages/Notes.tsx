import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pin, MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialNotes, Note, initialProjects, getProject, getTeamMember } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 8;

const emptyNote = (): Partial<Note> => ({
  title: "", content: "", projectId: null, author: "tm1", assignees: [], pinned: false,
});

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [editData, setEditData] = useState<Partial<Note>>(emptyNote());
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === "All" || (projectFilter === "General" ? n.projectId === null : n.projectId === projectFilter);
    return matchSearch && matchProject;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyNote()); setEditingId(null); setDialogOpen(true); };
  const openEdit = (n: Note) => { setEditData({ ...n }); setEditingId(n.id); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? { ...n, ...editData } as Note : n));
    } else {
      const newN: Note = {
        id: `N-${Date.now().toString().slice(-3)}`, title: editData.title || "Untitled",
        content: editData.content || "", projectId: editData.projectId || null,
        author: editData.author || "tm1", assignees: editData.assignees || [],
        pinned: editData.pinned || false, createdDate: "Today", comments: 0,
      };
      setNotes(prev => [...prev, newN]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) setNotes(prev => prev.filter(n => n.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  return (
    <AppLayout title="Notes" subtitle="Project documentation and notes">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={projectFilter === "All" ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setProjectFilter("All"); setPage(1); }}>All</Button>
          <Button variant={projectFilter === "General" ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setProjectFilter("General"); setPage(1); }}>General</Button>
          {initialProjects.map(p => (
            <Button key={p.id} variant={projectFilter === p.id ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setProjectFilter(p.id); setPage(1); }}>{p.name}</Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search notes..." />
          <Button size="sm" className="gap-1.5 text-xs shrink-0" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Note
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {paginated.map((note, i) => (
          <div key={note.id} className="bg-card border border-border rounded-lg p-4 card-hover animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {note.pinned && <Pin className="w-3 h-3 text-warning shrink-0" />}
                  <h3 className="font-semibold text-sm truncate">{note.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{note.content}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{note.projectId ? getProject(note.projectId)?.name : "General"}</span>
                  <span>·</span>
                  <span>{getTeamMember(note.author)?.name}</span>
                  <span>·</span>
                  <span>{note.createdDate}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{note.comments}</span>
                  <AssigneeBadges ids={note.assignees} max={2} />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="text-muted-foreground hover:text-foreground p-1 shrink-0"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => togglePin(note.id)}><Pin className="w-3.5 h-3.5 mr-2" />{note.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(note)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(note)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No notes found.</p>}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Note" : "New Note"} onSave={handleSave}>
        <FormField label="Title">
          <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.title || ""} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} />
        </FormField>
        <FormField label="Content">
          <textarea className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" rows={4} value={editData.content || ""} onChange={e => setEditData(d => ({ ...d, content: e.target.value }))} />
        </FormField>
        <FormField label="Project">
          <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.projectId || ""} onChange={e => setEditData(d => ({ ...d, projectId: e.target.value || null }))}>
            <option value="">General</option>
            {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Assignees">
          <AssigneeSelector selected={editData.assignees || []} onChange={assignees => setEditData(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "note"} />
    </AppLayout>
  );
};

export default Notes;
