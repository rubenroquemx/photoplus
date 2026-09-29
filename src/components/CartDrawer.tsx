"use client";

import { useState } from "react";
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/cart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, clearCart, totalAmount } = useCartStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Ingresa tu correo para recibir los enlaces de descarga");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: items.map((i) => i.id),
          customerEmail: email,
          customerName: name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar el pago");
      }

      // If demo or live preference received, redirect
      if (data.checkoutUrl) {
        clearCart();
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al conectar con Mercado Pago";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Tu Carrito ({items.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Tu carrito está vacío
                </h3>
                <p className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">
                  Explora la galería y selecciona las fotografías que deseas adquirir en alta resolución.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                      {item.albumTitle}
                    </span>
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5 block">
                      ${item.price.toFixed(2)} MXN
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Correo electrónico (para recibir tus fotos) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Nombre completo (opcional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-500">Total a pagar</span>
                  <span className="text-xl font-black text-neutral-900 dark:text-white">
                    ${totalAmount().toFixed(2)} MXN
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectando con Mercado Pago...</span>
                    </>
                  ) : (
                    <>
                      <span>Pagar con Mercado Pago</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pago 100% seguro con Mercado Pago</span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
