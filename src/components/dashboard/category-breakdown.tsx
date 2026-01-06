"use client";

import { CategorySpending } from "@/lib/queries/dashboard";
import { formatMoney } from "@/lib/utils/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryBreakdownProps {
  categories: CategorySpending[];
}

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

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...categories.map((c) => c.total));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where It Goes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category, index) => (
          <div key={category.category} className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-medium">{category.category}</span>
              <span className="money-inline">{formatMoney(category.total)}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  categoryColors[index % categoryColors.length]
                }`}
                style={{ width: `${(category.total / maxTotal) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {category.itemCount} items • {category.percentage.toFixed(0)}% of total
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}