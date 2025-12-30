import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Receipt, TrendingUp, Search, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-6">
          <Receipt className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          LineByLine
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Track your spending, item by item. Upload receipts, see where your money goes, and never wonder "what did I spend on groceries?" again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-lg mb-2">See Your Spending</h3>
            <p className="text-muted-foreground">
              Automatic categorization shows exactly where your money goes.
            </p>
          </div>
          <div className="text-center p-6">
            <Search className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-lg mb-2">Search Everything</h3>
            <p className="text-muted-foreground">
              Find any item across all your receipts instantly.
            </p>
          </div>
          <div className="text-center p-6">
            <Clock className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-lg mb-2">Track Over Time</h3>
            <p className="text-muted-foreground">
              See price changes and buying patterns month to month.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}