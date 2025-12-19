"use client";

import { useState } from "react";
import { ReceiptUpload } from "@/components/receipt-upload";
import { ParsedReceipt } from "@/lib/actions/parse-receipt";
import { saveReceipt } from "@/lib/actions/save-receipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!receipt) return;

    setSaving(true);
    try {
      await saveReceipt(receipt);
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleNewReceipt = (parsed: ParsedReceipt) => {
    setReceipt(parsed);
    setSaved(false);
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">LineByLine</h1>

      <div className="space-y-8">
        <ReceiptUpload onParsed={handleNewReceipt} />

        {receipt && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{receipt.store_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {receipt.store_location} • {receipt.purchase_date}
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving || saved}>
                  {saved ? "Saved ✓" : saving ? "Saving..." : "Save Receipt"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {receipt.line_items.map((item, i) => (
                  <div
                    key={i}
                    className={`flex justify-between py-2 border-b last:border-0 ${
                      item.is_discount ? "text-green-600" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">{item.normalized_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category} → {item.subcategory}
                      </p>
                    </div>
                    <p className="font-mono">
                      {item.is_discount ? "-" : ""}$
                      {Math.abs(item.total_price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-1 text-right">
                <p>Subtotal: ${receipt.subtotal.toFixed(2)}</p>
                <p>Tax: ${receipt.tax.toFixed(2)}</p>
                <p className="text-lg font-bold">
                  Total: ${receipt.total.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
