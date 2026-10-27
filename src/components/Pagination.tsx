'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

export const Pagination = ({ currentPage, totalPages, itemsPerPage, totalItems }: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) params.delete('pagina');
    else params.set('pagina', page.toString());
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const goToPage = (page: number) => {
    router.push(buildPageUrl(page));
  };

  // No mostrar paginación si hay menos de una página
  if (totalPages <= 1) return null;

  // Generar rango de páginas a mostrar
  const getPageRange = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | '...')[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageRange = getPageRange();

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-5"
      aria-label="Paginación"
    >
      <p className="t-label hidden text-ink/45 sm:block">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <a
          href={currentPage > 1 ? buildPageUrl(Math.max(1, currentPage - 1)) : undefined}
          onClick={(e) => {
            e.preventDefault()
            if (currentPage > 1) goToPage(Math.max(1, currentPage - 1))
          }}
          aria-disabled={currentPage <= 1}
          className={`flex h-9 items-center gap-1 border px-3 text-[12px] font-medium transition-colors ${
            currentPage <= 1
              ? 'pointer-events-none border-line text-ink/25'
              : 'border-line text-ink hover:border-ink'
          }`}
          aria-label="Página anterior"
          rel="prev"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Anterior</span>
        </a>

        {pageRange.map((item, index) => {
          if (item === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-[12px] text-ink/35">
                …
              </span>
            )
          }
          return (
            <a
              key={item}
              href={buildPageUrl(item as number)}
              onClick={(e) => {
                e.preventDefault()
                goToPage(item as number)
              }}
              className={`t-num flex h-9 min-w-9 items-center justify-center border px-2 text-[12px] transition-colors ${
                currentPage === item
                  ? 'border-ink bg-ink font-semibold text-paper'
                  : 'border-line text-ink hover:border-ink'
              }`}
              aria-current={currentPage === item ? 'page' : undefined}
              rel={currentPage === item ? undefined : (item as number) < currentPage ? 'prev' : 'next'}
            >
              {item}
            </a>
          )
        })}

        <a
          href={currentPage < totalPages ? buildPageUrl(Math.min(totalPages, currentPage + 1)) : undefined}
          onClick={(e) => {
            e.preventDefault()
            if (currentPage < totalPages) goToPage(Math.min(totalPages, currentPage + 1))
          }}
          aria-disabled={currentPage >= totalPages}
          className={`flex h-9 items-center gap-1 border px-3 text-[12px] font-medium transition-colors ${
            currentPage >= totalPages
              ? 'pointer-events-none border-line text-ink/25'
              : 'border-line text-ink hover:border-ink'
          }`}
          aria-label="Página siguiente"
          rel="next"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={14} />
        </a>
      </div>
    </nav>
  )
};