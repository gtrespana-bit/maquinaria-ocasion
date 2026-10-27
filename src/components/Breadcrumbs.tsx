'use client'

import { serializeJsonLd } from '@/lib/serialize-json-ld'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

/**
 * Migas de pan — solo datos estructurados.
 *
 * La miga **visible** vive en la cabecera de cada plantilla (una fila de
 * micro-etiquetas sobre el título, dentro del mismo `shell`), porque repetirla
 * aquí producía dos navegaciones idénticas seguidas. Este componente se queda
 * con la parte que Google sí lee: el `BreadcrumbList` en JSON-LD.
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://maquinaria.click${item.href}` : undefined })) }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
    />
  )
}
