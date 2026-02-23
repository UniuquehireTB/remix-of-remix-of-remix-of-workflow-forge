import { AppLayout } from "@/components/AppLayout";
import { FolderOpen, File, Image, FileText, Upload, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const files = [
  { id: 1, name: "Design Assets", type: "folder", items: 24, size: "142 MB", modified: "Feb 22" },
  { id: 2, name: "API Documentation", type: "folder", items: 8, size: "12 MB", modified: "Feb 20" },
  { id: 3, name: "sprint-14-planning.pdf", type: "pdf", items: null, size: "2.4 MB", modified: "Feb 19" },
  { id: 4, name: "wireframes-v3.fig", type: "file", items: null, size: "18 MB", modified: "Feb 18" },
  { id: 5, name: "logo-final.png", type: "image", items: null, size: "450 KB", modified: "Feb 15" },
  { id: 6, name: "Technical Specs", type: "folder", items: 12, size: "34 MB", modified: "Feb 12" },
];

const iconMap: Record<string, typeof FolderOpen> = {
  folder: FolderOpen,
  pdf: FileText,
  file: File,
  image: Image,
};

const Files = () => {
  return (
    <AppLayout title="Files" subtitle="Project documents and assets">
      <div className="flex items-center justify-end gap-2 mb-6">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Folder
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
        {files.map((file, i) => {
          const Icon = iconMap[file.type] || File;
          return (
            <div
              key={file.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Icon className={cn("w-5 h-5 shrink-0", file.type === "folder" ? "text-primary" : "text-muted-foreground")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
              </div>
              {file.items !== null && <span className="text-xs text-muted-foreground">{file.items} items</span>}
              <span className="text-xs text-muted-foreground w-20 text-right">{file.size}</span>
              <span className="text-xs text-muted-foreground w-16 text-right">{file.modified}</span>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Files;
