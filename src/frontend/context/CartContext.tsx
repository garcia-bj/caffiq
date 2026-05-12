import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import type { ProductoPublico } from "@/frontend/services/productos.service";

const STORAGE_KEY = "caffiq_cart_v1";

export interface CartItem {
  producto: ProductoPublico;
  cantidad: number;
  cafeteria_id: string;
  cafeteria_nombre: string;
}

interface CartContextValue {
  items: CartItem[];
  cafeteria_id: string | null;
  cafeteria_nombre: string | null;
  total: number;
  cantidad_total: number;
  agregar: (producto: ProductoPublico, cafeteria_id: string, cafeteria_nombre: string) => boolean;
  eliminar: (producto_id: string) => void;
  actualizar: (producto_id: string, cantidad: number) => void;
  vaciar: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function persistir(items: CartItem[], cafeteria_id: string | null, cafeteria_nombre: string | null) {
  SecureStore.setItemAsync(
    STORAGE_KEY,
    JSON.stringify({ items, cafeteria_id, cafeteria_nombre }),
  ).catch(() => {});
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]                   = useState<CartItem[]>([]);
  const [cafeteria_id, setCafeteriaId]       = useState<string | null>(null);
  const [cafeteria_nombre, setCafeteriaNom]  = useState<string | null>(null);

  // Cargar carrito guardado al iniciar
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        setItems(saved.items ?? []);
        setCafeteriaId(saved.cafeteria_id ?? null);
        setCafeteriaNom(saved.cafeteria_nombre ?? null);
      } catch {}
    });
  }, []);

  // Agrega producto. Devuelve false si hay conflicto de cafetería (el caller debe alertar y llamar vaciar + agregar).
  const agregar = (
    producto: ProductoPublico,
    cid: string,
    cnom: string,
  ): boolean => {
    if (cafeteria_id && cafeteria_id !== cid) return false;

    const existing = items.find((i) => i.producto.id === producto.id);
    const next = existing
      ? items.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        )
      : [...items, { producto, cantidad: 1, cafeteria_id: cid, cafeteria_nombre: cnom }];

    setItems(next);
    setCafeteriaId(cid);
    setCafeteriaNom(cnom);
    persistir(next, cid, cnom);
    return true;
  };

  const eliminar = (producto_id: string) => {
    const next = items.filter((i) => i.producto.id !== producto_id);
    const cid  = next.length ? cafeteria_id : null;
    const cnom = next.length ? cafeteria_nombre : null;
    setItems(next);
    setCafeteriaId(cid);
    setCafeteriaNom(cnom);
    persistir(next, cid, cnom);
  };

  const actualizar = (producto_id: string, cantidad: number) => {
    if (cantidad <= 0) { eliminar(producto_id); return; }
    const next = items.map((i) =>
      i.producto.id === producto_id ? { ...i, cantidad } : i,
    );
    setItems(next);
    persistir(next, cafeteria_id, cafeteria_nombre);
  };

  const vaciar = () => {
    setItems([]);
    setCafeteriaId(null);
    setCafeteriaNom(null);
    SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
  };

  const total          = items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const cantidad_total = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items, cafeteria_id, cafeteria_nombre, total, cantidad_total,
        agregar, eliminar, actualizar, vaciar,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
};
