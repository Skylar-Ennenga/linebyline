import { createClient } from "@/lib/supabase/client";

export type TimeRange = "this-month" | "last-month" | "last-3-months" | "all-time";

export interface MonthlySpending {
  totalSpent: number;
  receiptCount: number;
  itemCount: number;
  earliestDate: string | null;
  latestDate: string | null;
  previousPeriodTotal: number;
  periodOverPeriodChange: number | null;
  periodLabel: string;
}

export interface CategorySpending {
  category: string;
  total: number;
  percentage: number;
  itemCount: number;
}

export interface RecurringItem {
  name: string;
  category: string;
  purchaseCount: number;
  totalSpent: number;
  avgPrice: number;
  avgDaysBetween: number;
  monthlyEstimate: number;
  lastPurchased: string;
}

export interface PriceChange {
  name: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  firstDate: string;
  lastDate: string;
}

function getDateRange(timeRange: TimeRange): { start: Date; end: Date; prevStart: Date; prevEnd: Date; label: string } {
  const now = new Date();
  
  switch (timeRange) {
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = now;
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end, prevStart, prevEnd, label: now.toLocaleString("default", { month: "long" }) };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      const label = start.toLocaleString("default", { month: "long" });
      return { start, end, prevStart, prevEnd, label };
    }
    case "last-3-months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = now;
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0);
      return { start, end, prevStart, prevEnd, label: "Last 3 Months" };
    }
    case "all-time":
    default: {
      const start = new Date(2000, 0, 1);
      const end = now;
      return { start, end, prevStart: start, prevEnd: start, label: "All Time" };
    }
  }
}

export async function getMonthlySpending(timeRange: TimeRange = "all-time"): Promise<MonthlySpending> {
  const supabase = createClient();
  const { start, end, prevStart, prevEnd, label } = getDateRange(timeRange);

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("total, purchase_date, item_count")
    .order("purchase_date", { ascending: true });

  if (error) throw error;
  if (!receipts || receipts.length === 0) {
    return {
      totalSpent: 0,
      receiptCount: 0,
      itemCount: 0,
      earliestDate: null,
      latestDate: null,
      previousPeriodTotal: 0,
      periodOverPeriodChange: null,
      periodLabel: label,
    };
  }

  // Filter to selected period
  const periodReceipts = receipts.filter(r => {
    const date = new Date(r.purchase_date);
    return date >= start && date <= end;
  });

  const totalSpent = periodReceipts.reduce((sum, r) => sum + Number(r.total), 0);
  const itemCount = periodReceipts.reduce((sum, r) => sum + (r.item_count || 0), 0);

  // Previous period for comparison
  const prevReceipts = receipts.filter(r => {
    const date = new Date(r.purchase_date);
    return date >= prevStart && date <= prevEnd;
  });
  const previousPeriodTotal = prevReceipts.reduce((sum, r) => sum + Number(r.total), 0);

  // Calculate period-over-period change
  let periodOverPeriodChange: number | null = null;
  if (previousPeriodTotal > 0 && timeRange !== "all-time") {
    periodOverPeriodChange = ((totalSpent - previousPeriodTotal) / previousPeriodTotal) * 100;
  }

  return {
    totalSpent,
    receiptCount: periodReceipts.length,
    itemCount,
    earliestDate: periodReceipts[0]?.purchase_date || null,
    latestDate: periodReceipts[periodReceipts.length - 1]?.purchase_date || null,
    previousPeriodTotal,
    periodOverPeriodChange,
    periodLabel: label,
  };
}

export async function getCategoryBreakdown(timeRange: TimeRange = "all-time"): Promise<CategorySpending[]> {
  const supabase = createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: lineItems, error } = await supabase
    .from("line_items")
    .select(`
      category,
      total_price,
      receipts!inner(purchase_date)
    `);

  if (error) throw error;
  if (!lineItems || lineItems.length === 0) return [];

  // Filter to selected period
  const periodItems = lineItems.filter(item => {
    const receipt = item.receipts as any;
    const date = new Date(receipt.purchase_date);
    return date >= start && date <= end;
  });

  const categoryMap = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  periodItems.forEach(item => {
    const category = item.category || "Other";
    const price = Number(item.total_price) || 0;
    
    if (price > 0) {
      grandTotal += price;
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + price,
        count: existing.count + 1,
      });
    }
  });

  const categories: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      itemCount: data.count,
    }))
    .sort((a, b) => b.total - a.total);

  return categories;
}

