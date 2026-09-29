"use client";

import Link from "next/link";
import { Camera, ShoppingBag, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useState, useEffect } from "react";

interface NavbarProps {
  onOpenCart?: () => void;
  storeName?: string;
}

export default function Navbar({ onOpenCart, storeName = "PhotoPlus" }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const totalCount = useCartStore((state) => state.totalCount());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-neutral-900 dark:text-white">
              {storeName}
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Drive Sync
            </span>
          </div>
        </Link>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Galería
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
            <span className="hidden md:inline">Panel</span> Admin
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            type="button"
            className="relative flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm transition-all cursor-pointer active:scale-95"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {mounted && totalCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
