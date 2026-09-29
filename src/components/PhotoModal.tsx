"use client";

import { X, ShoppingCart, Check, ShieldAlert, Sparkles } from "lucide-react";
import { PhotoData } from "./PhotoCard";
import { useCartStore } from "@/lib/cart";

interface PhotoModalProps {
  photo: PhotoData | null;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const isItemInCart = useCartStore((s) => (photo ? s.hasItem(photo.id) : false));

  if (!photo) return null;

  const previewUrl = `/api/photos/${photo.driveFileId}/preview`;

  const handleCartToggle = () => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Protected Image View */}
        <div className="relative md:w-3/5 bg-neutral-950 flex items-center justify-center min-h-[320px] md:min-h-[500px] overflow-hidden select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={photo.name}
            className="max-h-[75vh] w-auto object-contain pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Vista previa con marca de agua. La descarga original no tendrá marcas.</span>
          </div>
        </div>

        {/* Sidebar Info & Purchase */}
        <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-neutral-900">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-rose-600 dark:text-rose-400">
              {photo.album.title}
            </span>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1 break-words">
              {photo.name}
            </h2>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 p-3 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Archivo original en máxima resolución sin marcas de agua tras el pago</span>
              </div>
              <div className="text-xs text-neutral-500 space-y-1">
                {photo.width && photo.height && (
                  <p>Resolución original: {photo.width} × {photo.height} px</p>
                )}
                <p>Formato de entrega: {photo.mimeType.replace("image/", "").toUpperCase()} original</p>
                <p>Entrega: Descarga inmediata + enlace seguro enviado a tu correo</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-sm font-medium text-neutral-500">Precio individual</span>
              <span className="text-2xl font-black text-neutral-900 dark:text-white">
                ${photo.price.toFixed(2)}{" "}
                <span className="text-xs font-bold text-neutral-500">MXN</span>
              </span>
            </div>

            <button
              onClick={handleCartToggle}
              type="button"
              className={`w-full py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                isItemInCart
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  : "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-rose-600/25"
              }`}
            >
              {isItemInCart ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Foto agregada al carrito</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Agregar al carrito</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
