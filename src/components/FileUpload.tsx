import { Upload, FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const textFile = files.find((file) => file.name.endsWith(".txt"));

      if (textFile) {
        setSelectedFile(textFile);
        onFileSelect(textFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        setSelectedFile(files[0]);
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-12 transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <input
        type="file"
        accept=".txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id="file-upload"
      />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {selectedFile ? (
          <>
            <div className="p-4 bg-accent/10 rounded-full">
              <FileText className="h-12 w-12 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <label
              htmlFor="file-upload"
              className="text-sm text-primary hover:text-primary/80 cursor-pointer underline underline-offset-4"
            >
              Choose a different file
            </label>
          </>
        ) : (
          <>
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Drop your WhatsApp chat export here
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                or click to browse for a .txt file
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground mt-2">
              <p>• Export chat from WhatsApp (without media)</p>
              <p>• Supports group chats and individual conversations</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
