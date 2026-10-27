'use client'

import ProductCard, { type ProductCardData } from './ProductCard';

/**
 * Envoltorio del catálogo sobre la ficha compartida de anuncio.
 *
 * Existe porque el catálogo trabaja con el tipo `Producto` (más ancho) y un
 * flag `_isFeatured` precomputado en servidor para evitar desajustes de
 * hidratación; aquí se normaliza y se delega en `<ProductCard>` para que la
 * ficha del listado y la de la portada sean exactamente la misma pieza.
 */
interface Producto {
  id: string;
  slug?: string | null;
  titulo: string;
  precio_usd: number | null;
  estado: string;
  imagen_url: string | null;
  ubicacion_ciudad: string | null;
  ubicacion_estado: string | null;
  creado_en: string;
  subcategoria: string | null;
  boosteado_en: string | null;
  es_demo?: boolean | null;
  destacado: boolean | null;
  destacado_hasta: string | null;
  vendedor_verificado: boolean | null;
  vendedor_tipo?: string | null;
  reservado?: boolean | null;
  _isFeatured?: boolean;
}

interface ProductCardLazyProps {
  p: Producto;
  t: (key: string) => string;
  priority?: boolean;
}

export const ProductCardLazy = ({ p, priority = false }: ProductCardLazyProps) => {
  const isFeatured =
    p._isFeatured !== undefined
      ? p._isFeatured
      : !!(p.destacado && p.destacado_hasta && new Date(p.destacado_hasta) > new Date());

  const data: ProductCardData = {
    id: p.id,
    slug: p.slug ?? null,
    titulo: p.titulo,
    precio_usd: p.precio_usd ?? null,
    imagen_url: p.imagen_url,
    ubicacion_ciudad: p.ubicacion_ciudad,
    ubicacion_estado: p.ubicacion_estado,
    estado: p.estado,
    boosteado_en: p.boosteado_en,
    destacado: p.destacado,
    destacado_hasta: p.destacado_hasta,
    vendedor_verificado: p.vendedor_verificado,
    vendedor_tipo: p.vendedor_tipo ?? null,
    reservado: p.reservado ?? null,
    es_demo: p.es_demo ?? null };

  return <ProductCard p={data} priority={priority} isFeatured={isFeatured} />;
};
