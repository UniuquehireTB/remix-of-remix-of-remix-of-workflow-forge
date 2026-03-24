import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Sheet as ShadcnSheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Table, Database, CheckSquare, Loader2, Plus, ChevronDown, Trash2, Settings, FileText, Edit2, LayoutGrid, PlusCircle, AlertCircle, Share2, User, UserPlus, Shield, ShieldCheck, Mail, Users, Calendar } from "lucide-react";
import { sheetService, authService } from "@/services/authService";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { MemberSelector } from "@/components/MemberSelector";
import { CrudDialog } from "@/components/CrudDialog";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ColumnType = 'text' | 'dropdown' | 'date';
export interface ColumnOption { id: string; label: string; color: string; }
export interface ColumnDef { id: string; name: string; type: ColumnType; options?: ColumnOption[]; width?: number; }
export interface RowDef { id: string; cells: { [columnId: string]: string }; height?: number; }
export interface GridSchema { columns: ColumnDef[]; rows: RowDef[]; }
export interface SheetMetadata { id: number; name: string; updatedAt: string; userId?: number; user?: { username: string; email: string }; }

const PRESET_EVENT_COLUMNS: ColumnDef[] = [
  { id: 'task', name: 'Task', type: 'text' },
  { id: 'status', name: 'Status', type: 'dropdown', options: [
     { id: 'opt1', label: 'Not started', color: 'bg-blue-100 text-blue-800 border-blue-200 border' },
     { id: 'opt2', label: 'In progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 border' },
     { id: 'opt3', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200 border' }
  ]},
  { id: 'owner', name: 'Owner', type: 'text' },
  { id: 'dueDate', name: 'Due date', type: 'date' }
];

const BLANK_GRID: GridSchema = {
  columns: [
    { id: 'col1', name: 'Task', type: 'text' },
    { id: 'col2', name: 'Notes', type: 'text' },
  ],
  rows: [
    { id: 'row1', cells: { col1: '', col2: '' } },
    { id: 'row2', cells: { col1: '', col2: '' } },
  ]
};

const EVENT_TASKS_GRID: GridSchema = {
  columns: PRESET_EVENT_COLUMNS,
  rows: [
    { id: '1', cells: { task: 'Example entry', status: 'Not started', owner: 'Alice', dueDate: '10/12/26' } },
  ]
};

export default function SheetPage() {
  const [sheetsList, setSheetsList] = useState<SheetMetadata[]>([]);
  const [searchParams] = useSearchParams();
  const urlSheetId = searchParams.get("sheetId");
  const [activeSheetId, setActiveSheetId] = useState<number | null>(urlSheetId ? Number(urlSheetId) : null);
  const [activeSheetMeta, setActiveSheetMeta] = useState<any>(null);
  
  const [data, setData] = useState<GridSchema>({ columns: [], rows: [] });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMySheetsOpen, setIsMySheetsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  
  const [editingColumn, setEditingColumn] = useState<ColumnDef | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // New Sheet Modal
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');

  // Edit / Delete Sheet Modal
  const [isEditSheetModalOpen, setIsEditSheetModalOpen] = useState(false);
  const [editingSheetMeta, setEditingSheetMeta] = useState<SheetMetadata | null>(null);

  // Template Confirm Modal
  const [isTemplateConfirmOpen, setIsTemplateConfirmOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<GridSchema | null>(null);

  // Delete Sheet Confirmation (from Toolbar)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Sharing Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedUserIds, setSharedUserIds] = useState<number[]>([]);
  const [sharePermissions, setSharePermissions] = useState<Record<number, boolean>>({});
  const [isSharing, setIsSharing] = useState(false);

  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUser = authService.getCurrentUser();


  // Handle Deep Linking
  useEffect(() => {
    const sid = searchParams.get("sheetId");
    if (sid) {
      const idNum = Number(sid);
      if (idNum !== activeSheetMeta?.id) {
        swapToSheet(idNum);
      }
    }
  }, [searchParams, activeSheetMeta?.id]);

  // Load all sheets index
  const loadSheetsIndex = useCallback(async () => {
    try {
      const response = await sheetService.getAll();
      setSheetsList(response || []);
      
      // Auto select first if nothing selected
      if (!activeSheetId && response?.length > 0) {
        swapToSheet(response[0].id);
      } else if (response?.length === 0) {
        setIsInitializing(false);
      }
    } catch (err) {
      console.error('Failed to load sheets index:', err);
      setIsInitializing(false);
    }
  }, [activeSheetId]);

  useEffect(() => {
    loadSheetsIndex();
  }, [loadSheetsIndex]);

  const swapToSheet = async (id: number) => {
    setIsInitializing(true);
    setActiveSheetId(id);
    try {
      const response = await sheetService.getById(id);
      setActiveSheetMeta(response);
      let loadedData = response.data;
      
      if (Array.isArray(loadedData)) {
          // Migration logic if an old Array was loaded from DB
          if (loadedData.length > 0 && 'celldata' in loadedData[0]) {
             loadedData = EVENT_TASKS_GRID;
          } else {
             const newRows = loadedData.map((oldRow: any) => {
               const { id: rowId, ...cells } = oldRow;
               return { id: rowId || Math.random().toString(36).substr(2, 9), cells };
             });
             loadedData = { columns: PRESET_EVENT_COLUMNS, rows: newRows };
          }
      }
      
      if (!loadedData || !loadedData.columns) {
         loadedData = EVENT_TASKS_GRID;
      }
      
      setData(loadedData);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load specific sheet:', err);
      const msg = err.message || "An unexpected error occurred.";
      toast({ 
        title: msg.includes('access') || msg.includes('permission') ? "Access Denied" : "Server Error", 
        description: msg, 
        variant: "destructive" 
      });
      setActiveSheetId(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const createNewSheet = async () => {
    if (!newSheetName.trim()) return;
    try {
      const response = await sheetService.create({ name: newSheetName.trim(), data: BLANK_GRID });
      await loadSheetsIndex();
      swapToSheet(response.id);
      setIsNewSheetModalOpen(false);
      setNewSheetName('');
      toast({ title: "Sheet Created", description: "Successfully created new sheet workspace." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create sheet.", variant: "destructive" });
    }
  };

  const updateSheetMeta = async () => {
    if (!editingSheetMeta) return;
    try {
      await sheetService.update(editingSheetMeta.id, { name: editingSheetMeta.name });
      await loadSheetsIndex();
      setIsEditSheetModalOpen(false);
      toast({ title: "Sheet Renamed", description: "Name successfully updated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to rename sheet.", variant: "destructive" });
    }
  };

  const deleteSpecificSheet = async () => {
    if (!editingSheetMeta) return;
    try {
      await sheetService.delete(editingSheetMeta.id);
      if (activeSheetId === editingSheetMeta.id) {
         setActiveSheetId(null);
         setData({ columns: [], rows: [] });
      }
      await loadSheetsIndex();
      setIsEditSheetModalOpen(false);
      setIsDeleteConfirmOpen(false);
      toast({ title: "Sheet Deleted", description: "Sheet permanently removed." });
    } catch (err) {
      toast({ title: "Error", description: "Only the owner can delete this sheet.", variant: "destructive" });
    }
  };

  const openShare = () => {
    if (!activeSheetMeta) return;
    const ids = activeSheetMeta.shares?.map((s: any) => s.sharedWithUser?.id).filter(Boolean) || [];
    const perms: Record<number, boolean> = {};
    activeSheetMeta.shares?.forEach((s: any) => {
      if (s.sharedWithUser?.id) {
        perms[s.sharedWithUser.id] = !!s.canEdit;
      }
    });
    setSharedUserIds(ids);
    setSharePermissions(perms);
    setIsShareModalOpen(true);
  };

  const togglePermission = (userId: number, canEdit: boolean) => {
    setSharePermissions(prev => ({ ...prev, [userId]: canEdit }));
  };

  const handleShare = async () => {
    if (!activeSheetId) return;
    setIsSharing(true);
    try {
      const sharesList = sharedUserIds.map(uid => ({
        userId: uid,
        canEdit: !!sharePermissions[uid]
      }));
      await sheetService.share(activeSheetId, sharesList);
      toast({ title: "Permissions Updated", description: "Sharing permissions updated.", variant: "success" });
      setIsShareModalOpen(false);
      // Refresh meta
      const updatedMeta = await sheetService.getById(activeSheetId);
      setActiveSheetMeta(updatedMeta);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update sharing", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const saveToAPI = useCallback(async (sheetData: GridSchema) => {
    if (!activeSheetId) return;
    setIsSaving(true);
    try {
      await sheetService.update(activeSheetId, { data: sheetData });
      setHasUnsavedChanges(false);
    } catch (err) {
      toast({ title: "Save Failed", description: "You might not have edit permission.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [activeSheetId, toast]);

  const handleUpdateGrid = (newData: GridSchema) => {
    if (!activeSheetMeta?.canEdit) return;
    setData(newData);
    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToAPI(newData), 1500);
  };

  // Resizing State
  const [resizingCol, setResizingCol] = useState<{ id: string, startX: number, startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ id: string, startY: number, startHeight: number } | null>(null);

  // Resizing Handlers
  const handleMouseDownCol = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    if (!activeSheetMeta?.canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setResizingCol({ id: colId, startX: e.clientX, startWidth: currentWidth });
  };

  const handleMouseDownRow = (e: React.MouseEvent, rowId: string, currentHeight: number) => {
    if (!activeSheetMeta?.canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setResizingRow({ id: rowId, startY: e.clientY, startHeight: currentHeight });
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (resizingCol) {
      const deltaX = e.clientX - resizingCol.startX;
      const newWidth = Math.max(50, resizingCol.startWidth + deltaX);
      const newCols = data.columns.map(c => c.id === resizingCol.id ? { ...c, width: newWidth } : c);
      setData(prev => ({ ...prev, columns: newCols }));
    } else if (resizingRow) {
      const deltaY = e.clientY - resizingRow.startY;
      const newHeight = Math.max(30, resizingRow.startHeight + deltaY);
      const newRows = data.rows.map(r => r.id === resizingRow.id ? { ...r, height: newHeight } : r);
      setData(prev => ({ ...prev, rows: newRows }));
    }
  }, [resizingCol, resizingRow, data]);

  const handleGlobalMouseUp = useCallback(() => {
    if (resizingCol || resizingRow) {
      setResizingCol(null);
      setResizingRow(null);
      handleUpdateGrid(data);
    }
  }, [resizingCol, resizingRow, data, handleUpdateGrid]);

  useEffect(() => {
    if (resizingCol || resizingRow) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    } else {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [resizingCol, resizingRow, handleGlobalMouseMove, handleGlobalMouseUp]);

  // --- Row Logic ---
  const handleSheetKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isTextarea = target.tagName === 'TEXTAREA';
    const cellWrapper = target.closest('[data-row]') as HTMLElement;
    
    if (!cellWrapper) return;

    const row = parseInt(cellWrapper.getAttribute('data-row') || '0');
    const col = parseInt(cellWrapper.getAttribute('data-col') || '0');

    let nextRow = row;
    let nextCol = col;

    if (e.key === 'ArrowUp') {
       nextRow--;
    } else if (e.key === 'ArrowDown') {
       nextRow++;
    } else if (e.key === 'ArrowLeft') {
       if (isTextarea) {
         const ta = target as HTMLTextAreaElement;
         if (ta.selectionStart !== 0) return;
       }
       nextCol--;
    } else if (e.key === 'ArrowRight') {
       if (isTextarea) {
         const ta = target as HTMLTextAreaElement;
         if (ta.selectionEnd !== ta.value.length) return;
       }
       nextCol++;
    } else {
       return;
    }

    const nextEl = document.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLElement;
    if (nextEl) {
      e.preventDefault();
      const focusable = nextEl.classList.contains('sheet-cell-input') ? nextEl : nextEl.querySelector('.sheet-cell-input') as HTMLElement;
      focusable?.focus();
    }
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    const newRows = data.rows.map(row => 
      row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: value } } : row
    );
    handleUpdateGrid({ ...data, rows: newRows });
  };

  const deleteRow = (rowId: string) => {
    if (!activeSheetMeta?.canEdit) return;
    const newRows = data.rows.filter(r => r.id !== rowId);
    handleUpdateGrid({ ...data, rows: newRows });
    toast({ title: "Row Deleted", description: "The row has been removed.", variant: "success" });
  };

  const addRow = () => {
    if (!activeSheetMeta?.canEdit) return;
    const newRow: RowDef = { id: Math.random().toString(36).substr(2, 9), cells: {} };
    data.columns.forEach(c => newRow.cells[c.id] = '');
    handleUpdateGrid({ ...data, rows: [...data.rows, newRow] });
  };

  // --- Column Settings Logic ---
  const openNewColumnModal = () => {
    if (!activeSheetMeta?.canEdit) return;
    setEditingColumn({ id: Math.random().toString(36).substr(2, 9), name: 'New Column', type: 'text', options: [] });
    setIsColumnModalOpen(true);
  };

  const openEditColumnModal = (col: ColumnDef) => {
    if (!activeSheetMeta?.canEdit) return;
    setEditingColumn(JSON.parse(JSON.stringify(col)));
    setIsColumnModalOpen(true);
  };

  const saveColumnConfig = () => {
    if (!editingColumn || !activeSheetMeta?.canEdit) return;
    const isExisting = data.columns.find(c => c.id === editingColumn.id);
    let newCols = [];
    if (isExisting) {
      newCols = data.columns.map(c => c.id === editingColumn.id ? editingColumn : c);
    } else {
      newCols = [...data.columns, editingColumn];
    }
    handleUpdateGrid({ ...data, columns: newCols });
    setIsColumnModalOpen(false);
  };

  const deleteColumn = () => {
    if (!editingColumn || !activeSheetMeta?.canEdit) return;
    const newCols = data.columns.filter(c => c.id !== editingColumn.id);
    const newRows = data.rows.map(row => {
      const newCells = { ...row.cells };
      delete newCells[editingColumn.id];
      return { ...row, cells: newCells };
    });
    handleUpdateGrid({ columns: newCols, rows: newRows });
    setIsColumnModalOpen(false);
  };

  const handleApplyTemplateClick = (template: GridSchema) => {
    if (!activeSheetMeta?.canEdit) return;
    setPendingTemplate(template);
    setIsTemplateConfirmOpen(true);
  };

  const confirmApplyTemplate = () => {
    if (!pendingTemplate) return;
    setIsTemplatesOpen(false);
    const freshData = JSON.parse(JSON.stringify(pendingTemplate));
    handleUpdateGrid(freshData);
    setPendingTemplate(null);
    setIsTemplateConfirmOpen(false);
    toast({ title: "Template Applied", description: "Grid structure reset to template.", variant: "success" });
  };

  const getOptionColor = (colId: string, value: string) => {
    if (!value) return '';
    const col = data.columns.find(c => c.id === colId);
    if (!col || col.type !== 'dropdown' || !col.options) return '';
    const opt = col.options.find(o => o.label === value);
    return opt ? opt.color : '';
  };

  return (
    <AppLayout title="Sheet">
      <div className="flex flex-1 w-full bg-white relative h-[calc(100vh-64px)] overflow-hidden font-sans">
        
        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {isInitializing ? (
            <div className="flex-1 w-full bg-white flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : !activeSheetId ? (
            <div className="flex-1 w-full bg-[#f8fafc] flex flex-col items-center justify-center text-slate-500">
               <Table className="w-12 h-12 text-slate-300 mb-4" />
               <h3 className="text-lg font-medium text-slate-700">No Sheet Selected</h3>
               <p className="text-sm mb-6">Create a new sheet or select one from your library.</p>
               <Button onClick={() => setIsNewSheetModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                 <Plus className="w-4 h-4" /> Create First Sheet
               </Button>
            </div>
          ) : (
            <div className="flex-1 w-full h-full bg-white flex flex-col overflow-hidden">
              
              {/* Native Toolbar */}
              <div className="flex flex-none items-center justify-between px-4 py-2 border-b border-slate-200 bg-white sticky top-0 left-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="group flex items-center gap-2">
                      <div className="flex flex-col">
                        <h2 className="font-bold text-slate-900 text-sm truncate max-w-[200px] flex items-center gap-1.5">
                          {activeSheetMeta?.name}
                          {!activeSheetMeta?.canEdit && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Shield className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-[10px] bg-[#172B4D] text-white border-none py-1 px-2.5">View Only</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </h2>
                        {activeSheetMeta?.user && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Owned by {activeSheetMeta.user.username} {activeSheetMeta.isOwner && '(You)'}
                          </span>
                        )}
                      </div>
                      {activeSheetMeta?.isOwner && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => {
                              setEditingSheetMeta(activeSheetMeta);
                              setIsEditSheetModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                            title="Rename Sheet"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingSheetMeta(activeSheetMeta);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
                            title="Delete Sheet"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                   </div>
                   <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-[10px] font-medium text-slate-500">
                     {isSaving ? (
                       <><Loader2 className="w-3 h-3 text-blue-500 animate-spin" /> Syncing</>
                     ) : hasUnsavedChanges ? (
                       <><Database className="w-3 h-3 text-orange-500" /> Pending</>
                     ) : (
                       <><CheckSquare className="w-3 h-3 text-green-500" /> Saved</>
                     )}
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                   {activeSheetMeta?.isOwner && (
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-8 text-[11px] gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 px-3 font-semibold"
                             onClick={openShare}
                           >
                             <Share2 className="w-3.5 h-3.5" /> Share
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent side="bottom" className="text-xs bg-[#172B4D] text-white py-1.5 px-3 border-none shadow-xl">Manage collaboration</TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   )}

                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                           onClick={() => setIsNewSheetModalOpen(true)}
                         >
                           <PlusCircle className="w-4 h-4" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent side="bottom" className="text-xs bg-[#172B4D] text-white py-1.5 px-3 border-none shadow-xl">New Sheet</TooltipContent>
                     </Tooltip>
                   </TooltipProvider>

                   {activeSheetMeta?.isOwner && (
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                             onClick={() => {
                                setEditingSheetMeta(activeSheetMeta);
                                setIsDeleteConfirmOpen(true);
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent side="bottom" className="text-xs bg-[#172B4D] text-white py-1.5 px-3 border-none shadow-xl">Delete Sheet</TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   )}

                   <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                   <ShadcnSheet open={isMySheetsOpen} onOpenChange={setIsMySheetsOpen}>
                     <SheetTrigger asChild>
                       <Button variant="outline" size="sm" className="h-8 text-xs gap-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 font-medium">
                         <LayoutGrid className="w-3.5 h-3.5" /> My Sheets
                       </Button>
                     </SheetTrigger>
                     <SheetContent side="right" className="p-0 flex flex-col w-80">
                       <SheetHeader className="p-4 border-b">
                         <SheetTitle className="text-base flex items-center gap-2">
                           <FileText className="w-4 h-4 text-blue-600" /> My Sheets Library
                         </SheetTitle>
                         <SheetDescription className="text-xs">Switch between your saved spreadsheet workspaces.</SheetDescription>
                       </SheetHeader>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-2">
                         {sheetsList.map(sheet => (
                            <div
                              key={sheet.id}
                              onClick={() => { swapToSheet(sheet.id); setIsMySheetsOpen(false); }}
                              className={cn(
                                "flex flex-col px-3 py-2.5 rounded-lg cursor-pointer group transition-all border shadow-sm",
                                activeSheetId === sheet.id ? "bg-blue-50 text-blue-700 border-blue-100 ring-1 ring-blue-50 font-medium" : "text-slate-600 hover:bg-slate-50 hover:border-slate-200 border-transparent bg-white"
                              )}
                            >
                               <div className="flex items-center justify-between gap-3 truncate">
                                  <div className="flex items-center gap-3 truncate">
                                    <Table className={cn("w-4 h-4 flex-shrink-0", activeSheetId === sheet.id ? "text-blue-600" : "text-slate-400")} />
                                    <span className="truncate text-sm font-semibold">{sheet.name}</span>
                                  </div>
                                  {sheet.userId === currentUser.id && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setEditingSheetMeta(sheet); setIsEditSheetModalOpen(true); }}
                                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 transition-all flex-none"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                               </div>
                                {sheet.user && Number(sheet.userId) !== Number(currentUser?.id) && (
                                 <div className="mt-1 flex items-center gap-1.5 ml-7">
                                   <User className="w-2.5 h-2.5 text-slate-400" />
                                   <span className="text-[10px] text-slate-400">By {sheet.user.username}</span>
                                 </div>
                               )}
                            </div>
                         ))}
                       </div>
                       
                       <div className="p-4 border-t bg-slate-50 mt-auto">
                         <Button onClick={() => setIsNewSheetModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-semibold" size="sm">
                            <Plus className="w-4 h-4" /> Create New Sheet
                         </Button>
                       </div>
                     </SheetContent>
                   </ShadcnSheet>

                   {activeSheetMeta?.canEdit && (
                     <ShadcnSheet open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                       <SheetTrigger asChild>
                         <Button size="sm" variant="outline" className="h-8 text-xs gap-2 border-slate-200 text-slate-600 font-medium hover:text-blue-600">
                           <Edit2 className="w-3.5 h-3.5" /> Template
                         </Button>
                       </SheetTrigger>
                       <SheetContent side="right">
                         <SheetHeader>
                           <SheetTitle>Table Templates</SheetTitle>
                           <SheetDescription>Deploy structured layouts instantly. Warning: This will reset your current data.</SheetDescription>
                         </SheetHeader>
                         <div className="mt-8 space-y-3">
                           <button onClick={() => handleApplyTemplateClick(BLANK_GRID)} className="w-full text-left px-4 py-3 rounded-lg border hover:bg-slate-50 transition-all flex items-center gap-3 group">
                             <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center group-hover:bg-blue-100"><Table className="w-4 h-4 text-slate-500 group-hover:text-blue-600" /></div>
                             <div><p className="font-medium text-sm">Blank Table</p><p className="text-xs text-slate-500">Standard columns</p></div>
                           </button>
                           <button onClick={() => handleApplyTemplateClick(EVENT_TASKS_GRID)} className="w-full text-left px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all flex items-center gap-3 group">
                             <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform"><CheckSquare className="w-4 h-4 text-blue-600" /></div>
                             <div><p className="font-medium text-blue-900 text-sm">Event Tracker</p><p className="text-xs text-blue-700/70">Pre-configured status tags</p></div>
                           </button>
                         </div>
                       </SheetContent>
                     </ShadcnSheet>
                   )}
                </div>
              </div>

              <div className="overflow-auto flex-1 relative flex bg-slate-50/20">
                <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 shadow-sm">
                      <th className="font-medium py-3 px-3 border-r border-slate-200 w-12 text-center text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50">#</th>
                      
                      {data.columns.map((col, colIndex) => (
                        <th 
                          key={col.id} 
                          className="font-bold py-3 px-3 border-r border-slate-200 group hover:bg-slate-100 cursor-pointer text-[11px] uppercase tracking-wider bg-slate-50 text-slate-700 relative" 
                          style={{ width: col.width || 180, minWidth: col.width || 180 }}
                          onClick={() => openEditColumnModal(col)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{col.name}</span>
                            {activeSheetMeta?.canEdit && <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />}
                          </div>
                          {activeSheetMeta?.canEdit && (
                            <div 
                              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-30"
                              onMouseDown={(e) => handleMouseDownCol(e, col.id, col.width || 180)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </th>
                      ))}
                      
                      {activeSheetMeta?.canEdit && (
                        <th className="py-2 px-3 hover:bg-slate-100 cursor-pointer w-12 bg-slate-50" onClick={openNewColumnModal}>
                          <Plus className="w-3.5 h-3.5 mx-auto text-slate-400 hover:text-slate-700" />
                        </th>
                      )}
                      <th className="bg-slate-50 border-b border-slate-200 w-full" style={{ width: '100%' }}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 h-max bg-white">
                    {data.rows.map((row, index) => (
                      <tr 
                        key={row.id} 
                        className="hover:bg-blue-50/20 transition-colors group"
                        style={{ height: row.height || 'auto' }}
                      >
                        <td className="py-1 px-3 border-r border-slate-100 text-center relative group-hover:bg-slate-100 transition-colors">
                           <span className="text-slate-300 font-mono text-[10px] group-hover:opacity-0 transition-opacity">{index + 1}</span>
                           {activeSheetMeta?.canEdit && (
                             <>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
                                 className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all scale-90 group-hover:scale-100"
                                 title="Delete Row"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                               <div 
                                 className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-30"
                                 onMouseDown={(e) => handleMouseDownRow(e, row.id, row.height || 40)}
                               />
                             </>
                           )}
                        </td>
                        
                        {data.columns.map((col, colIndex) => (
                          <td 
                            key={col.id} 
                            className="px-3 border-r border-slate-100 align-top py-2"
                            style={{ width: col.width || 180, minWidth: col.width || 180 }}
                          >
                            {col.type === 'text' ? (
                              <AutoResizeTextarea 
                                value={row.cells[col.id] || ''}
                                onChange={(val: string) => updateCell(row.id, col.id, val)}
                                disabled={!activeSheetMeta?.canEdit}
                                data-row={index}
                                data-col={colIndex}
                                onKeyDown={handleSheetKeyDown}
                                className={cn(
                                  "w-full bg-transparent border-transparent hover:border-slate-200 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded px-2 py-1 text-sm transition-all text-slate-800 font-medium resize-none overflow-hidden block min-h-[30px] leading-relaxed",
                                  !activeSheetMeta?.canEdit && "cursor-default hover:border-transparent opacity-90",
                                  "sheet-cell-input"
                                )}
                                placeholder="..."
                              />
                             ) : col.type === 'date' ? (
                              <SheetDatePicker 
                                value={row.cells[col.id] || ''}
                                onChange={(val: string) => updateCell(row.id, col.id, val)}
                                disabled={!activeSheetMeta?.canEdit}
                                data-row={index}
                                data-col={colIndex}
                                onKeyDown={handleSheetKeyDown}
                              />
                             ) : col.type === 'dropdown' ? (
                              <div 
                                className="relative inline-block w-full" 
                                data-row={index} 
                                data-col={colIndex}
                                onKeyDown={handleSheetKeyDown}
                              >
                                <AnimatedDropdown
                                  size="sm"
                                  options={col.options?.map(opt => ({ label: opt.label, value: opt.label })) || []}
                                  value={row.cells[col.id] || ''}
                                  onChange={(val) => updateCell(row.id, col.id, val)}
                                  placeholder="Select..."
                                  disabled={!activeSheetMeta?.canEdit}
                                  triggerClassName={cn(
                                    "h-7 !px-3 font-semibold text-[11px] rounded-full border border-transparent shadow-none transition-all sheet-cell-input",
                                    getOptionColor(col.id, row.cells[col.id]) ? getOptionColor(col.id, row.cells[col.id]) : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                                    !activeSheetMeta?.canEdit && "opacity-80"
                                  )}
                                />
                              </div>
                            ) : null}

                          </td>
                        ))}
                        
                        <td className="w-full bg-white"></td>
                      </tr>
                    ))}
                    
                    {activeSheetMeta?.canEdit && (
                      <tr onClick={addRow} className="cursor-pointer hover:bg-slate-50 group border-t border-slate-200">
                        <td className="py-3 px-3 border-r border-slate-100 text-center text-slate-300 font-mono text-xs bg-slate-50/20">
                          <Plus className="w-3.5 h-3.5 mx-auto opacity-40 group-hover:opacity-100 transition-opacity text-blue-500" />
                        </td>
                        <td colSpan={data.columns.length + 1} className="py-3 px-6 text-blue-600 text-[11px] font-bold uppercase tracking-widest pl-10 border-t border-slate-100">Add New Row</td>
                        <td className="w-full bg-white"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Template Confirmation */}
        <Dialog open={isTemplateConfirmOpen} onOpenChange={setIsTemplateConfirmOpen}>
          <DialogContent className="sm:max-w-[420px]">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                   <AlertCircle className="w-5 h-5 text-orange-500" /> Reset to Template?
                </DialogTitle>
             </DialogHeader>
             <div className="py-3">
                <p className="text-sm text-slate-600">
                   Applying this template will **replace your current columns and rows** with the template structure. Any typed data that doesn't fit the new schema will be lost.
                </p>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2 mb-1">
                      <Database className="w-3 h-3" /> Targeted Schema
                   </p>
                   <p className="text-sm font-medium text-slate-900 capitalize">
                      {pendingTemplate === BLANK_GRID ? "Blank Grid Template" : "Event Tracker Template"}
                   </p>
                </div>
             </div>
             <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setIsTemplateConfirmOpen(false)}>Cancel</Button>
                <Button onClick={confirmApplyTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">Reset & Apply</Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: New Sheet */}
        <Dialog open={isNewSheetModalOpen} onOpenChange={setIsNewSheetModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create New Sheet</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <label className="text-sm font-medium text-slate-700 block mb-2">Sheet Name</label>
               <input 
                 type="text"
                 value={newSheetName}
                 onChange={e => setNewSheetName(e.target.value)}
                 className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 shadow-sm transition-all"
                 placeholder="e.g. Marketing Roadmap..."
                 autoFocus
               />
            </div>
            <DialogFooter>
               <Button onClick={createNewSheet} className="bg-blue-600 hover:bg-blue-700 text-white w-full h-11 font-bold shadow-md">Create Sheet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Edit Sheet Meta */}
        <Dialog open={isEditSheetModalOpen} onOpenChange={setIsEditSheetModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Sheet Settings</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <label className="text-sm font-medium text-slate-700 block mb-2">Sheet Name</label>
               <input 
                 type="text"
                 value={editingSheetMeta?.name || ''}
                 onChange={e => setEditingSheetMeta(prev => prev ? { ...prev, name: e.target.value } : null)}
                 className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
               />
            </div>
            <DialogFooter className="flex justify-between w-full sm:justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 mt-4">
               <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium" onClick={() => setIsDeleteConfirmOpen(true)}>Delete Sheet</Button>
               <Button onClick={updateSheetMeta} className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold shadow-md">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Column Config */}
        <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
          <DialogContent className="sm:max-w-[440px] max-h-[90vh] flex flex-col overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl text-slate-800 font-bold">{editingColumn?.id && data.columns.find(c => c.id === editingColumn.id) ? "Column Settings" : "New Column"}</DialogTitle>
            </DialogHeader>
            {editingColumn && (
              <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block ml-0.5">Column Name</label>
                  <input 
                    type="text" 
                    value={editingColumn.name} 
                    onChange={e => setEditingColumn({ ...editingColumn, name: e.target.value })} 
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all font-medium" 
                    placeholder="Enter column name..." 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block ml-0.5">Format</label>
                  <AnimatedDropdown
                    options={[
                      { label: 'A text field', value: 'text' },
                      { label: 'Dropdown (Select)', value: 'dropdown' },
                      { label: 'Date picker format', value: 'date' }
                    ]}
                    value={editingColumn.type}
                    onChange={(val) => setEditingColumn({ ...editingColumn, type: val as ColumnType, options: val === 'dropdown' ? editingColumn.options || [] : [] })}
                    className="w-full"
                    triggerClassName="h-11 border-slate-300 font-medium"
                  />
                </div>
                {editingColumn.type === 'dropdown' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-sm font-bold text-slate-700 block ml-0.5">Dropdown Options</label>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-3 pl-0.5 custom-scrollbar">
                      {editingColumn.options?.map((opt, i) => (
                        <div key={opt.id} className="flex items-center gap-3 group/opt">
                          <AnimatedDropdown
                            options={[
                              { label: 'Gray', value: 'bg-slate-100 text-slate-800 border bg-slate-50 border-slate-200' },
                              { label: 'Red', value: 'bg-red-100 text-red-800 border bg-red-50 border-red-200' },
                              { label: 'Orange', value: 'bg-orange-100 text-orange-800 border bg-orange-50 border-orange-200' },
                              { label: 'Yellow', value: 'bg-yellow-100 text-yellow-800 border bg-yellow-50 border-yellow-200' },
                              { label: 'Green', value: 'bg-green-100 text-green-800 border bg-green-50 border-green-200' },
                              { label: 'Blue', value: 'bg-blue-100 text-blue-800 border bg-blue-50 border-blue-200' },
                              { label: 'Indigo', value: 'bg-indigo-100 text-indigo-800 border bg-indigo-50 border-indigo-200' },
                              { label: 'Purple', value: 'bg-purple-100 text-purple-800 border bg-purple-50 border-purple-200' },
                            ]}
                            value={opt.color}
                            onChange={(val) => {
                              const newOpts = [...(editingColumn.options || [])];
                              newOpts[i].color = val;
                              setEditingColumn({ ...editingColumn, options: newOpts });
                            }}
                            className="w-[110px] flex-none"
                            triggerClassName={cn("!px-2 !justify-center !h-10 shadow-sm border-slate-300 rounded-md transition-all hover:border-slate-400", opt.color)}
                            placeholder="Color"
                          />
                          <input 
                            type="text" 
                            value={opt.label} 
                            onChange={(e) => { const newOpts = [...(editingColumn.options || [])]; newOpts[i].label = e.target.value; setEditingColumn({ ...editingColumn, options: newOpts }); }} 
                            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm h-10 transition-all font-semibold text-slate-800" 
                            placeholder="Option label" 
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all flex-none" 
                            onClick={() => { const newOpts = editingColumn.options?.filter((_, idx) => idx !== i); setEditingColumn({ ...editingColumn, options: newOpts }); }}
                          >
                             <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-blue-600 border-blue-100 bg-blue-50/30 hover:bg-blue-50 py-3 h-auto transition-all border-dashed font-bold rounded-lg" 
                        onClick={() => { const newOpts = [...(editingColumn.options || []), { id: Math.random().toString(), label: '', color: 'bg-slate-100 text-slate-800 border border-slate-200' }]; setEditingColumn({ ...editingColumn, options: newOpts }); }}
                      >
                         <Plus className="w-4 h-4 mr-2"/> Add New Option
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="p-6 pt-2 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full bg-slate-50/50">
               <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold px-4" onClick={deleteColumn}>Delete Column</Button>
               <Button onClick={saveColumnConfig} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md hover:shadow-lg transition-all rounded-md h-11">Save Setup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

         <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
           <DialogContent className="sm:max-w-[400px]">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
                 <AlertCircle className="w-5 h-5" />
                 Delete Sheet
               </DialogTitle>
             </DialogHeader>
             <div className="py-4 text-sm text-slate-600 leading-relaxed">
               Are you sure you want to delete <span className="font-bold text-slate-900">"{editingSheetMeta?.name}"</span>? 
               This action is permanent and cannot be undone. All data in this table will be lost forever.
             </div>
             <DialogFooter className="gap-2 sm:gap-0 bg-slate-50 -mx-6 -mb-6 p-6 mt-2">
               <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">Cancel</Button>
               <Button variant="destructive" onClick={deleteSpecificSheet} className="font-bold shadow-sm">Permanently Delete</Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         {/* Modal: Share Sheet */}
          <CrudDialog
            open={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            title="Share Page"
            subtitle="Grant access to specific team members"
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



      </div>
    </AppLayout>
  );
}

function AutoResizeTextarea({ value, onChange, disabled, className, placeholder, ...props }: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Adjust on window resize and container resize (for column width changes)
  useEffect(() => {
    if (!textareaRef.current) return;
    const observer = new ResizeObserver(() => {
      adjustHeight();
    });
    observer.observe(textareaRef.current);
    return () => observer.disconnect();
  }, [adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }
    props.onKeyDown?.(e);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      rows={1}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

function SheetDatePicker({ value, onChange, disabled, "data-row": row, "data-col": col, onKeyDown }: any) {
  const toPickerDate = (val: string) => {
    if (!val) return "";
    const parts = val.split('/');
    if (parts.length === 3) {
      const [m, d, y] = parts;
      if (y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return val;
  };

  const fromPickerDate = (val: string) => {
    if (!val) return "";
    const parts = val.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
    }
    return val;
  };

  const handleInputChange = (val: string) => {
    // Detect if user is deleting
    const isDeleting = val.length < value.length;
    
    // Only allow digits and slashes
    let sanitized = val.replace(/[^\d/]/g, '');
    
    // Auto-insert slashes only when typing forwards
    if (!isDeleting) {
      if (sanitized.length === 2 && !sanitized.includes('/')) {
        const m = parseInt(sanitized);
        if (m > 12) sanitized = '12/';
        else if (m > 0) sanitized = sanitized + '/';
      } else if (sanitized.length === 5 && sanitized.split('/').length === 2) {
        const parts = sanitized.split('/');
        const d = parseInt(parts[1]);
        if (d > 31) sanitized = parts[0] + '/31/';
        else if (d > 0) sanitized = sanitized + '/';
      }
    }

    // Individual part validation
    const parts = sanitized.split('/');
    if (parts[0] && parts[0].length === 2) {
      const m = parseInt(parts[0]);
      if (m > 12) parts[0] = '12';
      if (m === 0) parts[0] = '01';
    }
    if (parts[1] && parts[1].length === 2) {
      const d = parseInt(parts[1]);
      if (d > 31) parts[1] = '31';
      if (d === 0) parts[1] = '01';
    }
    if (parts[2] && parts[2].length > 4) {
      parts[2] = parts[2].substring(0, 4);
    }
    
    sanitized = parts.join('/');

    // Overall length limit 10 (MM/DD/YYYY)
    if (sanitized.length <= 10) {
      onChange(sanitized);
    }
  };

  return (
    <div className="relative flex items-center group/date w-full" data-row={row} data-col={col}>
      <AutoResizeTextarea 
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        data-row={row}
        data-col={col}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full bg-transparent border-transparent hover:border-slate-200 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded px-2 py-1 text-sm transition-all text-slate-800 font-medium resize-none overflow-hidden block min-h-[30px] leading-relaxed pr-8",
          disabled && "cursor-default hover:border-transparent opacity-90",
          "sheet-cell-input"
        )}
        placeholder="MM/DD/YYYY"
      />
      {!disabled && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/date:opacity-100 focus-within:opacity-100 transition-opacity">
          <AnimatedDatePicker 
            value={toPickerDate(value)} 
            onChange={(val: string) => onChange(fromPickerDate(val))}
            triggerClassName="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 cursor-pointer" />
          </AnimatedDatePicker>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium", className)}>
      {children}
    </span>
  );
}
