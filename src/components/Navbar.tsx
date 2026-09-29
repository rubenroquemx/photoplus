"use client";

import Link from "next/link";
import { Camera, ShoppingBag, ShieldCheck, Heart, User, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useState, useEffect } from "react";

interface CustomerNavSession {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}

interface NavbarProps {
  onOpenCart?: () => void;
  storeName?: string;
}

export default function Navbar({ onOpenCart, storeName = "PhotoPlus" }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<CustomerNavSession | null>(null);
  const [favCount, setFavCount] = useState<number>(0);
  const totalCount = useCartStore((state) => state.totalCount());

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/customer")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
          setFavCount(data.favoritesCount || 0);
        }
      })
      .catch(() => {});
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
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Galería
          </Link>

          {/* Customer Google Account / Login */}
          {customer ? (
            <Link
              href="/mi-cuenta"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all border border-neutral-200 dark:border-neutral-700/80"
            >
              {customer.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customer.picture}
                  alt={customer.name || customer.email}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-rose-500" />
              )}
              <span className="hidden md:inline truncate max-w-[120px]">
                {customer.name || "Mi Cuenta"}
              </span>
              <span className="md:hidden">Cuenta</span>
              {favCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2">
                  ♥ {favCount}
                </span>
              )}
            </Link>
          ) : (
            <a
              href="/api/auth/customer/google"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Acceso Google</span>
            </a>
          )}

          <Link
            href="/admin"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            type="button"
            className="relative flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm transition-all cursor-pointer active:scale-95"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {mounted && totalCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center animate-scale">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
