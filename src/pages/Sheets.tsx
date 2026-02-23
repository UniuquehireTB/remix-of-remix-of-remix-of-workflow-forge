import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Pencil, Trash2, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialSheets, Sheet, SheetColumn, initialProjects, getProject } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  Done: "bg-success/10 text-success",
  "In Progress": "bg-warning/10 text-warning",
  Open: "bg-primary/10 text-primary",
  Testing: "bg-info/10 text-info",
};

const Sheets = () => {
  const [sheets, setSheets] = useState<Sheet[]>(initialSheets);
  const [activeSheetId, setActiveSheetId] = useState<string>(sheets[0]?.id || "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Sheet CRUD
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Sheet | null>(null);
  const [sheetEdit, setSheetEdit] = useState<Partial<Sheet>>({ name: "", projectId: null, assignees: [] });
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);

  // Row editing
  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [rowData, setRowData] = useState<Record<string, string | number | boolean>>({});

  const activeSheet = sheets.find(s => s.id === activeSheetId);
  const PAGE_SIZE = 10;

  // Filter rows by search
  const filteredRows = activeSheet ? activeSheet.rows.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  ) : [];
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Sheet CRUD handlers
  const openCreateSheet = () => { setSheetEdit({ name: "", projectId: null, assignees: [], columns: [{ key: "col1", label: "Column 1", type: "text" }], rows: [] }); setEditingSheetId(null); setSheetDialogOpen(true); };
  const openEditSheet = (s: Sheet) => { setSheetEdit({ ...s }); setEditingSheetId(s.id); setSheetDialogOpen(true); };

  const handleSaveSheet = () => {
    if (editingSheetId) {
      setSheets(prev => prev.map(s => s.id === editingSheetId ? { ...s, name: sheetEdit.name || s.name, projectId: sheetEdit.projectId ?? s.projectId, assignees: sheetEdit.assignees || s.assignees } : s));
    } else {
      const newS: Sheet = {
        id: `SH-${Date.now().toString().slice(-3)}`, name: sheetEdit.name || "Untitled",
        projectId: sheetEdit.projectId || null, assignees: sheetEdit.assignees || [],
        columns: sheetEdit.columns || [{ key: "col1", label: "Column 1", type: "text" }],
        rows: [], createdDate: "Today",
      };
      setSheets(prev => [...prev, newS]);
      setActiveSheetId(newS.id);
    }
    setSheetDialogOpen(false);
  };

  const handleDeleteSheet = () => {
    if (deleteTarget) {
      setSheets(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (activeSheetId === deleteTarget.id) setActiveSheetId(sheets[0]?.id || "");
    }
    setDeleteTarget(null);
  };

  // Row CRUD
  const openAddRow = () => {
    if (!activeSheet) return;
    const empty: Record<string, string | number | boolean> = {};
    activeSheet.columns.forEach(c => { empty[c.key] = c.type === "number" || c.type === "percent" ? 0 : ""; });
    setRowData(empty);
    setEditingRowIdx(null);
    setRowDialogOpen(true);
  };

  const openEditRow = (idx: number) => {
    if (!activeSheet) return;
    setRowData({ ...activeSheet.rows[idx] });
    // convert to absolute index
    const absIdx = (page - 1) * PAGE_SIZE + idx;
    const originalIdx = activeSheet.rows.indexOf(filteredRows[(page - 1) * PAGE_SIZE + idx]);
    setEditingRowIdx(originalIdx >= 0 ? originalIdx : absIdx);
    setRowDialogOpen(true);
  };

  const handleSaveRow = () => {
    if (!activeSheet) return;
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      const newRows = [...s.rows];
      if (editingRowIdx !== null) {
        newRows[editingRowIdx] = rowData;
      } else {
        newRows.push(rowData);
      }
      return { ...s, rows: newRows };
    }));
    setRowDialogOpen(false);
  };

  const deleteRow = (displayIdx: number) => {
    if (!activeSheet) return;
    const actualRow = filteredRows[(page - 1) * PAGE_SIZE + displayIdx];
    const absIdx = activeSheet.rows.indexOf(actualRow);
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      return { ...s, rows: s.rows.filter((_, i) => i !== absIdx) };
    }));
  };

  // Inline cell edit
  const updateCell = (rowIdx: number, colKey: string, value: string | number) => {
    const actualRow = filteredRows[(page - 1) * PAGE_SIZE + rowIdx];
    const absIdx = activeSheet?.rows.indexOf(actualRow) ?? -1;
    if (absIdx < 0) return;
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      const newRows = [...s.rows];
      newRows[absIdx] = { ...newRows[absIdx], [colKey]: value };
      return { ...s, rows: newRows };
    }));
  };

  // Add column to active sheet
  const addColumn = () => {
    if (!activeSheet) return;
    const key = `col_${Date.now()}`;
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      return {
        ...s,
        columns: [...s.columns, { key, label: `Column ${s.columns.length + 1}`, type: "text" }],
        rows: s.rows.map(r => ({ ...r, [key]: "" })),
      };
    }));
  };

  const removeColumn = (key: string) => {
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      return {
        ...s,
        columns: s.columns.filter(c => c.key !== key),
        rows: s.rows.map(r => { const nr = { ...r }; delete nr[key]; return nr; }),
      };
    }));
  };

  return (
    <AppLayout title="Sheets" subtitle="Custom spreadsheet tracking">
      {/* Sheet tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {sheets.map(s => (
            <div key={s.id} className="flex items-center gap-0.5">
              <Button variant={activeSheetId === s.id ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => { setActiveSheetId(s.id); setPage(1); setSearch(""); }}>
                {s.name}
                {s.projectId ? ` (${getProject(s.projectId)?.name})` : " (General)"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="text-muted-foreground hover:text-foreground p-0.5"><MoreHorizontal className="w-3.5 h-3.5" /></button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => openEditSheet(s)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit Sheet</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete Sheet</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground" onClick={openCreateSheet}>
            <Plus className="w-3 h-3" /> Add Sheet
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {activeSheet && <AssigneeBadges ids={activeSheet.assignees} max={3} />}
        </div>
      </div>

      {/* Search + actions */}
      {activeSheet && (
        <div className="flex items-center gap-2 mb-3">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search rows..." />
          <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0" onClick={addColumn}>
            <PlusCircle className="w-3.5 h-3.5" /> Column
          </Button>
          <Button size="sm" className="gap-1 text-xs shrink-0" onClick={openAddRow}>
            <Plus className="w-3.5 h-3.5" /> Row
          </Button>
        </div>
      )}

      {/* Table */}
      {activeSheet && (
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="w-10 py-2.5 px-3 border-r border-border text-xs text-muted-foreground font-medium">#</th>
                  {activeSheet.columns.map(col => (
                    <th key={col.key} className="py-2.5 px-3 border-r border-border text-xs text-muted-foreground font-medium text-left min-w-[120px]">
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>
                        {activeSheet.columns.length > 1 && (
                          <button onClick={() => removeColumn(col.key)} className="text-muted-foreground/50 hover:text-destructive ml-1"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-10 py-2.5 px-3 text-xs text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-3 border-r border-border text-xs text-muted-foreground text-center">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    {activeSheet.columns.map(col => {
                      const val = row[col.key];
                      return (
                        <td key={col.key} className="py-1 px-1 border-r border-border text-xs">
                          {col.type === "status" ? (
                            <select
                              value={String(val)}
                              onChange={e => updateCell(i, col.key, e.target.value)}
                              className={cn("px-2 py-1 rounded text-[10px] font-medium bg-transparent border-0 w-full cursor-pointer", statusColors[String(val)] || "text-foreground")}
                            >
                              <option>Open</option><option>In Progress</option><option>Testing</option><option>Done</option>
                            </select>
                          ) : col.type === "percent" ? (
                            <div className="flex items-center gap-2 px-2">
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${val}%` }} />
                              </div>
                              <input type="number" min={0} max={100} value={Number(val)} onChange={e => updateCell(i, col.key, Number(e.target.value))}
                                className="w-12 bg-transparent border-0 text-xs p-0 focus:outline-none" />
                            </div>
                          ) : (
                            <input
                              value={String(val ?? "")}
                              onChange={e => updateCell(i, col.key, col.type === "number" ? Number(e.target.value) : e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border-0 text-xs focus:outline-none focus:bg-accent/30 rounded"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2">
                      <button onClick={() => deleteRow(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
                {paginatedRows.length === 0 && (
                  <tr><td colSpan={activeSheet.columns.length + 2} className="py-8 text-center text-muted-foreground text-sm">No rows. Click "+ Row" to add data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSheet && <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredRows.length} pageSize={PAGE_SIZE} />}

      {!activeSheet && <p className="text-center text-muted-foreground text-sm py-12">No sheets. Create one to get started.</p>}

      {/* Sheet Create/Edit Dialog */}
      <CrudDialog open={sheetDialogOpen} onClose={() => setSheetDialogOpen(false)} title={editingSheetId ? "Edit Sheet" : "New Sheet"} onSave={handleSaveSheet}>
        <FormField label="Sheet Name">
          <input className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={sheetEdit.name || ""} onChange={e => setSheetEdit(d => ({ ...d, name: e.target.value }))} />
        </FormField>
        <FormField label="Project">
          <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm" value={sheetEdit.projectId || ""} onChange={e => setSheetEdit(d => ({ ...d, projectId: e.target.value || null }))}>
            <option value="">General</option>
            {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Assignees">
          <AssigneeSelector selected={sheetEdit.assignees || []} onChange={assignees => setSheetEdit(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      {/* Row Dialog */}
      <CrudDialog open={rowDialogOpen} onClose={() => setRowDialogOpen(false)} title={editingRowIdx !== null ? "Edit Row" : "Add Row"} onSave={handleSaveRow}>
        {activeSheet?.columns.map(col => (
          <FormField key={col.key} label={col.label}>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              type={col.type === "number" || col.type === "percent" ? "number" : "text"}
              value={rowData[col.key] as string ?? ""}
              onChange={e => setRowData(d => ({ ...d, [col.key]: col.type === "number" || col.type === "percent" ? Number(e.target.value) : e.target.value }))}
            />
          </FormField>
        ))}
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteSheet} itemName={deleteTarget?.name || "sheet"} />
    </AppLayout>
  );
};

export default Sheets;
