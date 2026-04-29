import { create } from 'zustand';
import { z } from 'zod';
import { linkableItemApiSchema } from '../schemas/bank-movement-api.schema';

type LinkableItem = z.infer<typeof linkableItemApiSchema>;

interface LinkableStore {
  selectedItems: LinkableItem[];
  addItem: (item: LinkableItem) => void;
  addItems: (items: LinkableItem[]) => void;
  removeItem: (itemId: number, itemType: string) => void;
  setItems: (items: LinkableItem[]) => void;
  clearItems: () => void;
  totalAmount: number;
}

const calculateTotalAmount = (items: LinkableItem[]) =>
  items.reduce((acc, item) => acc + Number(item.amount), 0);

export const useLinkableStore = create<LinkableStore>((set) => ({
  selectedItems: [],
  totalAmount: 0,
  addItem: (item) => {
    set((state) => {
      if (
        state.selectedItems.find(
          (i) => i.id === item.id && i.type === item.type,
        )
      ) {
        return state; // Item already exists, do nothing
      }
      const newItems = [...state.selectedItems, item];
      return {
        selectedItems: newItems,
        totalAmount: calculateTotalAmount(newItems),
      };
    });
  },
  addItems: (items) => {
    set((state) => {
      const newItems = items.filter(
        (item) =>
          !state.selectedItems.find(
            (i) => i.id === item.id && i.type === item.type,
          ),
      );
      if (newItems.length === 0) return state;
      const updatedItems = [...state.selectedItems, ...newItems];
      return {
        selectedItems: updatedItems,
        totalAmount: calculateTotalAmount(updatedItems),
      };
    });
  },
  removeItem: (itemId, itemType) => {
    set((state) => {
      const newItems = state.selectedItems.filter(
        (item) => !(item.id === itemId && item.type === itemType),
      );
      return {
        selectedItems: newItems,
        totalAmount: calculateTotalAmount(newItems),
      };
    });
  },
  setItems: (items) => {
    set({
      selectedItems: items,
      totalAmount: calculateTotalAmount(items),
    });
  },
  clearItems: () => {
    set({ selectedItems: [], totalAmount: 0 });
  },
}));
