"use server";

import { createClient } from "@/lib/supabase/server";
import { ParsedReceipt } from "./parse-receipt";

export async function saveReceipt(receipt: ParsedReceipt) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error("You must be logged in to save receipts");
  }

  const { data: receiptData, error: receiptError } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      store_name: receipt.store_name,
      store_location: receipt.store_location,
      purchase_date: receipt.purchase_date,
      subtotal: receipt.subtotal,
      tax: receipt.tax,
      total: receipt.total,
      item_count: receipt.item_count,
      raw_text: JSON.stringify(receipt),
    })
    .select()
    .single();

  if (receiptError) {
    throw new Error(`Failed to save receipt: ${receiptError.message}`);
  }

  const lineItems = receipt.line_items.map((item) => ({
    user_id: user.id,
    receipt_id: receiptData.id,
    item_code: item.item_code,
    raw_description: item.raw_description,
    normalized_name: item.normalized_name,
    category: item.category,
    subcategory: item.subcategory,
    quantity: item.quantity,
    total_price: item.total_price,
    is_taxable: item.is_taxable,
    is_discount: item.is_discount,
  }));

  const { error: itemsError } = await supabase
    .from("line_items")
    .insert(lineItems);

  if (itemsError) {
    throw new Error(`Failed to save line items: ${itemsError.message}`);
  }

  return receiptData;
}