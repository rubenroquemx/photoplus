"use client";

import { useState } from "react";
import { ShoppingCart, Check, Maximize2, ShieldAlert, Heart } from "lucide-react";
import { useCartStore } from "@/lib/cart";

export interface PhotoData {
  id: string;
  driveFileId: string;
  name: string;
  price: number;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  album: {
    id: string;
    title: string;
  };
}

interface PhotoCardProps {
  photo: PhotoData;
  onPreviewClick: (photo: PhotoData) => void;
  initialIsFavorite?: boolean;
}

export default function PhotoCard({ photo, onPreviewClick, initialIsFavorite = false }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [togglingFav, setTogglingFav] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const isItemInCart = useCartStore((s) => s.hasItem(photo.id));

  const previewUrl = `/api/photos/${photo.driveFileId}/preview`;

  const handleCartToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isItemInCart) {
      removeItem(photo.id);
    } else {
      addItem({
        id: photo.id,
        driveFileId: photo.driveFileId,
        name: photo.name,
        price: photo.price,
        albumId: photo.album.id,
        albumTitle: photo.album.title,
        previewUrl,
      });
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (togglingFav) return;
    setTogglingFav(true);

    try {
      const res = await fetch("/api/customer/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });

      const data = await res.json();

      if (res.status === 401) {
        if (confirm("Inicia sesión con tu cuenta de Google para guardar tus fotos favoritas. ¿Deseas iniciar sesión ahora?")) {
          window.location.href = "/api/auth/customer/google";
        }
        return;
      }

      if (typeof data.isFavorite === "boolean") {
        setIsFavorite(data.isFavorite);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingFav(false);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image Preview Container */}
      <div
        className="relative aspect-4/3 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden cursor-pointer"
        onClick={() => onPreviewClick(photo)}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 animate-pulse">
            <span className="text-xs text-neutral-400">Cargando muestra...</span>
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={photo.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none pointer-events-none ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Watermark Protection Tag */}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          <span>Muestra</span>
        </div>

        {/* Action icons top right: Favorite & Zoom */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {/* Favorite button */}
          <button
            onClick={handleFavoriteToggle}
            type="button"
            disabled={togglingFav}
            aria-label="Marcar como favorita"
            className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
              isFavorite
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-black/60 text-white hover:bg-black/80"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
          </button>

          {/* Zoom button */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white p-1.5 rounded-lg hover:bg-black/80">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Card Info and Actions */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">
            {photo.album.title}
          </span>
          <h3
            className="text-sm font-semibold text-neutral-900 dark:text-white truncate mt-0.5"
            title={photo.name}
          >
            {photo.name}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <span className="text-xs text-neutral-400 block font-normal">Precio por foto</span>
            <span className="text-base font-extrabold text-neutral-900 dark:text-white">
              ${photo.price.toFixed(2)} <span className="text-xs font-semibold text-neutral-500">MXN</span>
            </span>
          </div>

          <button
            onClick={handleCartToggle}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isItemInCart
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md active:scale-95"
            }`}
          >
            {isItemInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>En carrito</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
