"use client";

import { useEffect, useState, useTransition } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  FolderSync,
  HardDrive,
  DollarSign,
  ShoppingBag,
  Settings,
  Layers,
  Lock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AdminAuthStatus {
  authenticated: boolean;
  driveConnected: boolean;
  account?: {
    email: string;
    name?: string | null;
    picture?: string | null;
    updatedAt: string;
  } | null;
  adminEmail?: string | null;
}

interface DriveFolder {
  id: string;
  name: string;
  createdTime?: string;
}

interface Album {
  id: string;
  driveFolderId: string;
  title: string;
  description?: string | null;
  defaultPrice: number;
  photosCount: number;
  isPublished: boolean;
  watermarkText?: string | null;
  lastSyncedAt?: string | null;
}

interface OrderItem {
  id: string;
  price: number;
  downloadCount: number;
  photo: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string | null;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface StoreSettings {
  storeName: string;
  storeTagline: string;
  defaultPrice: number;
  watermarkText: string;
  watermarkOpacity: number;
  driveRootFolderId?: string | null;
  contactEmail?: string | null;
}

export default function AdminPage() {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Active Tab: "drive" | "albums" | "orders" | "settings"
  const [activeTab, setActiveTab] = useState<"drive" | "albums" | "orders" | "settings">("drive");

  // Drive Folders & Syncing state
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [syncingFolderId, setSyncingFolderId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync Modal state
  const [selectedFolderToSync, setSelectedFolderToSync] = useState<DriveFolder | null>(null);
  const [syncPrice, setSyncPrice] = useState(50);
  const [syncWatermark, setSyncWatermark] = useState("PHOTOPLUS • MUESTRA");
  const [manualFolderInput, setManualFolderInput] = useState("");

  // Albums & Orders state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "PhotoPlus Studio",
    storeTagline: "Galería y venta de fotografías",
    defaultPrice: 50,
    watermarkText: "PHOTOPLUS • MUESTRA",
    watermarkOpacity: 0.35,
    driveRootFolderId: null,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/admin");
      const data = await res.json();
      setAuthStatus(data);
    } catch (err) {
      console.error("Error fetching auth:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriveFolders = async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch("/api/drive/folders");
      const data = await res.json();
      if (data.folders) {
        setDriveFolders(data.folders);
      }
    } catch (err) {
      console.error("Error fetching drive folders:", err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/admin/albums");
      const data = await res.json();
      if (data.albums) setAlbums(data.albums);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const msg = params.get("msg");
      if (err) {
        setLoginError(decodeURIComponent(err));
      }
      if (msg) {
        setSyncMessage({ text: decodeURIComponent(msg), type: "success" });
      }
    }
  }, []);

  useEffect(() => {
    if (authStatus?.authenticated) {
      fetchAlbums();
      fetchOrders();
      fetchSettings();
      if (authStatus.driveConnected) {
        fetchDriveFolders();
      }
    }
  }, [authStatus?.authenticated, authStatus?.driveConnected]);

  const handleLogout = async () => {
    await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    fetchAuthStatus();
  };

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualFolderInput.trim() || settings.driveRootFolderId || "";
    if (!val) return;
    const cleanId = val.replace(/^.*folders\//, "").replace(/\?.*$/, "");

    setSyncingFolderId(cleanId);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: cleanId,
          price: settings.defaultPrice || 50,
          watermarkText: settings.watermarkText || "PHOTOPLUS • MUESTRA",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar");
      }

      setSyncMessage({
        text: data.message || `¡Sincronización completada! (${data.totalPhotos || 0} fotos procesadas)`,
        type: "success",
      });

      fetchAlbums();
      fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al sincronizar la carpeta";
      setSyncMessage({ text: msg, type: "error" });
    } finally {
      setSyncingFolderId(null);
    }
  };

  const handleSyncFolder = async (folder: DriveFolder) => {
    setSyncingFolderId(folder.id);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: folder.id,
          folderName: folder.name,
          createdTime: folder.createdTime,
          price: syncPrice,
          watermarkText: syncWatermark,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar");
      }

      if (data.success === false) {
        throw new Error(data.message || data.error || "No se pudo sincronizar la carpeta");
      }

      setSyncMessage({
        text: `¡Carpeta "${data.albumTitle || folder.name}" sincronizada con éxito! (${data.totalPhotos} fotografías importadas)`,
        type: "success",
      });

      setSelectedFolderToSync(null);
      setManualFolderInput("");
      fetchAlbums();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al sincronizar la carpeta";
      setSyncMessage({ text: msg, type: "error" });
    } finally {
      setSyncingFolderId(null);
    }
  };

  const handleAutoSyncAll = async () => {
    setLoadingFolders(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSyncAll: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar todo");
      }

      setSyncMessage({
        text: `¡Sincronización masiva completada! Se procesaron ${data.results?.length || 0} carpetas desde Drive con el nombre de cada carpeta, fecha de creación original y precio base configurado.`,
        type: "success",
      });

      fetchAlbums();
      fetchDriveFolders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al sincronizar todas las carpetas";
      setSyncMessage({ text: msg, type: "error" });
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleToggleAlbumPublish = async (album: Album) => {
    try {
      const res = await fetch("/api/admin/albums", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: album.id,
          isPublished: !album.isPublished,
        }),
      });
      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este álbum y sus fotos de la tienda?")) return;

    try {
      const res = await fetch(`/api/admin/albums?id=${albumId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert("Configuración guardada correctamente");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!authStatus?.authenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 sm:p-10 rounded-3xl shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <HardDrive className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-black">Panel de Administración</h1>
            <p className="text-sm text-neutral-400 mt-2">
              Acceso exclusivo mediante la cuenta de Google vinculada a tu Google Drive.
            </p>

            {loginError && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-400 text-xs flex items-start text-left gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <a
                href="/api/auth/google"
                className="w-full py-4 px-5 bg-white hover:bg-neutral-100 text-neutral-900 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Acceder con Google Drive</span>
              </a>

              {authStatus?.adminEmail ? (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-[11px] text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Admin autorizado: <span className="text-white font-mono font-medium">{authStatus.adminEmail}</span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 pt-2">
                  Autenticación segura con Google OAuth 2.0 y Google Drive API
                </p>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">Panel de Control PhotoPlus</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Sincronización con Google Drive, catálogo y ventas con Mercado Pago.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-neutral-800 scrollbar-none">
          <button
            onClick={() => setActiveTab("drive")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "drive"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive</span>
            {authStatus?.driveConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("albums")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "albums"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Álbumes en Tienda ({albums.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "orders"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ventas y Órdenes ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "settings"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </div>

        {/* Tab 1: Google Drive Synchronization */}
        {activeTab === "drive" && (
          <div className="mt-8 space-y-6">
            {/* Connection Banner */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <HardDrive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {authStatus?.driveConnected ? "Google Drive Conectado" : "Conectar con Google Drive"}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {authStatus?.driveConnected && authStatus.account
                      ? `Conectado como ${authStatus.account.name || authStatus.account.email} (${authStatus.account.email})`
                      : "Vincula tu cuenta de Google para leer tus carpetas de fotos y entregar archivos en alta resolución."}
                  </p>
                </div>
              </div>

              <div>
                <a
                  href="/api/auth/google"
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all ${
                    authStatus?.driveConnected
                      ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                      : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-blue-600/20"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{authStatus?.driveConnected ? "Reconectar Cuenta Google" : "Conectar Google Drive con OAuth2"}</span>
                </a>
              </div>
            </div>

            {syncMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
                  syncMessage.type === "success"
                    ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                    : "bg-rose-950/50 border-rose-800 text-rose-300"
                }`}
              >
                {syncMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{syncMessage.text}</span>
              </div>
            )}

            {/* Carpeta Raíz con Subcarpetas */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <FolderSync className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">Carpeta Raíz de tu Tienda en Google Drive</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Dentro de esta carpeta coloca tus subcarpetas con fotos (ej. <em>Boda Andrea</em>, <em>Sesión Primavera</em>). 
                    Al sincronizar, <strong>cada subcarpeta se convertirá en un álbum individual</strong> con el nombre exacto de la carpeta, la fecha original de Drive y el precio base configurado.
                  </p>
                </div>
              </div>

              <form onSubmit={handleManualSync} className="mt-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={manualFolderInput}
                    onChange={(e) => setManualFolderInput(e.target.value)}
                    placeholder={settings.driveRootFolderId ? `Carpeta actual: ${settings.driveRootFolderId}` : "Pega aquí el enlace de tu carpeta raíz de Google Drive..."}
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={!manualFolderInput.trim() && !settings.driveRootFolderId}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {syncingFolderId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sincronizando Álbumes...</span>
                      </>
                    ) : (
                      <>
                        <FolderSync className="w-4 h-4" />
                        <span>Sincronizar Álbumes desde Carpeta Raíz</span>
                      </>
                    )}
                  </button>
                </div>

                {settings.driveRootFolderId && (
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Carpeta raíz vinculada en la tienda: <code className="text-neutral-300 font-mono">{settings.driveRootFolderId}</code>
                  </p>
                )}
              </form>
            </div>

            {/* Folder Browser */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Carpetas detectadas en Google Drive</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Selecciona una carpeta para sincronizarla como álbum fotográfico en tu tienda.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAutoSyncAll}
                    disabled={loadingFolders || !authStatus?.driveConnected}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    <span>Sincronizar Todas Automáticamente</span>
                  </button>
                  <button
                    onClick={fetchDriveFolders}
                    disabled={loadingFolders || !authStatus?.driveConnected}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFolders ? "animate-spin" : ""}`} />
                    <span>Actualizar lista</span>
                  </button>
                </div>
              </div>

              {!authStatus?.driveConnected ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
                  <HardDrive className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-300">
                    Primero debes conectar tu cuenta de Google Drive
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Haz clic en el botón superior para autorizar el acceso de lectura a tus fotos.
                  </p>
                </div>
              ) : loadingFolders ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">Consultando carpetas en Google Drive...</p>
                </div>
              ) : driveFolders.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-neutral-800 rounded-2xl">
                  <p className="text-sm font-semibold text-neutral-300">
                    No se encontraron carpetas en la raíz principal de tu Drive
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                    Si tu carpeta se encuentra en "Compartidos conmigo", en una unidad compartida o en una subcarpeta, usa el recuadro superior para pegar su enlace directo y sincronizarla de inmediato.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driveFolders.map((folder) => {
                    const isSynced = albums.some((a) => a.driveFolderId === folder.id);
                    const isSyncing = syncingFolderId === folder.id;

                    return (
                      <div
                        key={folder.id}
                        className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                            <FolderSync className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate" title={folder.name}>
                              {folder.name}
                            </h4>
                            <span className="text-[11px] text-neutral-500 block truncate font-mono">
                              ID: {folder.id}
                            </span>
                            {folder.createdTime && (
                              <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                                Creada en Drive: {new Date(folder.createdTime).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between">
                          {isSynced ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              <span>Sincronizado</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500">No importado</span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedFolderToSync(folder);
                            }}
                            disabled={isSyncing}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isSynced
                                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                                : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                            }`}
                          >
                            {isSyncing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Sincronizando...</span>
                              </>
                            ) : isSynced ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Re-sincronizar</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Importar Álbum</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sync Configuration Modal */}
            {selectedFolderToSync && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                  <h3 className="text-lg font-bold text-white">
                    Sincronizar Álbum: {selectedFolderToSync.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Se importarán todas las fotografías de esta carpeta para venderse individualmente.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Precio por fotografía individual (MXN)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={syncPrice}
                        onChange={(e) => setSyncPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Texto de la marca de agua en previsualizaciones
                      </label>
                      <input
                        type="text"
                        value={syncWatermark}
                        onChange={(e) => setSyncWatermark(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700 text-[11px] text-neutral-400 space-y-1">
                      <p>• Los compradores verán muestras con la marca de agua especificada.</p>
                      <p>• Al pagar con Mercado Pago, descargarán el archivo original en resolución nativa.</p>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedFolderToSync(null)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSyncFolder(selectedFolderToSync)}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                      >
                        Iniciar Sincronización
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Albums Management */}
        {activeTab === "albums" && (
          <div className="mt-8 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8">
              <h3 className="text-base font-bold text-white mb-4">Álbumes Activos en la Tienda</h3>

              {albums.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
                  <p className="text-sm text-neutral-400">Aún no has sincronizado ningún álbum.</p>
                  <button
                    onClick={() => setActiveTab("drive")}
                    className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                  >
                    Ir a Google Drive a importar
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                        <th className="pb-3">Álbum</th>
                        <th className="pb-3">Fotos</th>
                        <th className="pb-3">Precio por Foto</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">Última Sincronización</th>
                        <th className="pb-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {albums.map((album) => (
                        <tr key={album.id} className="hover:bg-neutral-800/30">
                          <td className="py-4 font-bold text-white">{album.title}</td>
                          <td className="py-4 text-neutral-300">{album.photosCount} fotos</td>
                          <td className="py-4 font-bold text-rose-400">${album.defaultPrice.toFixed(2)} MXN</td>
                          <td className="py-4">
                            <button
                              onClick={() => handleToggleAlbumPublish(album)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                                album.isPublished
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                              }`}
                            >
                              {album.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{album.isPublished ? "Público" : "Oculto"}</span>
                            </button>
                          </td>
                          <td className="py-4 text-neutral-400">
                            {album.lastSyncedAt
                              ? new Date(album.lastSyncedAt).toLocaleString()
                              : "Nunca"}
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteAlbum(album.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                              title="Eliminar álbum"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Orders and Sales History */}
        {activeTab === "orders" && (
          <div className="mt-8 space-y-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 block">Ingresos Totales (Aprobados)</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                  $
                  {orders
                    .filter((o) => o.status === "APPROVED")
                    .reduce((sum, o) => sum + o.total, 0)
                    .toFixed(2)}{" "}
                  <span className="text-xs text-neutral-400 font-bold">MXN</span>
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 block">Fotos Vendidas</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                  {orders
                    .filter((o) => o.status === "APPROVED")
                    .reduce((sum, o) => sum + o.items.length, 0)}
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 block">Órdenes Totales</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                  {orders.length}
                </span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8">
              <h3 className="text-base font-bold text-white mb-4">Historial de Órdenes</h3>

              {orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
                  <p className="text-sm text-neutral-400">Aún no se han registrado compras.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                        <th className="pb-3">Nº Orden</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Fotos</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-800/30">
                          <td className="py-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                          <td className="py-4">
                            <span className="font-semibold text-white block">{ord.customerName || "Cliente"}</span>
                            <span className="text-neutral-400 text-[11px]">{ord.customerEmail}</span>
                          </td>
                          <td className="py-4 text-neutral-300">{ord.items.length} foto(s)</td>
                          <td className="py-4 font-bold text-white">${ord.total.toFixed(2)} MXN</td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.status === "APPROVED"
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                                  : ord.status === "PENDING"
                                  ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                                  : "bg-rose-950/80 text-rose-400 border border-rose-800"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-4 text-neutral-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Store Settings */}
        {activeTab === "settings" && (
          <div className="mt-8 max-w-2xl">
            <form onSubmit={handleSaveSettings} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white">Configuración General de la Tienda</h3>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nombre del Estudio / Fotógrafo
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Eslogan o subtítulo
                </label>
                <input
                  type="text"
                  value={settings.storeTagline}
                  onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Precio por foto por defecto (MXN)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.defaultPrice}
                  onChange={(e) => setSettings({ ...settings, defaultPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Texto global de la marca de agua
                </label>
                <input
                  type="text"
                  value={settings.watermarkText}
                  onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Opacidad de la marca de agua ({Math.round(settings.watermarkOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={settings.watermarkOpacity}
                  onChange={(e) => setSettings({ ...settings, watermarkOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? "Guardando cambios..." : "Guardar Configuración"}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
