"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getReceiptById, deleteReceipt, updateLineItem } from "@/lib/queries/receipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import Link from "next/link";

interface LineItem {
  id: string;
  normalized_name: string;
  category: string;
  subcategory: string;
  total_price: number;
  is_discount: boolean;
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [editForm, setEditForm] = useState({
    normalized_name: "",
    category: "",
    subcategory: "",
  });

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

  const updateMutation = useMutation({
    mutationFn: () =>
      updateLineItem(editingItem!.id, editForm, {
        normalized_name: editingItem!.normalized_name,
        category: editingItem!.category,
        subcategory: editingItem!.subcategory,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipt", id] });
      setEditingItem(null);
    },
  });

  function handleDelete() {
    if (confirm("Are you sure you want to delete this receipt?")) {
      deleteMutation.mutate();
    }
  }

  function openEditModal(item: LineItem) {
    setEditingItem(item);
    setEditForm({
      normalized_name: item.normalized_name,
      category: item.category,
      subcategory: item.subcategory,
    });
  }

  function handleSaveEdit() {
    updateMutation.mutate();
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
            {receipt.line_items?.map((item: LineItem) => (
              <div
                key={item.id}
                className={`flex justify-between items-center py-2 border-b last:border-0 group ${
                  item.is_discount ? "text-green-600" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{item.normalized_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.category} → {item.subcategory}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono">
                    {item.is_discount ? "-" : ""}$
                    {Math.abs(item.total_price).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openEditModal(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
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

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={editForm.normalized_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, normalized_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={editForm.subcategory}
                onChange={(e) =>
                  setEditForm({ ...editForm, subcategory: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}