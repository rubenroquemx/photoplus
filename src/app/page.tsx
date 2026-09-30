"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhotoCard, { PhotoData } from "@/components/PhotoCard";
import PhotoModal from "@/components/PhotoModal";
import CartDrawer from "@/components/CartDrawer";
import { Sparkles, Search, Layers, ShieldCheck, FolderSync } from "lucide-react";

interface AlbumItem {
  id: string;
  title: string;
  description?: string | null;
  photosCount: number;
  defaultPrice: number;
}

interface StoreSettingsData {
  storeName: string;
  storeTagline: string;
  defaultPrice: number;
  currency: string;
}

export default function HomePage() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePhoto, setActivePhoto] = useState<PhotoData | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCatalog = async (albumId = "all") => {
    try {
      setLoading(true);
      const url = albumId === "all" ? "/api/catalog" : `/api/catalog?albumId=${albumId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.photos) setPhotos(data.photos);
      if (data.albums) setAlbums(data.albums);
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error("Error fetching catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog(selectedAlbum);
  }, [selectedAlbum]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.album.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [photos, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        storeName={settings?.storeName || "PhotoPlus Studio"}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 sm:p-12 mb-10 shadow-2xl border border-neutral-800">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-950/70 via-neutral-900/90 to-neutral-950 pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fotos digitales sincronizadas en tiempo real con Google Drive</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {settings?.storeName || "PhotoPlus Studio"}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-neutral-300 font-normal">
              {settings?.storeTagline || "Explora las galerías y adquiere tus fotos favoritas en alta resolución original."}
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Previsualización protegida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Original sin marca al comprar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Descarga instantánea Mercado Pago</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Album Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedAlbum("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedAlbum === "all"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
                }`}
              >
                Todas las fotos ({albums.reduce((acc, a) => acc + a.photosCount, 0)})
              </button>
              {albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => setSelectedAlbum(album.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedAlbum === album.id
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{album.title}</span>
                  <span className="opacity-60 text-[10px]">({album.photosCount})</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px] max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o álbum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-4/3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onPreviewClick={(p) => setActivePhoto(p)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <FolderSync className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {albums.length === 0
                  ? "Próximamente: galerías en camino"
                  : "No se encontraron fotos con ese filtro o búsqueda"}
              </h2>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mt-2">
                {albums.length === 0
                  ? "Estamos preparando las galerías de fotos. Vuelve pronto para explorar y adquirir tus imágenes favoritas en alta resolución."
                  : "Intenta cambiar el término de búsqueda o selecciona otro álbum."}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Lightbox Modal */}
      <PhotoModal
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <Footer storeName={settings?.storeName} />
    </div>
  );
}
