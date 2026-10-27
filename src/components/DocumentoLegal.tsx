import type { ReactNode } from 'react'
import type { DocumentoLegal as Doc } from '@/lib/textos-legales'

/**
 * Plantilla común de las páginas legales (aviso legal, privacidad, cookies y
 * términos). Las cuatro comparten estructura —título, fecha, entradilla y
 * secciones— así que el formato vive en un solo sitio: si mañana cambia la
 * tipografía o el ancho de lectura, cambia en las cuatro a la vez.
 *
 * `children` permite insertar bloques propios de una página (los datos del
 * titular en el aviso legal, el botón de preferencias en cookies).
 *
 * Dirección de arte: documento, no landing. Columna de lectura estrecha,
 * numeración de secciones en monoespaciada, filetes de 1 px y cero cajas
 * decorativas —lo que separa secciones aquí es el aire y la regla, no el
 * borde redondeado.
 */
export default function DocumentoLegal({
  documento,
  children,
  bloqueInicial }: {
  documento: Doc
  children?: ReactNode
  /** Se pinta justo debajo de la entradilla (sección 1 del aviso legal). */
  bloqueInicial?: ReactNode
}) {
  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="t-eyebrow text-ink/40">Documentación legal</p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 className="t-display t-display-lg text-ink">{documento.titulo}</h1>
              <p className="t-label mt-4 text-ink/40">{documento.actualizado}</p>
            </div>
            <p className="text-[14px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {documento.entradilla}
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Índice de secciones: navegación real en documentos largos */}
          <nav aria-label="Índice del documento" className="lg:col-span-3">
            <p className="t-label border-b border-line pb-2 text-ink/40">Índice</p>
            <ul className="mt-3 space-y-1.5">
              {documento.secciones.map((seccion) => (
                <li key={seccion.titulo} className="text-[13px] leading-snug text-ink/60">
                  {seccion.titulo}
                </li>
              ))}
            </ul>
          </nav>

          <article className="lg:col-span-9 lg:border-l lg:border-line lg:pl-10">
            {bloqueInicial}

            <div className="mt-10">
              {documento.secciones.map((seccion) => (
                <section key={seccion.titulo} className="border-t border-line py-7 first:border-t-0 first:pt-0">
                  <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink">
                    {seccion.titulo}
                  </h2>
                  <div className="mt-3">
                    {seccion.parrafos?.map((parrafo) => (
                      <p key={parrafo.slice(0, 40)} className="mb-3 text-[13.5px] leading-[1.75] text-ink/70">
                        {parrafo}
                      </p>
                    ))}
                    {seccion.lista && (
                      <ul className="mt-2 space-y-1.5">
                        {seccion.lista.map((item) => (
                          <li key={item.slice(0, 40)} className="flex gap-2.5 text-[13.5px] leading-[1.7] text-ink/70">
                            <span aria-hidden="true" className="mt-[0.62em] h-1 w-1 shrink-0 bg-ink/30" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {children}
          </article>
        </div>
      </div>
    </div>
  )
}
