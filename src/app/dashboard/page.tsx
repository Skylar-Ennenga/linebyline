"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getReceipts,
  getSpendingByCategory,
  getTopItems,
} from "@/lib/queries/receipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Dashboard() {
  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: getReceipts,
  });

  const { data: categorySpending, isLoading: categoryLoading } = useQuery({
    queryKey: ["spending-by-category"],
    queryFn: getSpendingByCategory,
  });

  const { data: topItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["top-items"],
    queryFn: () => getTopItems(10),
  });

  const totalSpent =
    receipts?.reduce((sum, r) => sum + Number(r.total), 0) || 0;

  if (receiptsLoading || categoryLoading || itemsLoading) {
    return (
      <main className="min-h-screen p-8 max-w-6xl mx-auto">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/" className="text-primary hover:underline">
          ← Upload Receipt
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{receipts?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{topItems?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorySpending?.map((cat) => (
                <div
                  key={cat.category}
                  className="flex justify-between items-center"
                >
                  <span>{cat.category}</span>
                  <span className="font-mono font-medium">
                    ${cat.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Items by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems?.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.count}x • {item.category}
                    </p>
                  </div>
                  <span className="font-mono font-medium">
                    ${item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Receipts */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {receipts?.map((receipt) => (
              <div
                key={receipt.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{receipt.store_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {receipt.purchase_date} • {receipt.item_count} items
                  </p>
                </div>
                <span className="font-mono font-medium">
                  ${Number(receipt.total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
