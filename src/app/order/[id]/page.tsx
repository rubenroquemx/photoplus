"use client";

import { useEffect, useState, use } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Clock, XCircle, Download, ShieldCheck, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  downloadToken: string;
  downloadCount: number;
  downloadLimit: number;
  expiresAt: string;
  price: number;
  photo: {
    id: string;
    driveFileId: string;
    name: string;
    mimeType: string;
    album: {
      title: string;
    };
  };
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string | null;
  total: number;
  currency: string;
  status: string; // PENDING, APPROVED, REJECTED
  createdAt: string;
  items: OrderItem[];
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo cargar la orden");
      }

      setOrder(data.order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar la orden";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleSimulateApproval = async () => {
    try {
      setSimulating(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate_approval" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrder();
      }
    } catch (err) {
      console.error("Error simulating approval:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la galería</span>
        </Link>

        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800">
            <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Cargando estado de tu orden...</p>
          </div>
        ) : error || !order ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold">Orden no encontrada</h2>
            <p className="text-sm text-neutral-500 mt-1">{error || "No pudimos localizar la información del pedido."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Header Banner */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
                order.status === "APPROVED"
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                  : order.status === "PENDING"
                  ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100"
                  : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100"
              }`}
            >
              <div className="flex items-start gap-4">
                {order.status === "APPROVED" ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : order.status === "PENDING" ? (
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0" />
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h1 className="text-2xl font-black">
                      {order.status === "APPROVED"
                        ? "¡Pago acreditado! Descarga tus fotos"
                        : order.status === "PENDING"
                        ? "Esperando confirmación del pago"
                        : "El pago no pudo procesarse"}
                    </h1>
                    <span className="text-xs font-mono font-bold bg-white/60 dark:bg-black/40 px-2.5 py-1 rounded-lg">
                      {order.orderNumber}
                    </span>
                  </div>

                  <p className="mt-2 text-sm opacity-90">
                    {order.status === "APPROVED"
                      ? `Hemos enviado los enlaces de descarga segura a ${order.customerEmail}. También puedes descargarlas directamente a continuación.`
                      : order.status === "PENDING"
                      ? "Tu pago en Mercado Pago se está procesando o está pendiente de acreditación."
                      : "La transacción fue rechazada. Por favor intenta con otro medio de pago."}
                  </p>

                  {/* Demo Simulation Action Button */}
                  {order.status === "PENDING" && (
                    <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleSimulateApproval}
                        disabled={simulating}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{simulating ? "Acreditando..." : "Simular Pago Acreditado (Modo Demo)"}</span>
                      </button>
                      <span className="text-[11px] opacity-75">
                        Permite probar la descarga en alta resolución desde Google Drive sin realizar un cobro real.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Purchased Photos Download List */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Fotografías adquiridas ({order.items.length})</span>
              </h2>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail Preview */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/photos/${item.photo.driveFileId}/preview`}
                        alt={item.photo.name}
                        className="w-16 h-16 object-cover rounded-xl shrink-0 border border-neutral-200 dark:border-neutral-800"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                          {item.photo.album.title}
                        </span>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {item.photo.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                          <span>
                            Descargas: {item.downloadCount} / {item.downloadLimit}
                          </span>
                          <span>•</span>
                          <span>
                            Vence: {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div>
                      {order.status === "APPROVED" ? (
                        <a
                          href={`/api/download/${item.downloadToken}`}
                          download
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar Original (Alta Resolución)</span>
                        </a>
                      ) : (
                        <div className="text-xs text-neutral-400 italic">
                          Disponible al acreditarse el pago
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary footer */}
              <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-sm">
                <span className="text-neutral-500">Total pagado</span>
                <span className="text-xl font-black text-neutral-900 dark:text-white">
                  ${order.total.toFixed(2)} MXN
                </span>
              </div>
            </div>

            {/* Security note */}
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs text-neutral-500 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Los archivos descargados son los originales en resolución nativa, sin marcas de agua ni compresión,
                extraídos directamente de Google Drive con licencia de uso personal.
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
