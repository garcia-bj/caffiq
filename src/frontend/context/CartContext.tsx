import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import type { ProductoPublico } from "@/frontend/services/productos.service";

const STORAGE_KEY = "caffiq_cart_v5";

export type AgregarResultado = "ok" | "cafeteria_conflict" | "stock_exceeded";
export type TipoPedidoItem   = "llevar" | "local";

export interface OpcionSeleccionada {
  personalizacion_id: string;
  personalizacion_nombre: string;
  opcion_id: string;
  opcion_nombre: string;
  precio_adicional: number;
}

export interface CartItem {
  id: string;
  producto: ProductoPublico;
  cantidad: number;
  cafeteria_id: string;
  cafeteria_nombre: string;
  personalizaciones: OpcionSeleccionada[];
  tipo_pedido: TipoPedidoItem;
}

// Formato compacto para SecureStore (evita el límite de 2048 bytes)
// pers se guarda como arrays [pers_nombre, opcion_nombre, precio_adicional]
type CompactPers = [string, string, number];

interface CompactItem {
  id:   string;
  pid:  string;
  nom:  string;
  pr:   number;
  img:  string | null;
  st:   number | null;
  dis:  boolean;
  q:    number;
  tp:   boolean;         // true = local, false = llevar
  pers: CompactPers[];
}
interface CompactCart {
  items: CompactItem[];
  cid:  string | null;
  cnom: string | null;
  sid:  string | null;
  snom: string | null;
}

function toCompact(
  items: CartItem[],
  cid: string | null, cnom: string | null,
  sid: string | null, snom: string | null,
): CompactCart {
  return {
    cid, cnom, sid, snom,
    items: items.map((i) => ({
      id:   i.id,
      pid:  i.producto.id,
      nom:  i.producto.nombre,
      pr:   i.producto.precio,
      img:  i.producto.imagen_url,
      st:   i.producto.stock ?? null,
      dis:  i.producto.disponible,
      q:    i.cantidad,
      tp:   i.tipo_pedido === "local",
      pers: i.personalizaciones.map((p) => [p.personalizacion_nombre, p.opcion_nombre, p.precio_adicional]),
    })),
  };
}

function fromCompact(c: CompactCart, cid: string): CartItem[] {
  return c.items.map((i) => ({
    id:       i.id,
    cantidad: i.q,
    cafeteria_id:     cid,
    cafeteria_nombre: c.cnom ?? "",
    tipo_pedido:      i.tp ? "local" : "llevar",
    personalizaciones: i.pers.map(([pnom, onom, pa]) => ({
      personalizacion_id:     "",
      personalizacion_nombre: pnom,
      opcion_id:              "",
      opcion_nombre:          onom,
      precio_adicional:       pa,
    })),
    producto: {
      id:          i.pid,
      nombre:      i.nom,
      precio:      i.pr,
      imagen_url:  i.img,
      stock:       i.st,
      disponible:  i.dis,
      descripcion: null,
      categoria:   "General",
      badge:       null,
      cafeteria_id: cid,
      created_at:  "",
    } as ProductoPublico,
  }));
}

function persistir(
  items: CartItem[],
  cid: string | null, cnom: string | null,
  sid: string | null, snom: string | null,
) {
  const compact = toCompact(items, cid, cnom, sid, snom);
  SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(compact)).catch(() => {});
}

