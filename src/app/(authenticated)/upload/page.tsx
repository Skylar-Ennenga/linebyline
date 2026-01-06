"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptUpload } from "@/components/receipt-upload";
import { ParsedReceipt } from "@/lib/actions/parse-receipt";
import { saveReceipt } from "@/lib/actions/save-receipt";
import { uploadReceiptFile, checkForDuplicate } from "@/lib/queries/receipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ParsedReceiptWithFile {
  receipt: ParsedReceipt;
  file: File;
  saved: boolean;
  saving: boolean;
  isDuplicate?: boolean;
  existingId?: string;
  skipDuplicate?: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const [parsedReceipts, setParsedReceipts] = useState<ParsedReceiptWithFile[]>([]);
  const [savingAll, setSavingAll] = useState(false);

  const handleParsed = async (receipt: ParsedReceipt, file: File) => {
    const { isDuplicate, existingId } = await checkForDuplicate(
      receipt.store_name,
      receipt.purchase_date,
      receipt.total,
      receipt.item_count
    );

    setParsedReceipts((prev) => [
      ...prev,
      {
        receipt,
        file,
        saved: false,
        saving: false,
        isDuplicate,
        existingId,
      },
    ]);
  };

  const saveItem = async (index: number) => {
    const item = parsedReceipts[index];
    if (item.saved || item.skipDuplicate || item.saving) return;

    setParsedReceipts((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, saving: true } : p))
    );

    try {
      const filePath = await uploadReceiptFile(item.file);
      await saveReceipt(item.receipt, filePath);

      setParsedReceipts((prev) =>
        prev.map((p, idx) =>
          idx === index ? { ...p, saved: true, saving: false } : p
        )
      );
    } catch (err) {
      console.error(err);
      setParsedReceipts((prev) =>
        prev.map((p, idx) => (idx === index ? { ...p, saving: false } : p))
      );
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);

    for (let i = 0; i < parsedReceipts.length; i++) {
      const item = parsedReceipts[i];
      if (item.saved || item.skipDuplicate || item.saving) continue;
      await saveItem(i);
    }

    setSavingAll(false);
  };

  const allSaved =
    parsedReceipts.length > 0 &&
    parsedReceipts.every((p) => p.saved || p.skipDuplicate);
  const unsavedCount = parsedReceipts.filter(
    (p) => !p.saved && !p.skipDuplicate
  ).length;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Receipts</h1>

      <div className="space-y-8">
        <ReceiptUpload onParsed={handleParsed} />

        {parsedReceipts.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Parsed Receipts ({parsedReceipts.length})
              </h2>
              <div className="flex gap-2">
                {allSaved ? (
                  <Button onClick={() => router.push("/receipts")}>
                    View All Receipts
                  </Button>
                ) : (
                  <Button onClick={handleSaveAll} disabled={savingAll || unsavedCount === 0}>
                    {savingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      `Save All (${unsavedCount})`
                    )}
                  </Button>
                )}
              </div>
            </div>

            {parsedReceipts.map((item, idx) => (
              <Card
                key={idx}
                className={item.saved || item.skipDuplicate ? "opacity-60" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {item.receipt.store_name}
                        {item.saved && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {item.saving && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        {item.isDuplicate && !item.saved && !item.skipDuplicate && (
                          <span className="flex items-center gap-1 text-sm font-normal text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Possible duplicate
                          </span>
                        )}
                        {item.skipDuplicate && (
                          <span className="text-sm font-normal text-muted-foreground">
                            Skipped
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {item.receipt.purchase_date} •{" "}
                        {item.receipt.item_count} items
                        {item.isDuplicate && item.existingId && !item.skipDuplicate && !item.saved && (
                          <>
                            {" • "}
                            <Link
                              href={`/receipts/${item.existingId}`}
                              className="text-primary hover:underline"
                              target="_blank"
                            >
                              View existing
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-xl font-bold">
                      ${item.receipt.total.toFixed(2)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="text-sm text-muted-foreground">
                      {item.receipt.line_items.slice(0, 3).map((li, i) => (
                        <span key={i}>
                          {li.normalized_name}
                          {i < 2 && i < item.receipt.line_items.length - 1
                            ? ", "
                            : ""}
                        </span>
                      ))}
                      {item.receipt.line_items.length > 3 && (
                        <span> +{item.receipt.line_items.length - 3} more</span>
                      )}
                    </div>
                    {!item.saved && !item.skipDuplicate && !item.saving && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setParsedReceipts((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, skipDuplicate: true } : p
                              )
                            )
                          }
                        >
                          Skip
                        </Button>
                        <Button size="sm" onClick={() => saveItem(idx)}>
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}