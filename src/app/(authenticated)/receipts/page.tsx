"use client";

import { useQuery } from "@tanstack/react-query";
import { getReceipts } from "@/lib/queries/receipts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Receipt, ChevronRight } from "lucide-react";

export default function ReceiptsPage() {
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: getReceipts,
  });

  if (isLoading) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Receipts</h1>
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Receipts</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No receipts yet</p>
            <Button asChild>
              <Link href="/upload">Upload Your First Receipt</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <Button asChild>
          <Link href="/upload">Upload New</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {receipts.map((receipt) => (
          <Link key={receipt.id} href={`/receipts/${receipt.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{receipt.store_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.purchase_date} • {receipt.item_count} items
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono font-semibold">
                      ${Number(receipt.total).toFixed(2)}
                    </p>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}