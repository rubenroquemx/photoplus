"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhotoCard, { PhotoData } from "@/components/PhotoCard";
import PhotoModal from "@/components/PhotoModal";
import CartDrawer from "@/components/CartDrawer";
import {
  Heart,
  ShoppingBag,
  Download,
  LogOut,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart";

interface CustomerUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}

interface PurchasedPhotoItem {
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
      id: string;
      title: string;
    };
  };
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  createdAt: string;
  items: PurchasedPhotoItem[];
}

export default function CustomerAccountPage() {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"compras" | "favoritas">("compras");

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [favorites, setFavorites] = useState<Array<{ id: string; photo: PhotoData }>>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [activePhoto, setActivePhoto] = useState<PhotoData | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const addCartItem = useCartStore((s) => s.addItem);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/customer");
      const data = await res.json();
      if (data.authenticated && data.customer) {
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/customer/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchFavorites = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/customer/favorites");
      const data = await res.json();
      if (data.favorites) setFavorites(data.favorites);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (customer) {
      if (activeTab === "compras") fetchPurchases();
      if (activeTab === "favoritas") fetchFavorites();
    }
  }, [customer, activeTab]);

  const handleLogout = async () => {
    await fetch("/api/auth/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setCustomer(null);
  };

  const handleAddAllFavoritesToCart = () => {
    for (const f of favorites) {
      addCartItem({
        id: f.photo.id,
        driveFileId: f.photo.driveFileId,
        name: f.photo.name,
        price: f.photo.price,
        albumId: f.photo.album.id,
        albumTitle: f.photo.album.title,
        previewUrl: `/api/photos/${f.photo.driveFileId}/preview`,
      });
    }
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Cargando cuenta de cliente...</p>
          </div>
        ) : !customer ? (
          /* Login Invitation */
          <div className="max-w-md mx-auto my-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-rose-500/20">
              <User className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
              Tu Cuenta de Cliente
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Inicia sesión con tu cuenta de Google para acceder a tus fotos compradas, tus favoritas y enlaces de descarga exclusivos.
            </p>

            <div className="mt-8 space-y-3">
              <a
                href="/api/auth/customer/google"
                className="w-full py-3.5 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Iniciar Sesión con Google</span>
              </a>

              <div className="pt-4 text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Tus descargas están protegidas e intransferibles</span>
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Customer Profile */
          <div className="space-y-8">
            {/* Header Profile Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {customer.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customer.picture}
                    alt={customer.name || customer.email}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    {customer.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-1 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cuenta de Google Verificada</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                    {customer.name || "Cliente"}
                  </h1>
                  <p className="text-xs text-neutral-500 font-medium">{customer.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <button
                onClick={() => setActiveTab("compras")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "compras"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mis Compras y Descargas ({orders.reduce((sum, o) => sum + o.items.length, 0)})</span>
              </button>

              <button
                onClick={() => setActiveTab("favoritas")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "favoritas"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Mis Favoritas ({favorites.length})</span>
              </button>
            </div>

            {/* Tab 1: Mis Compras y Descargas Seguras */}
            {activeTab === "compras" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Descargas protegidas e intransferibles:</strong> Cada botón de descarga solo funciona para ti. Si compartes el enlace con alguien más, el sistema denegará el acceso solicitando iniciar sesión con tu cuenta de Google.
                  </span>
                </div>

                {loadingData ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">Consultando tus fotos adquiridas...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
                    <ShoppingBag className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold">Aún no tienes fotografías compradas</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Explora las galerías disponibles y adquiere tus fotos favoritas en alta resolución original.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <span>Ir a la Galería</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg">
                              {ord.orderNumber}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-500">Total:</span>
                            <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                              ${ord.total.toFixed(2)} MXN
                            </span>
                          </div>
                        </div>

                        {/* List of Photos in this order */}
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 mt-2">
                          {ord.items.map((item) => (
                            <div
                              key={item.id}
                              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`/api/photos/${item.photo.driveFileId}/preview`}
                                  alt={item.photo.name}
                                  className="w-14 h-14 object-cover rounded-xl shrink-0 border border-neutral-200 dark:border-neutral-800"
                                />
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                                    {item.photo.album.title}
                                  </span>
                                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                    {item.photo.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                                    <span>Descargas: {item.downloadCount} / {item.downloadLimit}</span>
                                    <span>•</span>
                                    <span>Vence: {new Date(item.expiresAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <a
                                  href={`/api/download/${item.downloadToken}`}
                                  download
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Descargar Original (Alta Resolución)</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Mis Favoritas */}
            {activeTab === "favoritas" && (
              <div className="space-y-6">
                {favorites.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Tienes {favorites.length} fotografía(s) guardadas en tus favoritas.
                    </p>
                    <button
                      onClick={handleAddAllFavoritesToCart}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Comprar todas mis favoritas</span>
                    </button>
                  </div>
                )}

                {loadingData ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">Cargando tus favoritas...</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
                    <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold">Aún no has marcado fotos favoritas</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Explora la galería y haz clic en el corazón de cualquier foto para guardarla aquí.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <span>Explorar Galería</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((fav) => (
                      <PhotoCard
                        key={fav.id}
                        photo={fav.photo}
                        onPreviewClick={(p) => setActivePhoto(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <PhotoModal
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <Footer />
    </div>
  );
}