export async function getRecurringItems(timeRange: TimeRange = "all-time"): Promise<RecurringItem[]> {
  const supabase = createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: lineItems, error } = await supabase
    .from("line_items")
    .select(`
      normalized_name,
      category,
      total_price,
      receipts!inner(purchase_date)
    `);

  if (error) throw error;
  if (!lineItems || lineItems.length === 0) return [];

  // Filter to selected period
  const periodItems = lineItems.filter(item => {
    const receipt = item.receipts as any;
    const date = new Date(receipt.purchase_date);
    return date >= start && date <= end;
  });

  // Group by item name
  const itemMap = new Map<string, {
    category: string;
    purchases: { date: string; price: number }[];
  }>();

  periodItems.forEach(item => {
    const name = item.normalized_name || "Unknown";
    const receipt = item.receipts as any;
    const price = Number(item.total_price) || 0;
    
    if (price <= 0) return;

    const existing = itemMap.get(name) || { category: item.category || "Other", purchases: [] };
    existing.purchases.push({
      date: receipt.purchase_date,
      price,
    });
    itemMap.set(name, existing);
  });

  const recurringItems: RecurringItem[] = [];

  itemMap.forEach((data, name) => {
    if (data.purchases.length < 2) return;

    data.purchases.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalSpent = data.purchases.reduce((sum, p) => sum + p.price, 0);
    const avgPrice = totalSpent / data.purchases.length;

    let totalDays = 0;
    for (let i = 1; i < data.purchases.length; i++) {
      const daysBetween = Math.abs(
        new Date(data.purchases[i].date).getTime() - 
        new Date(data.purchases[i - 1].date).getTime()
      ) / (1000 * 60 * 60 * 24);
      totalDays += daysBetween;
    }
    const avgDaysBetween = totalDays / (data.purchases.length - 1);

    const purchasesPerMonth = 30 / avgDaysBetween;
    const monthlyEstimate = avgPrice * purchasesPerMonth;

    recurringItems.push({
      name,
      category: data.category,
      purchaseCount: data.purchases.length,
      totalSpent,
      avgPrice,
      avgDaysBetween,
      monthlyEstimate,
      lastPurchased: data.purchases[data.purchases.length - 1].date,
    });
  });

  return recurringItems.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
}



export async function getPriceChanges(): Promise<PriceChange[]> {
  const supabase = createClient();

  const { data: lineItems, error } = await supabase
    .from("line_items")
    .select(`
      normalized_name,
      category,
      total_price,
      receipts!inner(purchase_date)
    `);

  if (error) throw error;
  if (!lineItems || lineItems.length === 0) return [];

  // Group by item name
  const itemMap = new Map<string, {
    category: string;
    purchases: { date: string; price: number }[];
  }>();

  lineItems.forEach(item => {
    const name = item.normalized_name || "Unknown";
    const receipt = item.receipts as any;
    const price = Number(item.total_price) || 0;
    
    if (price <= 0) return; // Skip discounts

    const existing = itemMap.get(name) || { category: item.category || "Other", purchases: [] };
    existing.purchases.push({
      date: receipt.purchase_date,
      price,
    });
    itemMap.set(name, existing);
  });

  const priceChanges: PriceChange[] = [];

  itemMap.forEach((data, name) => {
    if (data.purchases.length < 2) return;

    // Sort by date
    data.purchases.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstPurchase = data.purchases[0];
    const lastPurchase = data.purchases[data.purchases.length - 1];

    // Only include if price actually changed
    if (firstPurchase.price === lastPurchase.price) return;

    const changePercent = ((lastPurchase.price - firstPurchase.price) / firstPurchase.price) * 100;

    priceChanges.push({
      name,
      category: data.category,
      oldPrice: firstPurchase.price,
      newPrice: lastPurchase.price,
      changePercent,
      firstDate: firstPurchase.date,
      lastDate: lastPurchase.date,
    });
  });

  // Sort by absolute change percent (biggest changes first)
  return priceChanges.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}