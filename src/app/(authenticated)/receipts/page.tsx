"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReceipts, deleteReceipt } from "@/lib/queries/receipts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Receipt, ChevronRight, Trash2 } from "lucide-react";

export default function ReceiptsPage() {
  const queryClient = useQueryClient();
  
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: getReceipts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault(); // Prevent navigating to detail page
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this receipt?")) {
      deleteMutation.mutate(id);
    }
  }

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
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-semibold">
                      ${Number(receipt.total).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, receipt.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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