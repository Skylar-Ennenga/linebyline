"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getReceiptById, deleteReceipt } from "@/lib/queries/receipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => getReceiptById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      router.push("/receipts");
    },
  });

  function handleDelete() {
    if (confirm("Are you sure you want to delete this receipt?")) {
      deleteMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!receipt) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Receipt not found</p>
        <Button asChild variant="link" className="px-0 mt-2">
          <Link href="/receipts">← Back to receipts</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/receipts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{receipt.store_name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {receipt.store_location} • {receipt.purchase_date}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {receipt.line_items?.map((item: any, i: number) => (
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
            <p>Subtotal: ${Number(receipt.subtotal).toFixed(2)}</p>
            <p>Tax: ${Number(receipt.tax).toFixed(2)}</p>
            <p className="text-lg font-bold">
              Total: ${Number(receipt.total).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}