"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Receipt, LayoutDashboard, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/receipts", label: "Receipts", icon: Receipt },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
  }

  function NavLinks({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => mobile && setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
                }
                ${mobile ? "w-full" : ""}
              `}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Receipt className="h-5 w-5" />
          LineByLine
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLinks />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="ml-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="flex items-center gap-2 mb-6">
              <Receipt className="h-5 w-5" />
              LineByLine
            </SheetTitle>
            <nav className="flex flex-col gap-2">
              <NavLinks mobile />
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="justify-start mt-4"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}