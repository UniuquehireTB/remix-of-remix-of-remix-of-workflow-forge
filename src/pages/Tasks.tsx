import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialTasks, Task, statusColors, priorityColors, initialProjects, getProject } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 8;

const emptyTask = (): Partial<Task> => ({
  title: "", description: "", priority: "Medium", status: "Open",
  assignees: [], projectId: null, progress: 0, dueDate: "", estimatedHours: 0, actualHours: 0,
});

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [editData, setEditData] = useState<Partial<Task>>(emptyTask());
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === "All" || (projectFilter === "General" ? t.projectId === null : t.projectId === projectFilter);
    return matchSearch && matchProject;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyTask()); setEditingId(null); setDialogOpen(true); };
  const openEdit = (t: Task) => { setEditData({ ...t }); setEditingId(t.id); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...editData } as Task : t));
    } else {
      const newT: Task = {
        id: `TSK-${Date.now().toString().slice(-3)}`, title: editData.title || "Untitled",
        description: editData.description || "", priority: (editData.priority as any) || "Medium",
        status: (editData.status as any) || "Open", assignees: editData.assignees || [],
        projectId: editData.projectId || null, progress: editData.progress || 0,
        dueDate: editData.dueDate || "", estimatedHours: editData.estimatedHours || 0,
        actualHours: editData.actualHours || 0,
      };
      setTasks(prev => [...prev, newT]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <AppLayout title="Tasks" subtitle="Feature and task management">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={projectFilter === "All" ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setProjectFilter("All"); setPage(1); }}>All</Button>
          <Button variant={projectFilter === "General" ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setProjectFilter("General"); setPage(1); }}>General</Button>
          {initialProjects.map(p => (
            <Button key={p.id} variant={projectFilter === p.id ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setProjectFilter(p.id); setPage(1); }}>{p.name}</Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tasks..." />
          <Button size="sm" className="gap-1.5 text-xs shrink-0" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Task
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Task</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Project</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Assignees</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Due</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Time</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, i) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="py-3 px-4 font-medium max-w-[250px] truncate">{t.title}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{t.projectId ? getProject(t.projectId)?.name : "General"}</td>
                  <td className="py-3 px-4"><span className={cn("text-xs font-semibold", priorityColors[t.priority])}>{t.priority}</span></td>
                  <td className="py-3 px-4"><Badge variant="secondary" className={cn("text-[10px] font-medium", statusColors[t.status])}>{t.status}</Badge></td>
                  <td className="py-3 px-4"><AssigneeBadges ids={t.assignees} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${t.progress}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{t.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{t.dueDate}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{t.actualHours}h/{t.estimatedHours}h</td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No tasks found.</p>}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Task" : "New Task"} onSave={handleSave}>
        <FormField label="Title">
          <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.title || ""} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} />
        </FormField>
        <FormField label="Description">
          <textarea className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" rows={2} value={editData.description || ""} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Priority">
            <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.priority || "Medium"} onChange={e => setEditData(d => ({ ...d, priority: e.target.value as any }))}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.status || "Open"} onChange={e => setEditData(d => ({ ...d, status: e.target.value as any }))}>
              <option>Open</option><option>In Progress</option><option>Review</option><option>Testing</option><option>Done</option>
            </select>
          </FormField>
        </div>
        <FormField label="Project">
          <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.projectId || ""} onChange={e => setEditData(d => ({ ...d, projectId: e.target.value || null }))}>
            <option value="">General</option>
            {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Due Date">
            <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.dueDate || ""} onChange={e => setEditData(d => ({ ...d, dueDate: e.target.value }))} />
          </FormField>
          <FormField label="Est. Hours">
            <input type="number" className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={editData.estimatedHours || 0} onChange={e => setEditData(d => ({ ...d, estimatedHours: Number(e.target.value) }))} />
          </FormField>
          <FormField label="Progress %">
            <input type="number" className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" min={0} max={100} value={editData.progress || 0} onChange={e => setEditData(d => ({ ...d, progress: Number(e.target.value) }))} />
          </FormField>
        </div>
        <FormField label="Assignees">
          <AssigneeSelector selected={editData.assignees || []} onChange={assignees => setEditData(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "task"} />
    </AppLayout>
  );
};

export default Tasks;
