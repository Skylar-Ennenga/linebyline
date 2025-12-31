"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseReceipt, ParsedReceipt } from "@/lib/actions/parse-receipt";

type UploadState = "idle" | "uploading" | "success" | "error";

interface ReceiptUploadProps {
  onParsed: (receipt: ParsedReceipt, file: File) => void;
}

export function ReceiptUpload({ onParsed }: ReceiptUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^(application\/pdf|image\/(jpeg|png|webp|gif))$/)) {
        setError("Please upload a PDF or image file");
        return;
      }

      setState("uploading");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("receipt", file);

        const result = await parseReceipt(formData);
        setState("success");
        onParsed(result, file);
      } catch (err) {
        setState("error");
        setError(
          err instanceof Error ? err.message : "Failed to parse receipt"
        );
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
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
        {state === "uploading" ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing receipt...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">🧾</div>
            <p className="text-lg font-medium mb-2">Drop your receipt here</p>
            <p className="text-sm text-muted-foreground mb-4">
              PDF or image files
            </p>
            <label>
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose File</span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept="application/pdf,image/*"
                onChange={handleChange}
              />
            </label>
            {error && <p className="text-sm text-destructive mt-4">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}