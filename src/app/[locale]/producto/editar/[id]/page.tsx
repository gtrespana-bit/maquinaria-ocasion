'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { TODAS_LAS_SUBS, resolverCampos, FAMILIAS, familiaDeSub, CATEGORIA_DEFAULT } from '@/lib/categorias'
import { agruparPorFabricante, etiquetaModelo } from '@/lib/marcas'
import { ESTADOS, getMunicipiosNombres } from '@/lib/ubicaciones'
import { Camera, X, ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { compressImages } from '@/lib/compress-image'
import LocalLink from '@/components/LocalLink'

const estadosProducto = ['Nuevo', 'Como nuevo', 'Bueno', 'Usado']

export default function EditarPage() {
  const t = useTranslations('editProduct')
  const params = useParams()
  const router = useRouter()
  const { user, session, loading: authLoading } = useAuth()
  const productoId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [marca, setMarca] = useState('')
  const [estadoProd, setEstadoProd] = useState('')
  const [precioUsd, setPrecioUsd] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [puedeVideo, setPuedeVideo] = useState(false)

  // Plan efectivo: el campo de vídeo solo se muestra en planes de pago
  // (mismo criterio que /publicar y que los gates de las APIs).
  useEffect(() => {
    fetch('/api/cupo-anuncios')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.ok) setPuedeVideo(Boolean(d.plan && d.plan !== 'gratis' && !d.trialGracia))
      })
      .catch(() => {})
  }, [])
  const [ubicacionEstado, setUbicacionEstado] = useState('')
  const [ubicacionCiudad, setUbicacionCiudad] = useState('')
  const [activo, setActivo] = useState(true)
  const [specs, setSpecs] = useState<Record<string, string>>({})

  // Contact methods
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactWhatsApp, setContactWhatsApp] = useState('')
  const [contactMessenger, setContactMessenger] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showMessenger, setShowMessenger] = useState(false)

  // Images
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (!productoId) return

    async function load() {
      const { data: prod } = await supabase
        .from('productos')
        .select('id, titulo, descripcion, precio, precio_eur, precio_usd, estado, categoria_id, subcategoria, marca, modelo, ubicacion_estado, ubicacion_ciudad, activo, visitas, creado_en, user_id, imagen_url, imagenes, metodos_contacto, especificaciones, destacado, destacado_hasta, boosteado_en')
        .eq('id', productoId)
        .maybeSingle()

      if (!prod) { setError('No encontrado'); setLoading(false); return }
      if (user && prod.user_id !== user.id) { setError('No tienes permiso'); setLoading(false); return }

      setTitulo(prod.titulo || '')
      setDescripcion(prod.descripcion || '')

      // Normalizar subcategoría si venía como slug o con formato diferente
      // (se busca en TODAS las familias; los valores legados se conservan).
      const subEncontrada = TODAS_LAS_SUBS.find(
        s => s.label === prod.subcategoria || s.slug === prod.subcategoria || s.label.toLowerCase() === (prod.subcategoria || '').toLowerCase()
      )
      const subcategoriaActual = subEncontrada?.label || prod.subcategoria || ''
      setSubcategoria(subcategoriaActual)

      setMarca(prod.marca || '')
      setEstadoProd(prod.estado || '')

      // Precio: leer de precio (canónico), precio_eur o precio_usd
      const precioValor = prod.precio ?? prod.precio_eur ?? prod.precio_usd
      setPrecioUsd(precioValor != null ? String(precioValor) : '')
      setVideoUrl(prod.video_url || '')

      setUbicacionEstado(prod.ubicacion_estado || '')
      setUbicacionCiudad(prod.ubicacion_ciudad || '')
      setActivo(prod.activo ?? true)
      setCurrentImages(prod.imagenes?.length ? prod.imagenes : (prod.imagen_url ? [prod.imagen_url] : []))

      // Load contact methods
      const mc = prod.metodos_contacto || {}
      setContactEmail(mc.email || '')
      setContactPhone(mc.telefono || '')
      setContactWhatsApp(mc.whatsapp || '')
      setContactMessenger(mc.messenger || '')
      setShowEmail(!!mc.email)
      setShowPhone(!!mc.telefono)
      setShowWhatsApp(!!mc.whatsapp)
      setShowMessenger(!!mc.messenger)

      // Cargar especificaciones técnicas de la subcategoría
      const campos = resolverCampos(subEncontrada)
      const existingSpecs: Record<string, string> = {}
      if (prod.especificaciones && typeof prod.especificaciones === 'object') {
        Object.entries(prod.especificaciones).forEach(([k, v]) => {
          if (v != null) existingSpecs[k] = String(v)
        })
      }
      campos.forEach((campo: any) => {
        if (!(campo.label in existingSpecs)) {
          existingSpecs[campo.label] = ''
        }
      })
      setSpecs(existingSpecs)

      setLoading(false)
    }
    load()
  }, [productoId, user, authLoading, router])

  if (!session) return null

  // El tipo decide la familia: se resuelve en TODAS las familias. Los productos
  // legados sin tipo conocido dejan `sub` en undefined (sus campos siguen
  // guardados en `specs` y el tipo se recupera al volver a elegir uno).
  const sub = TODAS_LAS_SUBS.find(s => s.label === subcategoria || s.slug === subcategoria)
  // resolverCampos: Marca hereda las marcas de la subcategoría y Año se genera dinámicamente.
  const camposEspeciales = resolverCampos(sub)

  const handleSubcategoriaChange = (val: string) => {
    setSubcategoria(val)
    const newSub = TODAS_LAS_SUBS.find(s => s.label === val || s.slug === val)
    const newCampos = resolverCampos(newSub)
    setSpecs(prev => {
      const updated = { ...prev }
      newCampos.forEach(c => {
        if (!(c.label in updated)) updated[c.label] = ''
      })
      return updated
    })
  }

  const handleSubmit = async () => {
    setGuardando(true)
    setError('')
    setSuccess('')

    if (!isSupabaseConfigured()) { setError('Supabase no configurado'); setGuardando(false); return }

    if (!titulo.trim()) {
      setError('El título es obligatorio')
      setGuardando(false)
      return
    }
    if (titulo.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres')
      setGuardando(false)
      return
    }
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria')
      setGuardando(false)
      return
    }
    if (!subcategoria) {
      setError('Selecciona el tipo de maquinaria')
      setGuardando(false)
      return
    }
    if (!estadoProd) {
      setError('Selecciona el estado del anuncio')
      setGuardando(false)
      return
    }
    if (precioUsd !== '' && (isNaN(Number(precioUsd)) || Number(precioUsd) < 0)) {
      setError('El precio debe ser un número positivo')
      setGuardando(false)
      return
    }

    try {
      // Subir nuevas fotos a Supabase Storage
      let uploadedUrls: string[] = [...currentImages]
      if (newImages.length > 0) {
        for (const img of newImages) {
          const ext = (img.file.name.split('.').pop() || 'jpg').toLowerCase()
          const key = `${user?.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`.replace(/\s+/g, '_')

          const fd = new FormData()
          fd.append('file', img.file)
          fd.append('key', key)

          const res = await fetch('/api/storage-upload', { method: 'POST', body: fd })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            setError('Error al subir la foto: ' + (data.error || res.status))
            setGuardando(false)
            return
          }
          const { publicUrl } = await res.json()
          uploadedUrls.push(publicUrl)
        }
      }

      // Construir métodos de contacto limpios
      const metodosContacto: Record<string, string> = {}
      if (showEmail && contactEmail.trim()) metodosContacto.email = contactEmail.trim()
      const cleanPhone = contactPhone.trim()
      if (showPhone && cleanPhone && cleanPhone !== '+34' && cleanPhone !== '+') {
        metodosContacto.telefono = cleanPhone
      }
      const cleanWA = contactWhatsApp.trim()
      if (showWhatsApp && cleanWA && cleanWA !== '+34' && cleanWA !== '+') {
        metodosContacto.whatsapp = cleanWA
      }
      const cleanMessenger = contactMessenger.trim()
      if (showMessenger && cleanMessenger && cleanMessenger !== 'https://m.me/' && cleanMessenger !== 'https://m.me') {
        metodosContacto.messenger = cleanMessenger
      }

      // La edición pasa por la API server-side
      const precioNum = precioUsd === '' ? null : Number(precioUsd)
      const res = await fetch('/api/productos/editar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productoId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categoria: sub ? (familiaDeSub(sub.slug)?.key ?? CATEGORIA_DEFAULT) : CATEGORIA_DEFAULT,
          subcategoria,
          marca: marca.replace(/^otra:/, '').trim() || null,
          modelo: (() => {
            const campoModelo = camposEspeciales.find(c => c.label.toLowerCase() === 'modelo')
            return campoModelo ? (specs[campoModelo.label] || '').trim() || null : null
          })(),
          especificaciones: Object.fromEntries(
            Object.entries(specs)
              .map(([k, v]) => [k, (v || '').trim()])
              .filter(([, v]) => v)
          ),
          estado: estadoProd,
          precio: precioNum,
          precio_eur: precioNum,
          precio_usd: precioNum,
          video_url: videoUrl.trim(),
          ubicacion_estado: ubicacionEstado || null,
          ubicacion_ciudad: ubicacionCiudad || null,
          activo,
          imagen_url: uploadedUrls[0] || null,
          imagenes: uploadedUrls,
          metodos_contacto: metodosContacto }) })

      const result = await res.json().catch(() => ({}))
      if (!res.ok || !result.ok) {
        setError(result.error || 'No se pudo guardar el producto (error ' + res.status + ')')
      } else {
        setSuccess('Guardado correctamente')
        setTimeout(() => router.push(`/producto/${result.product?.slug || productoId}`), 1500)
      }
    } catch (err) {
      setError('Error inesperado al guardar')
    }
    setGuardando(false)
  }

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar permanentemente?')) return
    setEliminando(true)
    try {
      const res = await fetch('/api/admin/eliminar-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productoId }) })
      if (!res.ok) {
        const result = await res.json().catch(() => ({}))
        setError(result.error || 'No se pudo eliminar el producto')
        setEliminando(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('No se pudo eliminar el producto')
      setEliminando(false)
    }
  }

  const handleNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const selected: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        selected.push(file)
      }
    }
    if (selected.length === 0) return
    e.target.value = ''

    // Optimizar en el navegador (canvas → WebP) antes de subir a Storage
    setProcesando(true)
    let processed = selected
    try {
      processed = await compressImages(selected)
    } catch {
      // si algo falla, subir los originales
    } finally {
      setProcesando(false)
    }

    setNewImages(prev => [
      ...prev,
      ...processed.map(file => ({ file, preview: URL.createObjectURL(file) })),
    ])
  }

  const removeNewImage = (i: number) => setNewImages(prev => prev.filter((_, idx) => idx !== i))
  const removeCurrentImage = (i: number) => setCurrentImages(prev => prev.filter((_, idx) => idx !== i))

  if (loading) return <div className="shell max-w-3xl py-16"><p className="t-label text-ink/35">Cargando…</p><div className="skeleton mt-5 h-40 w-full" /></div>
  if (error && !titulo) return <div className="shell max-w-3xl py-20"><h2 className="t-display t-display-md text-ink">{error}</h2><button onClick={() => router.push('/dashboard')} className="btn btn-ink mt-6">Volver al panel</button></div>

  return (
    <div className="shell max-w-3xl py-10 md:py-14">
      <button onClick={() => router.back()} className="t-label mb-6 inline-flex items-center gap-2 text-ink/45 transition-colors hover:text-ink">
        <ArrowLeft size={16} /> {t('back')}
      </button>

      <h1 className="text-3xl font-semibold text-ink mb-2">{t('title')}</h1>
      <p className="mb-6 text-[13.5px] text-muted">Modifica los campos que necesites</p>

      {/* Alerts */}
      {error && <div className="mb-4 flex items-center gap-2 border border-clay/40 bg-clay/[0.06] px-3 py-2 text-[12.5px] text-clay"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 border border-moss/30 bg-moss-soft px-3 py-2 text-[12.5px] text-moss">{success}</div>}

      <div className="border border-line bg-[#FBFAF5] p-6 space-y-5">
        {/* Título */}
        <div>
          <label className="t-label mb-1.5 block text-ink/45">{t('title2')}</label>
          <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={100} className="field text-[14px]" />
          <p className="t-label mt-1 text-ink/30">{titulo.length}/100</p>
        </div>

        {/* Descripción */}
        <div>
          <label className="t-label mb-1.5 block text-ink/45">{t('description')}</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4} className="field text-[14px] resize-none" />
        </div>

        {/* Precio + Estado */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="t-label mb-1.5 block text-ink/45">{t('priceEur') || 'Precio (€)'}</label>
            <input type="number" value={precioUsd} onChange={e => setPrecioUsd(e.target.value)} className="field text-[14px]" />
            <p className="mt-1.5 text-[11.5px] text-ink/45">
              <LocalLink href="/tasador" className="font-bold text-brand-darkNav underline decoration-brand-signal decoration-2 underline-offset-2 hover:text-brand-signal-dark">
                {t('estimatePriceCta')}
              </LocalLink>
            </p>
            {puedeVideo && (
              <div className="mt-3">
                <label className="t-label mb-1.5 block text-ink/45">{t('videoLabel')}</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder={t('videoPlaceholder')}
                  maxLength={500}
                  className="field text-[14px]"
                />
                <p className="t-label mt-1 text-ink/30">{t('videoNote')}</p>
              </div>
            )}
          </div>
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Condición</label>
            <select value={estadoProd} onChange={e => setEstadoProd(e.target.value)} className="field text-[14px]">
              <option value="">Selecciona...</option>
              {estadosProducto.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Tipo de maquinaria */}
        <div>
          <label className="t-label mb-1.5 block text-ink/45">Tipo de maquinaria</label>
          <select value={subcategoria} onChange={e => handleSubcategoriaChange(e.target.value)} className="field text-[14px]">
            <option value="">Seleccionar tipo...</option>
            {FAMILIAS.map((f: any) => (
              <optgroup key={f.key} label={`${f.icon} ${f.label}`}>
                {f.subs.map((slug: string) => {
                  const s = TODAS_LAS_SUBS.find((x: any) => x.slug === slug)
                  if (!s) return null
                  return <option key={s.label} value={s.label}>{s.icon} {s.label}</option>
                })}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div>
          <label className="t-label mb-1.5 block text-ink/45">Marca</label>
          {sub && sub.marcas.length > 0 ? (
            <>
              <select
                value={marca.startsWith('otra:') ? 'otra:' : marca}
                onChange={e => setMarca(e.target.value === 'otra:' ? 'otra:' : e.target.value)}
                className="field text-[14px]"
              >
                <option value="">Selecciona marca...</option>
                {agruparPorFabricante(sub.marcas).map(g =>
                  g.modelos.length === 1 && !g.modelos[0].modelo ? (
                    <option key={g.modelos[0].valor} value={g.modelos[0].valor}>{g.modelos[0].valor}</option>
                  ) : (
                    <optgroup key={g.fabricante} label={g.fabricante}>
                      {g.modelos.map(m => <option key={m.valor} value={m.valor}>{etiquetaModelo(m)}</option>)}
                    </optgroup>
                  )
                )}
                <option value="otra:">Otra marca...</option>
              </select>
              {marca.startsWith('otra:') && (
                <input
                  type="text"
                  value={marca.replace('otra:', '')}
                  onChange={e => setMarca('otra:' + e.target.value)}
                  placeholder="Escribe la marca..."
                  className="mt-2 field text-[14px]"
                />
              )}
            </>
          ) : (
            <input
              type="text"
              value={marca}
              onChange={e => setMarca(e.target.value)}
              placeholder="Ej: Fiat, Volkswagen, Mercedes..."
              className="field text-[14px]"
            />
          )}
        </div>

        {/* Campos especiales */}
        {camposEspeciales.length > 0 && (
          <div className="border border-line bg-paper-2 p-5 space-y-4">
            <h3 className="font-semibold text-ink">{t('specs')}</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/45">{t('specsHint')}</p>
            {camposEspeciales.map((campo: any) => (
              <div key={campo.label}>
                <label className="t-label mb-1.5 block text-ink/45">{campo.label}</label>
                {campo.type === 'select' ? (
                  <select value={specs[campo.label] || ''} onChange={e => setSpecs(p => ({ ...p, [campo.label]: e.target.value }))} className="field text-[13px]">
                    <option value="">Seleccionar...</option>
                    {(campo.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" value={specs[campo.label] || ''} onChange={e => setSpecs(p => ({ ...p, [campo.label]: e.target.value }))} className="field text-[13px]" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ubicación */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Comunidad Autónoma</label>
            <select value={ubicacionEstado} onChange={e => setUbicacionEstado(e.target.value)} className="field text-[14px]">
              <option value="">Comunidad Autónoma...</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="t-label mb-1.5 block text-ink/45">Provincia</label>
            <select value={ubicacionCiudad} onChange={e => setUbicacionCiudad(e.target.value)} disabled={!ubicacionEstado} className="field text-[14px]">
              <option value="">Provincia...</option>
              {(ubicacionEstado ? getMunicipiosNombres(ubicacionEstado) : []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Métodos de contacto */}
        <div className="border border-line bg-paper-2 p-5 space-y-3">
          <h3 className="font-semibold text-ink">{t('contactTitle')}</h3>

          {showWhatsApp ? (
            <div className="border border-line bg-paper p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">💚 WhatsApp</span>
                <button type="button" onClick={() => setShowWhatsApp(false)} className="text-clay text-xs hover:underline">Quitar</button>
              </div>
              <input type="tel" value={contactWhatsApp} onChange={e => setContactWhatsApp(e.target.value)} placeholder="+34 600 123 456" className="mt-2 w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ) : (
            <label className="flex items-center gap-3 border border-line bg-paper p-3 cursor-pointer transition-colors hover:border-ink">
              <input type="checkbox" onChange={() => { setShowWhatsApp(true); setContactWhatsApp('+34 ') }} className="rounded" />
              <span className="text-sm">💚 WhatsApp</span>
            </label>
          )}

          {showPhone ? (
            <div className="border border-line bg-paper p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">📞 Teléfono</span>
                <button type="button" onClick={() => setShowPhone(false)} className="text-clay text-xs hover:underline">Quitar</button>
              </div>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+34 600 123 456" className="mt-2 w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ) : (
            <label className="flex items-center gap-3 border border-line bg-paper p-3 cursor-pointer transition-colors hover:border-ink">
              <input type="checkbox" onChange={() => { setShowPhone(true); setContactPhone('+34 ') }} className="rounded" />
              <span className="text-sm">📞 Teléfono</span>
            </label>
          )}

          {showEmail ? (
            <div className="border border-line bg-paper p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">📧 Email</span>
                <button type="button" onClick={() => setShowEmail(false)} className="text-clay text-xs hover:underline">Quitar</button>
              </div>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="tu@email.com" className="mt-2 w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ) : (
            <label className="flex items-center gap-3 border border-line bg-paper p-3 cursor-pointer transition-colors hover:border-ink">
              <input type="checkbox" onChange={() => { setShowEmail(true) }} className="rounded" />
              <span className="text-sm">📧 Email</span>
            </label>
          )}

          {showMessenger ? (
            <div className="border border-line bg-paper p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">💬 Messenger</span>
                <button type="button" onClick={() => setShowMessenger(false)} className="text-clay text-xs hover:underline">Quitar</button>
              </div>
              <input type="url" value={contactMessenger} onChange={e => setContactMessenger(e.target.value)} placeholder="https://m.me/tuusuario" className="mt-2 w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ) : (
            <label className="flex items-center gap-3 border border-line bg-paper p-3 cursor-pointer transition-colors hover:border-ink">
              <input type="checkbox" onChange={() => { setShowMessenger(true); setContactMessenger('https://m.me/') }} className="rounded" />
              <span className="text-sm">💬 Facebook Messenger</span>
            </label>
          )}
        </div>

        {/* Imágenes actuales */}
        {currentImages.length > 0 && (
          <div>
            <label className="t-label mb-2 block text-ink/45">Imágenes actuales</label>
            <div className="grid grid-cols-4 gap-2">
              {currentImages.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image src={url} alt="" className="w-full h-full object-cover" fill sizes="100px" unoptimized />
                  <button onClick={() => removeCurrentImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-paper opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agregar nuevas imágenes */}
        <div>
          <label className="t-label mb-2 block text-ink/45">Agregar imágenes</label>
          <label className={`flex items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-ink transition ${procesando ? 'pointer-events-none opacity-70' : ''}`}>
            {procesando ? (
              <>
                <div className="h-4 w-4 animate-spin border border-line border-t-ink" />
                <span className="text-[12.5px] text-ink/55">Optimizando imágenes…</span>
              </>
            ) : (
              <>
                <Camera size={18} strokeWidth={1.4} className="text-ink/30" />
                <span className="text-[12.5px] text-ink/55">Seleccionar fotos…</span>
              </>
            )}
            <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" disabled={procesando} />
          </label>
          {newImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {newImages.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image src={img.preview} alt="" className="w-full h-full object-cover" fill sizes="100px" unoptimized />
                  <button onClick={() => removeNewImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-paper"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activo/Pausado */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} className="h-4 w-4 border-line-strong text-ink" />
            <span className="text-[12.5px] font-medium text-ink">Publicación {activo ? 'activa' : 'pausada'}</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button onClick={handleSubmit} disabled={guardando} className="btn btn-ink btn-lg disabled:opacity-50">
            <Save size={13} /> {guardando ? t('saving') : t('save')}
          </button>
          <button onClick={() => router.push(`/producto/${productoId}`)} className="btn btn-outline">Cancelar</button>
          <button onClick={handleEliminar} disabled={eliminando} className="t-label ml-auto inline-flex items-center gap-2 text-clay transition-colors hover:underline disabled:opacity-50">
            <Trash2 size={12} /> {eliminando ? 'Eliminando…' : 'Eliminar anuncio'}
          </button>
        </div>
      </div>
    </div>
  )
}
