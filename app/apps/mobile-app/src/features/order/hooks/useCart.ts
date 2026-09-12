import { useCallback, useMemo, useState } from "react";

export interface CartItem {
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  addItem: (name: string, unitPrice: number) => void;
  removeItem: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = (): Cart => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((name: string, unitPrice: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.name === name);

      if (existing) {
        return prev.map((item) => (item.name === name ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...prev, { name, unitPrice, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((name: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.name === name);

      if (!existing) {
        return prev;
      }

      if (existing.quantity <= 1) {
        return prev.filter((item) => item.name !== name);
      }

      return prev.map((item) => (item.name === name ? { ...item, quantity: item.quantity - 1 } : item));
    });
  }, []);

  const updateQuantity = useCallback((name: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.name !== name);
      }

      return prev.map((item) => (item.name === name ? { ...item, quantity } : item));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return { items, totalAmount, totalItems, addItem, removeItem, updateQuantity, clearCart };
};
