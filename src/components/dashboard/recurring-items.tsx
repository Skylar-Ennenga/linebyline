"use client";

import { RecurringItem } from "@/lib/queries/dashboard";
import { formatMoney, formatRelativeTime } from "@/lib/utils/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecurringItemsProps {
  items: RecurringItem[];
}

export function RecurringItems({ items }: RecurringItemsProps) {
  // Show top 6 recurring items by monthly cost
  const topItems = items.slice(0, 6);

  if (topItems.length === 0) {
    return null;
  }

  const totalMonthly = topItems.reduce((sum, item) => sum + item.monthlyEstimate, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Regular Items</CardTitle>
        <p className="text-sm text-muted-foreground">
          Items you buy repeatedly, estimated monthly
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topItems.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium truncate" title={item.name}>
                {item.name}
              </p>
              <p className="text-2xl font-semibold tabular-nums mt-1">
                {formatMoney(item.monthlyEstimate)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {formatRelativeTime(item.avgDaysBetween)}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.purchaseCount} purchases • avg {formatMoney(item.avgPrice)}
              </p>
            </div>
          ))}
        </div>
        {topItems.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">
                These {topItems.length} items alone
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {formatMoney(totalMonthly)}/mo
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}