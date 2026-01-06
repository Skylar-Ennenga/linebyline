// Category colors mapped to CSS variables
const categoryColorMap: Record<string, number> = {
  "Grocery": 1,
  "Household": 2,
  "Coffee & Drinks": 3,
  "Snacks": 4,
  "Health": 5,
  "Personal Care": 6,
  "Pet": 7,
  "Other": 8,
};

// Get consistent color index for a category
export function getCategoryColorIndex(category: string): number {
  if (categoryColorMap[category]) {
    return categoryColorMap[category];
  }
  
  // Generate consistent index for unknown categories based on hash
  const hash = category.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return (Math.abs(hash) % 8) + 1;
}

// Get Tailwind class for category background
export function getCategoryBgClass(category: string): string {
  const index = getCategoryColorIndex(category);
  return `bg-category-${index}`;
}

// Format currency consistently
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format compact currency for large numbers
export function formatMoneyCompact(amount: number): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatMoney(amount);
}

// Calculate monthly average
export function calculateMonthlyAverage(
  total: number,
  startDate: Date,
  endDate: Date
): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.max(1, diffDays / 30);
  return total / months;
}

// Format relative time
export function formatRelativeTime(days: number): string {
  if (days < 7) {
    return `Every ${Math.round(days)} days`;
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return `Every ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.round(days / 30);
    return `Every ${months} month${months > 1 ? 's' : ''}`;
  }
}