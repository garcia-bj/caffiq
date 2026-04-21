export type EstadoProducto = "disponible" | "no_disponible";

export interface Sucursal {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  sucursalId: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  estado: EstadoProducto;
  imagen: string;
}

export const SUCURSALES: Sucursal[] = [
  { id: 1, nombre: "Cafe Martinez" },
  { id: 2, nombre: "The Coffee Club" },
  { id: 3, nombre: "Juan Valdez Cafe" },
];

export const PRODUCTOS: Producto[] = [

  // ── Cafe Martinez (sucursalId: 1) ──────────────────────────
  {
    id: 1, sucursalId: 1,
    nombre: "Cappuccino with Oat Milk",
    descripcion: "Espresso con leche de avena vaporizada y espuma cremosa. Suave, equilibrado y con aroma delicioso.",
    precio: 3.90, stock: 50,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
  },
  {
    id: 2, sucursalId: 1,
    nombre: "Latte Vainilla",
    descripcion: "Café latte con sirope de vainilla natural, leche entera vaporizada y una ligera capa de espuma.",
    precio: 4.20, stock: 40,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1561882468-9110d70d2a78?w=400",
  },
  {
    id: 3, sucursalId: 1,
    nombre: "Espresso Doble",
    descripcion: "Dos shots de espresso puro, concentrado e intenso. Ideal para los amantes del café fuerte.",
    precio: 2.50, stock: 60,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400",
  },
  {
    id: 4, sucursalId: 1,
    nombre: "Brownie de Chocolate",
    descripcion: "Brownie casero húmedo con chispas de chocolate negro. Servido tibio con azúcar en polvo.",
    precio: 2.80, stock: 25,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
  },
  {
    id: 5, sucursalId: 1,
    nombre: "Té Matcha Latte",
    descripcion: "Té matcha japonés premium mezclado con leche de almendras vaporizada. Cremoso y antioxidante.",
    precio: 4.50, stock: 20,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400",
  },
  {
    id: 6, sucursalId: 1,
    nombre: "Croissant de Mantequilla",
    descripcion: "Croissant artesanal horneado diariamente, crujiente por fuera y suave por dentro.",
    precio: 2.20, stock: 30,
    estado: "no_disponible",
    imagen: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400",
  },

  // ── The Coffee Club (sucursalId: 2) ────────────────────────
  {
    id: 7, sucursalId: 2,
    nombre: "Cold Brew",
    descripcion: "Café preparado en frío durante 12 horas. Suave, bajo en acidez y con notas afrutadas naturales.",
    precio: 4.00, stock: 35,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
  },
  {
    id: 8, sucursalId: 2,
    nombre: "Frappé de Caramelo",
    descripcion: "Bebida fría de café con sirope de caramelo, leche y crema batida. Dulce e irresistible.",
    precio: 5.00, stock: 28,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1572490122747-3a3f5b8c4fe2?w=400",
  },
  {
    id: 9, sucursalId: 2,
    nombre: "Americano",
    descripcion: "Espresso diluido con agua caliente. Sabor intenso y limpio, perfecto para cualquier momento del día.",
    precio: 2.80, stock: 55,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400",
  },
  {
    id: 10, sucursalId: 2,
    nombre: "Tostada Francesa",
    descripcion: "Pan brioche empapado en huevo y canela, dorado en plancha. Servido con miel y frutas frescas.",
    precio: 5.50, stock: 18,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400",
  },
  {
    id: 11, sucursalId: 2,
    nombre: "Cappuccino Clásico",
    descripcion: "Cappuccino tradicional italiano con espuma densa y un toque de cacao en polvo por encima.",
    precio: 3.50, stock: 20,
    estado: "no_disponible",
    imagen: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400",
  },
  {
    id: 12, sucursalId: 2,
    nombre: "Cheesecake de Frutos Rojos",
    descripcion: "Cheesecake cremoso con base de galleta y cobertura de frutos rojos frescos. Porción generosa.",
    precio: 4.80, stock: 12,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400",
  },

  // ── Juan Valdez Cafe (sucursalId: 3) ───────────────────────
  {
    id: 13, sucursalId: 3,
    nombre: "Café Colombiano Premium",
    descripcion: "Café de origen colombiano, cultivado en las montañas de Huila. Notas a chocolate y frutos cítricos.",
    precio: 3.70, stock: 45,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
  },
  {
    id: 14, sucursalId: 3,
    nombre: "Mocha Caliente",
    descripcion: "Espresso con chocolate negro derretido y leche vaporizada. Rico, cremoso y reconfortante.",
    precio: 4.30, stock: 32,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
  },
  {
    id: 15, sucursalId: 3,
    nombre: "Granola con Yogur",
    descripcion: "Yogur griego natural con granola artesanal, miel de abeja y frutas de temporada.",
    precio: 4.00, stock: 22,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=400",
  },
  {
    id: 16, sucursalId: 3,
    nombre: "Flat White",
    descripcion: "Doble ristretto con leche texturizada en microespuma. Más intenso que un latte, más suave que un espresso.",
    precio: 3.90, stock: 38,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400",
  },
  {
    id: 17, sucursalId: 3,
    nombre: "Muffin de Arándanos",
    descripcion: "Muffin esponjoso cargado de arándanos frescos. Horneado cada mañana en nuestra cocina.",
    precio: 2.60, stock: 20,
    estado: "disponible",
    imagen: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400",
  },
  {
    id: 18, sucursalId: 3,
    nombre: "Chocolate Caliente",
    descripcion: "Leche entera con chocolate artesanal derretido. Espeso, dulce y perfecto para días fríos.",
    precio: 3.20, stock: 0,
    estado: "no_disponible",
    imagen: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400",
  },
];

// Filtrar productos por sucursal
export function getProductosPorSucursal(sucursalId: number): Producto[] {
  return PRODUCTOS.filter((p) => p.sucursalId === sucursalId);
}

// Buscar producto por id
export function getProductoPorId(id: number): Producto | undefined {
  return PRODUCTOS.find((p) => p.id === id);
}

// Filtrar solo productos disponibles
export function getProductosDisponibles(sucursalId: number): Producto[] {
  return PRODUCTOS.filter((p) => p.sucursalId === sucursalId && p.estado === "disponible");
}