"use client";

import { MonthlySpending, TimeRange } from "@/lib/queries/dashboard";
import { formatMoney } from "@/lib/utils/categories";
import { TrendingUp, TrendingDown, Minus, Receipt } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpendingHeroProps {
  data: MonthlySpending;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function SpendingHero({ data, timeRange, onTimeRangeChange }: SpendingHeroProps) {
  const getTrendIcon = () => {
    if (data.periodOverPeriodChange === null) return null;
    if (data.periodOverPeriodChange > 0) return <TrendingUp className="h-5 w-5" />;
    if (data.periodOverPeriodChange < 0) return <TrendingDown className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  const getTrendColor = () => {
    if (data.periodOverPeriodChange === null) return "text-muted-foreground";
    if (data.periodOverPeriodChange > 0) return "text-[var(--status-down)]";
    if (data.periodOverPeriodChange < 0) return "text-[var(--status-up)]";
    return "text-muted-foreground";
  };

  if (data.receiptCount === 0) {
    return (
      <div className="flex-1">
        <div className="mb-4">
          <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-8">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">No spending data for this period</h2>
          <p className="text-muted-foreground">
            Try selecting a different time range
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2">
      <div className="mb-4">
        <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-muted-foreground">
        {data.periodLabel} spending
      </p>
      <div className="flex items-baseline gap-4 flex-wrap">
        <span className="money-hero">{formatMoney(data.totalSpent)}</span>
        {data.periodOverPeriodChange !== null && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">
              {Math.abs(data.periodOverPeriodChange).toFixed(0)}%
            </span>
            <span className="text-sm text-muted-foreground">
              vs previous period
            </span>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Across {data.receiptCount} receipt{data.receiptCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}