interface CartContextValue {
  items: CartItem[];
  cafeteria_id: string | null;
  cafeteria_nombre: string | null;
  sucursal_id: string | null;
  sucursal_nombre: string | null;
  total: number;
  cantidad_total: number;
  agregar: (
    producto: ProductoPublico,
    cafeteria_id: string, cafeteria_nombre: string,
    sucursal_id: string, sucursal_nombre: string,
    personalizaciones?: OpcionSeleccionada[],
  ) => AgregarResultado;
  eliminar: (item_id: string) => void;
  actualizar: (item_id: string, cantidad: number) => void;
  actualizarTipo: (item_id: string, tipo: TipoPedidoItem) => void;
  vaciar: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]                  = useState<CartItem[]>([]);
  const [cafeteria_id, setCafeteriaId]      = useState<string | null>(null);
  const [cafeteria_nombre, setCafeteriaNom] = useState<string | null>(null);
  const [sucursal_id, setSucursalId]        = useState<string | null>(null);
  const [sucursal_nombre, setSucursalNom]   = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const c: CompactCart = JSON.parse(raw);
        if (c.cid) {
          setItems(fromCompact(c, c.cid));
          setCafeteriaId(c.cid);
          setCafeteriaNom(c.cnom ?? null);
          setSucursalId(c.sid ?? null);
          setSucursalNom(c.snom ?? null);
        }
      } catch {}
    });
  }, []);

  const agregar = (
    producto: ProductoPublico,
    cid: string, cnom: string,
    sid: string, snom: string,
    personalizaciones: OpcionSeleccionada[] = [],
  ): AgregarResultado => {
    if (cafeteria_id && cafeteria_id !== cid) return "cafeteria_conflict";

    const totalEnCarrito = items
      .filter((i) => i.producto.id === producto.id)
      .reduce((s, i) => s + i.cantidad, 0);

    if (producto.stock !== null && producto.stock !== undefined) {
      if (totalEnCarrito >= producto.stock) return "stock_exceeded";
    }

    const itemId = `${producto.id}__${personalizaciones.map((p) => p.opcion_id).sort().join(",")}`;
    const existing = items.find((i) => i.id === itemId);

    const next = existing
      ? items.map((i) => i.id === itemId ? { ...i, cantidad: i.cantidad + 1 } : i)
      : [...items, {
          id: itemId, producto, cantidad: 1,
          cafeteria_id: cid, cafeteria_nombre: cnom,
          personalizaciones,
          tipo_pedido: "llevar" as TipoPedidoItem,
        }];

    setItems(next);
    setCafeteriaId(cid); setCafeteriaNom(cnom);
    setSucursalId(sid);  setSucursalNom(snom);
    persistir(next, cid, cnom, sid, snom);
    return "ok";
  };

  const eliminar = (item_id: string) => {
    const next = items.filter((i) => i.id !== item_id);
    const cid  = next.length ? cafeteria_id : null;
    const cnom = next.length ? cafeteria_nombre : null;
    const sid  = next.length ? sucursal_id : null;
    const snom = next.length ? sucursal_nombre : null;
    setItems(next);
    setCafeteriaId(cid); setCafeteriaNom(cnom);
    setSucursalId(sid);  setSucursalNom(snom);
    persistir(next, cid, cnom, sid, snom);
  };

  const actualizar = (item_id: string, cantidad: number) => {
    if (cantidad <= 0) { eliminar(item_id); return; }

    const item = items.find((i) => i.id === item_id);
    if (!item) return;

    const stock = item.producto.stock;
    const otrosTotal = items
      .filter((i) => i.id !== item_id && i.producto.id === item.producto.id)
      .reduce((s, i) => s + i.cantidad, 0);
    const cantidadFinal = (stock !== null && stock !== undefined)
      ? Math.min(cantidad, Math.max(0, stock - otrosTotal))
      : cantidad;

    if (cantidadFinal === item.cantidad) return;

    const next = items.map((i) => i.id === item_id ? { ...i, cantidad: cantidadFinal } : i);
    setItems(next);
    persistir(next, cafeteria_id, cafeteria_nombre, sucursal_id, sucursal_nombre);
  };

  const actualizarTipo = (item_id: string, tipo: TipoPedidoItem) => {
    const next = items.map((i) => i.id === item_id ? { ...i, tipo_pedido: tipo } : i);
    setItems(next);
    persistir(next, cafeteria_id, cafeteria_nombre, sucursal_id, sucursal_nombre);
  };

  const vaciar = () => {
    setItems([]);
    setCafeteriaId(null); setCafeteriaNom(null);
    setSucursalId(null);  setSucursalNom(null);
    SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
  };

  const precioItem = (item: CartItem) =>
    (item.producto.precio + item.personalizaciones.reduce((s, p) => s + p.precio_adicional, 0)) * item.cantidad;

  const total          = items.reduce((s, i) => s + precioItem(i), 0);
  const cantidad_total = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider value={{
      items, cafeteria_id, cafeteria_nombre, sucursal_id, sucursal_nombre,
      total, cantidad_total, agregar, eliminar, actualizar, actualizarTipo, vaciar,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
};
