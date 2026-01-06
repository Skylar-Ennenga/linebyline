"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseReceipt, ParsedReceipt } from "@/lib/actions/parse-receipt";
import { CheckCircle, XCircle, Loader2, FileText, X } from "lucide-react";

type FileStatus = "pending" | "processing" | "success" | "error";

interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  receipt?: ParsedReceipt;
  error?: string;
}

interface ReceiptUploadProps {
  onParsed: (receipt: ParsedReceipt, file: File) => void;
  onBatchComplete?: (results: QueuedFile[]) => void;
}

export function ReceiptUpload({ onParsed, onBatchComplete }: ReceiptUploadProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.match(/^(application\/pdf|image\/(jpeg|png|webp|gif))$/)
    );

    const newItems: QueuedFile[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: "pending",
    }));

    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    setIsProcessing(true);

    const pendingItems = queue.filter((item) => item.status === "pending");

    for (const item of pendingItems) {
      // Update status to processing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "processing" } : q))
      );

      try {
        const formData = new FormData();
        formData.append("receipt", item.file);

        const result = await parseReceipt(formData);

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "success", receipt: result } : q
          )
        );

        onParsed(result, item.file);
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "error",
                  error: err instanceof Error ? err.message : "Failed to parse",
                }
              : q
          )
        );
      }
    }

    setIsProcessing(false);
    
    // Notify parent of batch completion
    setQueue((currentQueue) => {
      if (onBatchComplete) {
        onBatchComplete(currentQueue);
      }
      return currentQueue;
    });
  }, [queue, onParsed, onBatchComplete]);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status === "pending" || item.status === "processing"));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
      e.target.value = ""; // Reset input
    },
    [addFiles]
  );

  const statusIcon = (status: FileStatus) => {
    switch (status) {
      case "pending":
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const hasFiles = queue.length > 0;
  const hasPending = queue.some((item) => item.status === "pending");
  const hasCompleted = queue.some((item) => item.status === "success" || item.status === "error");

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <div className="text-4xl mb-4">🧾</div>
          <p className="text-lg font-medium mb-2">Drop your receipts here</p>
          <p className="text-sm text-muted-foreground mb-4">
            PDF or image files • Multiple files supported
          </p>
          <label>
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>Choose Files</span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept="application/pdf,image/*"
              multiple
              onChange={handleChange}
            />
          </label>
        </CardContent>
      </Card>

      {hasFiles && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center mb-4">
              <p className="font-medium">
                {queue.length} file{queue.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                {hasCompleted && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted}>
                    Clear completed
                  </Button>
                )}
                {hasPending && (
                  <Button
                    size="sm"
                    onClick={processQueue}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Process ${queue.filter((q) => q.status === "pending").length} receipt${queue.filter((q) => q.status === "pending").length !== 1 ? "s" : ""}`
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {statusIcon(item.status)}
                    <span className="text-sm truncate">{item.file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "success" && item.receipt && (
                      <span className="text-sm text-muted-foreground">
                        {item.receipt.store_name} • ${item.receipt.total.toFixed(2)}
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="text-sm text-destructive">{item.error}</span>
                    )}
                    {item.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFromQueue(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}