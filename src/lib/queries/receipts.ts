import { createClient } from "@/lib/supabase/client";

export async function getReceipts() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("receipts")
    .select(
      `
      *,
      line_items (*)
    `
    )
    .order("purchase_date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReceiptById(id: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("receipts")
    .select(
      `
      *,
      line_items (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReceipt(id: string) {
  const supabase = createClient();
  
  // Delete line items first (foreign key constraint)
  const { error: lineItemsError } = await supabase
    .from("line_items")
    .delete()
    .eq("receipt_id", id);

  if (lineItemsError) throw lineItemsError;

  // Then delete the receipt
  const { error: receiptError } = await supabase
    .from("receipts")
    .delete()
    .eq("id", id);

  if (receiptError) throw receiptError;
}

export async function getSpendingByCategory() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("line_items")
    .select("category, total_price");

  if (error) throw error;

  const byCategory = data.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + Number(item.total_price);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export async function getTopItems(limit = 10) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("line_items")
    .select("normalized_name, raw_description, total_price, category");

  if (error) throw error;

  const byItem = data.reduce((acc, item) => {
    const name = item.normalized_name || item.raw_description;
    if (!acc[name]) {
      acc[name] = { name, total: 0, count: 0, category: item.category };
    }
    acc[name].total += Number(item.total_price);
    acc[name].count += 1;
    return acc;
  }, {} as Record<string, { name: string; total: number; count: number; category: string }>);

  return Object.values(byItem)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}