import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Pencil, Trash2, PlusCircle, X, Table2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialSheets, Sheet, SheetColumn, initialProjects, getProject } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const colLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const Sheets = () => {
  const [sheets, setSheets] = useState<Sheet[]>(initialSheets);
  const [activeSheetId, setActiveSheetId] = useState<string>(sheets[0]?.id || "");
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaValue, setFormulaValue] = useState("");

  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Sheet | null>(null);
  const [sheetEdit, setSheetEdit] = useState<Partial<Sheet>>({ name: "", projectId: null, assignees: [] });
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const { toast } = useToast();

  const activeSheet = sheets.find(s => s.id === activeSheetId);

  // Ensure at least 20 rows and enough columns
  const displayRows = activeSheet ? Math.max(20, activeSheet.rows.length + 5) : 20;
  const displayCols = activeSheet ? Math.max(9, activeSheet.columns.length + 3) : 9;

  const getCellValue = (rowIdx: number, colIdx: number): string => {
    if (!activeSheet) return "";
    const col = activeSheet.columns[colIdx];
    if (!col) return "";
    const row = activeSheet.rows[rowIdx];
    if (!row) return "";
    return String(row[col.key] ?? "");
  };

  const setCellValue = (rowIdx: number, colIdx: number, value: string) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      const col = s.columns[colIdx];
      if (!col) return s;

      // Expand rows if needed
      const newRows = [...s.rows];
      while (newRows.length <= rowIdx) {
        const empty: Record<string, string | number | boolean> = {};
        s.columns.forEach(c => { empty[c.key] = ""; });
        newRows.push(empty);
      }
      newRows[rowIdx] = { ...newRows[rowIdx], [col.key]: col.type === "number" || col.type === "percent" ? (Number(value) || 0) : value };
      return { ...s, rows: newRows };
    }));
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setFormulaValue(getCellValue(row, col));
  };

  const handleCellBlur = () => {
    if (selectedCell) {
      setCellValue(selectedCell.row, selectedCell.col, formulaValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    if (e.key === "Tab") {
      e.preventDefault();
      setCellValue(selectedCell.row, selectedCell.col, formulaValue);
      const nextCol = selectedCell.col + 1;
      setSelectedCell({ row: selectedCell.row, col: nextCol < displayCols ? nextCol : 0 });
      setFormulaValue(getCellValue(selectedCell.row, nextCol < displayCols ? nextCol : 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setCellValue(selectedCell.row, selectedCell.col, formulaValue);
      const nextRow = selectedCell.row + 1;
      setSelectedCell({ row: nextRow, col: selectedCell.col });
      setFormulaValue(getCellValue(nextRow, selectedCell.col));
    }
  };

  // Sheet CRUD
  const openCreateSheet = () => { setSheetEdit({ name: "", projectId: null, assignees: [], columns: [{ key: "col1", label: "Column 1", type: "text" }], rows: [] }); setEditingSheetId(null); setSheetDialogOpen(true); };
  const openEditSheet = (s: Sheet) => { setSheetEdit({ ...s }); setEditingSheetId(s.id); setSheetDialogOpen(true); };

  const handleSaveSheet = () => {
    if (editingSheetId) {
      setSheets(prev => prev.map(s => s.id === editingSheetId ? { ...s, name: sheetEdit.name || s.name, projectId: sheetEdit.projectId ?? s.projectId, assignees: sheetEdit.assignees || s.assignees } : s));
      toast({ title: "✅ Sheet Updated" });
    } else {
      const newS: Sheet = {
        id: `SH-${Date.now().toString().slice(-3)}`, name: sheetEdit.name || "Untitled",
        projectId: sheetEdit.projectId || null, assignees: sheetEdit.assignees || [],
        columns: [
          { key: "A", label: "A", type: "text" },
          { key: "B", label: "B", type: "text" },
          { key: "C", label: "C", type: "text" },
          { key: "D", label: "D", type: "text" },
          { key: "E", label: "E", type: "text" },
        ],
        rows: [], createdDate: "Today",
      };
      setSheets(prev => [...prev, newS]);
      setActiveSheetId(newS.id);
      toast({ title: "🎉 Sheet Created" });
    }
    setSheetDialogOpen(false);
  };

  const handleDeleteSheet = () => {
    if (deleteTarget) {
      setSheets(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (activeSheetId === deleteTarget.id) setActiveSheetId(sheets.filter(s => s.id !== deleteTarget.id)[0]?.id || "");
      toast({ title: "🗑️ Sheet Deleted", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const addColumn = () => {
    if (!activeSheet) return;
    const nextIdx = activeSheet.columns.length;
    const key = colLetters[nextIdx] || `col_${nextIdx}`;
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s;
      return {
        ...s,
        columns: [...s.columns, { key, label: key, type: "text" as const }],
        rows: s.rows.map(r => ({ ...r, [key]: "" })),
      };
    }));
  };

  const cellRef = selectedCell ? `${colLetters[selectedCell.col] || "?"}${selectedCell.row + 1}` : "";

  return (
    <AppLayout title="Sheets" subtitle="Spreadsheet tracking">
      {/* Toolbar - Google Sheets style */}
      <div className="bg-card border border-border rounded-t-2xl overflow-hidden">
        {/* Menu bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Table2 className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">{activeSheet?.name || "No Sheet"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSheet && <AssigneeBadges ids={activeSheet.assignees} max={3} />}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg" onClick={addColumn}>
              <PlusCircle className="w-3.5 h-3.5" /> Column
            </Button>
          </div>
        </div>

        {/* Formula bar */}
        <div className="flex items-center border-b border-border bg-card">
          <div className="w-16 text-center text-xs font-mono font-bold text-muted-foreground border-r border-border py-2">
            {cellRef || "A1"}
          </div>
          <div className="flex-1 flex items-center px-3 gap-2">
            <span className="text-xs text-muted-foreground font-mono italic">fx</span>
            <input
              value={formulaValue}
              onChange={e => setFormulaValue(e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={handleKeyDown}
              className="flex-1 py-2 bg-transparent text-sm focus:outline-none font-mono"
              placeholder="Enter value..."
            />
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-auto max-h-[60vh]">
          <table className="border-collapse w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/40">
                <th className="w-12 min-w-[48px] h-8 text-center text-[10px] font-bold text-muted-foreground border-r border-b border-border bg-muted/40"></th>
                {Array.from({ length: displayCols }).map((_, ci) => (
                  <th
                    key={ci}
                    className={cn(
                      "min-w-[100px] h-8 text-center text-[11px] font-bold text-muted-foreground border-r border-b border-border bg-muted/40 select-none",
                      selectedCell?.col === ci && "bg-primary/10 text-primary"
                    )}
                  >
                    {colLetters[ci] || `C${ci + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: displayRows }).map((_, ri) => (
                <tr key={ri} className="group">
                  <td className={cn(
                    "w-12 h-8 text-center text-[11px] font-bold text-muted-foreground border-r border-b border-border bg-muted/20 select-none",
                    selectedCell?.row === ri && "bg-primary/10 text-primary"
                  )}>
                    {ri + 1}
                  </td>
                  {Array.from({ length: displayCols }).map((_, ci) => {
                    const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
                    const val = getCellValue(ri, ci);
                    return (
                      <td
                        key={ci}
                        onClick={() => handleCellClick(ri, ci)}
                        className={cn(
                          "h-8 border-r border-b border-border relative cursor-cell",
                          isSelected && "ring-2 ring-primary ring-inset bg-card z-10",
                          !isSelected && "hover:bg-primary/3"
                        )}
                      >
                        {isSelected ? (
                          <input
                            autoFocus
                            value={formulaValue}
                            onChange={e => setFormulaValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            className="absolute inset-0 w-full h-full px-2 text-xs bg-transparent focus:outline-none font-mono"
                          />
                        ) : (
                          <div className="px-2 py-1 text-xs truncate font-mono">{val}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sheet tabs at bottom */}
        <div className="flex items-center gap-1 border-t border-border bg-muted/20 px-2 py-1.5 overflow-x-auto">
          <button onClick={openCreateSheet} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0">
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          {sheets.map(s => (
            <div key={s.id} className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => { setActiveSheetId(s.id); setSelectedCell(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2",
                  activeSheetId === s.id
                    ? "bg-card text-foreground border-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted"
                )}
              >
                {s.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground p-0.5 opacity-0 hover:opacity-100 focus:opacity-100">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl">
                  <DropdownMenuItem onClick={() => openEditSheet(s)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {!activeSheet && <p className="text-center text-muted-foreground text-sm py-12">No sheets. Create one to get started.</p>}

      <CrudDialog open={sheetDialogOpen} onClose={() => setSheetDialogOpen(false)} title={editingSheetId ? "Edit Sheet" : "Create New Sheet"} onSave={handleSaveSheet}>
        <FormField label="Sheet Name" icon={Table2} required>
          <input className="premium-input" placeholder="Budget Tracker, Task List..." value={sheetEdit.name || ""} onChange={e => setSheetEdit(d => ({ ...d, name: e.target.value }))} />
        </FormField>
        <FormField label="Project">
          <select className="premium-select" value={sheetEdit.projectId || ""} onChange={e => setSheetEdit(d => ({ ...d, projectId: e.target.value || null }))}>
            <option value="">General</option>
            {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Assignees" icon={Users}>
          <AssigneeSelector selected={sheetEdit.assignees || []} onChange={assignees => setSheetEdit(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteSheet} itemName={deleteTarget?.name || "sheet"} />
    </AppLayout>
  );
};

export default Sheets;
