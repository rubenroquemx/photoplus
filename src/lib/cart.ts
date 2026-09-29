import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartPhotoItem {
  id: string;
  driveFileId: string;
  name: string;
  price: number;
  albumId: string;
  albumTitle: string;
  previewUrl: string;
}

interface CartStore {
  items: CartPhotoItem[];
  addItem: (item: CartPhotoItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
  totalAmount: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) {
            return state;
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      clearCart: () => set({ items: [] }),
      hasItem: (id) => get().items.some((item) => item.id === id),
      totalAmount: () => get().items.reduce((sum, item) => sum + item.price, 0),
      totalCount: () => get().items.length,
    }),
    {
      name: "photoplus-cart-storage",
    }
  )
);
