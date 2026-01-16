"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMonthlySpending,
  getCategoryBreakdown,
  getSubscriptionItems,
  getMonthlySubscriptionTotal,
  getOneOffPurchases,
  TimeRange,
} from "@/lib/queries/dashboard";
import { formatMoney, formatSubscriptionFrequency } from "@/lib/utils/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  ShoppingBag,
  Repeat,
  ArrowRight
} from "lucide-react";

const categoryColors = [
  "bg-[var(--category-1)]",
  "bg-[var(--category-2)]",
  "bg-[var(--category-3)]",
  "bg-[var(--category-4)]",
  "bg-[var(--category-5)]",
  "bg-[var(--category-6)]",
  "bg-[var(--category-7)]",
  "bg-[var(--category-8)]",
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all-time");

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly-spending", timeRange],
    queryFn: () => getMonthlySpending(timeRange),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["category-breakdown", timeRange],
    queryFn: () => getCategoryBreakdown(timeRange),
  });

  const { data: subscriptionItems, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription-items", timeRange],
    queryFn: () => getSubscriptionItems(timeRange),
  });

  const { data: subscriptionTotal, isLoading: subscriptionTotalLoading } = useQuery({
    queryKey: ["subscription-total", timeRange],
    queryFn: () => getMonthlySubscriptionTotal(timeRange),
  });

  const { data: oneOffPurchases, isLoading: oneOffLoading } = useQuery({
    queryKey: ["one-off-purchases", timeRange],
    queryFn: () => getOneOffPurchases(timeRange),
  });

  const isLoading = monthlyLoading || categoriesLoading || subscriptionLoading || subscriptionTotalLoading || oneOffLoading;

  if (isLoading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </main>
    );
  }

  const hasData = monthlyData && monthlyData.receiptCount > 0;
  const topCategories = categories?.slice(0, 5) || [];
  const topSubscriptions = subscriptionItems?.slice(0, 8) || [];
  const highFreqSubscriptions = topSubscriptions.filter(item => item.frequencyType === 'high');
  const mediumFreqSubscriptions = topSubscriptions.filter(item => item.frequencyType === 'medium');
  const lowFreqSubscriptions = topSubscriptions.filter(item => item.frequencyType === 'low');
  const recentOneOffs = oneOffPurchases?.slice(0, 6) || [];
  const totalOneOffs = oneOffPurchases?.reduce((sum, item) => sum + item.amount, 0) || 0;

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild size="sm">
          <Link href="/upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Link>
        </Button>
      </div>

      {!hasData ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">No receipts for this period</p>
            <Button asChild>
              <Link href="/upload">Upload Your First Receipt</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Row - 4 compact cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Spent */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  {monthlyData.periodOverPeriodChange !== null && (
                    <div className={`flex items-center text-xs ${
                      monthlyData.periodOverPeriodChange > 0 
                        ? "text-[var(--status-down)]" 
                        : "text-[var(--status-up)]"
                    }`}>
                      {monthlyData.periodOverPeriodChange > 0 
                        ? <TrendingUp className="h-3 w-3 mr-1" />
                        : <TrendingDown className="h-3 w-3 mr-1" />
                      }
                      {Math.abs(monthlyData.periodOverPeriodChange).toFixed(0)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {formatMoney(monthlyData.totalSpent)}
                </p>
              </CardContent>
            </Card>

            {/* Receipts */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Receipts</p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {monthlyData.receiptCount}
                </p>
              </CardContent>
            </Card>

            {/* Avg per Receipt */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg per Trip</p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {formatMoney(monthlyData.totalSpent / monthlyData.receiptCount)}
                </p>
              </CardContent>
            </Card>

            {/* Monthly Subscriptions */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Monthly Subscriptions</p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {formatMoney(subscriptionTotal || 0)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Your Subscriptions */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Your Subscriptions</CardTitle>
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatMoney(subscriptionTotal || 0)}/mo
                </p>
              </CardHeader>
              <CardContent>
                {topSubscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {/* High Frequency */}
                    {highFreqSubscriptions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Daily/Weekly
                        </p>
                        <div className="space-y-2">
                          {highFreqSubscriptions.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatSubscriptionFrequency(item.avgDaysBetween)} • {item.purchaseCount}x purchased
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold tabular-nums text-sm">
                                  {formatMoney(item.monthlyEstimate)}
                                </p>
                                <p className="text-xs text-muted-foreground">/mo</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medium Frequency */}
                    {mediumFreqSubscriptions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Monthly
                        </p>
                        <div className="space-y-2">
                          {mediumFreqSubscriptions.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatSubscriptionFrequency(item.avgDaysBetween)} • {item.purchaseCount}x purchased
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold tabular-nums text-sm">
                                  {formatMoney(item.monthlyEstimate)}
                                </p>
                                <p className="text-xs text-muted-foreground">/mo</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low Frequency */}
                    {lowFreqSubscriptions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Quarterly & Beyond
                        </p>
                        <div className="space-y-2">
                          {lowFreqSubscriptions.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatSubscriptionFrequency(item.avgDaysBetween)} • {item.purchaseCount}x purchased
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold tabular-nums text-sm">
                                  {formatMoney(item.monthlyEstimate)}
                                </p>
                                <p className="text-xs text-muted-foreground">/mo</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {subscriptionItems && subscriptionItems.length > 8 && (
                      <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                        <Link href="/insights">
                          View all {subscriptionItems.length} subscriptions
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Upload more receipts to see subscription patterns
                  </p>
                )}
              </CardContent>
            </Card>

            {/* One-Off Purchases */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">One-Off Purchases</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatMoney(totalOneOffs)}
                </p>
              </CardHeader>
              <CardContent>
                {recentOneOffs.length > 0 ? (
                  <div className="space-y-2">
                    {recentOneOffs.map((item, index) => (
                      <div key={`${item.receiptId}-${item.itemName}-${index}`} className="pb-2 border-b last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {item.itemName || item.storeName || "Purchase"}
                            </p>
                            {item.storeName && item.itemName && (
                              <p className="text-xs text-muted-foreground truncate">{item.storeName}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-semibold tabular-nums text-sm">
                              {formatMoney(item.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.reason.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {oneOffPurchases && oneOffPurchases.length > 6 && (
                      <p className="text-xs text-muted-foreground pt-2 text-center">
                        +{oneOffPurchases.length - 6} more one-off purchases
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No one-off purchases detected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Spending by Category</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCategories.map((category, index) => (
                  <div key={category.category} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{category.category}</span>
                      <span className="tabular-nums">{formatMoney(category.total)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${categoryColors[index % categoryColors.length]}`}
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {category.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {categories && categories.length > 5 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{categories.length - 5} more categories
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Receipts - compact list */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Recent Receipts</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/receipts">
                    View all
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* We'll need to add a recent receipts query, for now show placeholder */}
                <RecentReceiptsWidget />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

// Separate component to fetch recent receipts
function RecentReceiptsWidget() {
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["recent-receipts"],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("receipts")
        .select("id, store_name, total, purchase_date, item_count")
        .order("purchase_date", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="h-20 bg-muted rounded animate-pulse col-span-3" />;
  }

  if (!receipts || receipts.length === 0) {
    return <p className="text-sm text-muted-foreground col-span-3">No receipts yet</p>;
  }

  return (
    <>
      {receipts.map((receipt) => (
        <Link
          key={receipt.id}
          href={`/receipts/${receipt.id}`}
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{receipt.store_name}</p>
            <p className="text-xs text-muted-foreground">
              {receipt.purchase_date} • {receipt.item_count} items
            </p>
          </div>
          <p className="font-semibold tabular-nums text-sm ml-4">
            {formatMoney(Number(receipt.total))}
          </p>
        </Link>
      ))}
    </>
  );
}