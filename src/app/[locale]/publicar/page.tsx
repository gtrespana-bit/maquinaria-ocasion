'use client'

import { useState, useEffect, useRef } from 'react'
import LocalLink from '@/components/LocalLink'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { productUrl } from '@/lib/product-url'
import { useAuth } from '@/components/AuthProvider'
import { categoriasData, resolverCampos, esCampoMarca, FAMILIAS, CATEGORIA_DEFAULT } from '@/lib/categorias'
import { agruparPorFabricante, etiquetaModelo } from '@/lib/marcas'
import { ESTADOS, getMunicipiosNombres } from '@/lib/ubicaciones'
import { formatPrecio } from '@/lib/precio'
import { etiquetaPlan } from '@/lib/planes-anuncios'
import { Camera, X, AlertCircle, Phone, Mail, MapPin, MessageSquare } from 'lucide-react'
import { verificarContenido } from '@/lib/moderacion'
import BadgeTipoVendedor from '@/components/BadgeTipoVendedor'
import { emailProductoPublicado } from '@/lib/server-email'
import { compressImages } from '@/lib/compress-image'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

// Condition keys for translation (DB values are Spanish)
const conditionKeys = [
  { value: 'Nuevo', key: 'conditionNew' },
  { value: 'Como nuevo', key: 'conditionLikeNew' },
  { value: 'Bueno', key: 'conditionGood' },
  { value: 'Usado', key: 'conditionUsed' },
]

interface ImageFile {
  file: File
  preview: string
  uploadedUrl?: string
  uploading?: boolean
  error?: boolean
}

export default function PublicarPage() {
  const t = useTranslations('publicar')
  const tRoot = useTranslations()
  const { session, user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [familia, setFamilia] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [marca, setMarca] = useState('')
  const [estadoProd, setEstadoProd] = useState('')
  const [precioUsd, setPrecioUsd] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [ubicacionEstado, setUbicacionEstado] = useState('')
  const [ubicacionCiudad, setUbicacionCiudad] = useState('')
  const [imagenes, setImagenes] = useState<ImageFile[]>([])
  const imagenesRef = useRef<ImageFile[]>([])
  const [procesando, setProcesando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [specs, setSpecs] = useState<Record<string, string>>({})
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactWhatsApp, setContactWhatsApp] = useState('')
  const [contactMessenger, setContactMessenger] = useState('')
  const [moderacionResultado, setModeracionResultado] = useState<{ nivel: string; palabras: string[] } | null>(null)
  const [showEmprendedor, setShowEmprendedor] = useState(false)
  const [pubCount, setPubCount] = useState(0)
  const [tipoVendedor, setTipoVendedor] = useState<string | null>(null)
  const [cupo, setCupo] = useState<{
    max: number | null
    usados: number
    restantes: number | null
    puedePublicar: boolean
    trial: boolean
    trialGracia: boolean
    profesional: boolean
    fotosMax: number
    plan: string
    planContratado: string
    trialHasta: string | null
    graciaHasta: string | null
  } | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login')
    }
    if (user) {
      // Contar publicaciones para el progreso emprendedor
      supabase
        .from('productos')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('activo', true)
        .then(({ count }) => setPubCount(count || 0))

      // Con qué tipo de vendedor está publicando (Fase 2)
      fetch('/api/perfil')
        .then(r => (r.ok ? r.json() : null))
        .then(result => {
          if (result?.profile?.tipo_vendedor) setTipoVendedor(result.profile.tipo_vendedor)
        })
        .catch(() => {})

      fetch('/api/cupo-anuncios')
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.ok) setCupo(data)
        })
        .catch(() => {})
    }
  }, [authLoading, session, router, user])

  // Mantener la referencia actual para limpiar previews solo al desmontar.
  // Un efecto con `imagenes` como dependencia revocaría las URLs anteriores
  // durante cada render y rompería las previsualizaciones aún visibles.
  useEffect(() => {
    imagenesRef.current = imagenes
  }, [imagenes])

  useEffect(() => {
    return () => {
      imagenesRef.current.forEach(img => {
        if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
      })
    }
  }, [])

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8">
        <h1 className="sr-only">{t('title')}</h1>
        <div className="t-label mb-6 text-ink/40">{t('loading')}</div>
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton mt-3 h-4 w-1/2" />
        <div className="mt-10 space-y-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-11 w-40" />
        </div>
      </div>
    )
  }
  if (!session) {
    // No dejar una pantalla vacía mientras se redirige al login: también es
    // el contenido que puede rastrear Google en la primera respuesta HTML.
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <p className="t-eyebrow text-ink/45">Publicar</p>
        <h1 className="t-display t-display-lg mt-5 text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{t('freeBannerDesc')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LocalLink href="/login" className="btn btn-ink btn-lg">
            {t('loginButton')}
          </LocalLink>
          <LocalLink href="/register" className="btn btn-outline btn-lg">
            Crear cuenta gratis
          </LocalLink>
        </div>
      </div>
    )
  }

  // La familia elegida en el paso 1 ES la categoría (agrícola / obra /
  // herramientas): los tipos del paso 2 salen de su `subs` y su clave viaja en
  // `categoria` (el API la resuelve a `categoria_id` auto-creando la fila).
  const familiaCfg = familia ? FAMILIAS.find(f => f.key === familia) : undefined
  const cat = familia ? categoriasData[familia] : undefined
  const tiposFamilia = cat && familiaCfg ? cat.subs.filter(s => familiaCfg.subs.includes(s.slug)) : []
  const sub = tiposFamilia.find(s => s.label === subcategoria) || cat?.subs.find(s => s.label === subcategoria)

  // Los campos de "Año" y "Marca" resuelven sus opciones dinámicamente
  // (ver resolverCampos). Antes, un campo Marca sin `options` — como el de
  // repuestos — quedaba con la lista vacía y solo mostraba "Otra marca".
  const camposEspeciales = resolverCampos(sub)

  const handleFamiliaChange = (val: string) => {
    setFamilia(val); setSubcategoria(''); setMarca(''); setSpecs({})
  }
  const handleSubChange = (val: string) => {
    setSubcategoria(val); setMarca(''); setSpecs({})
  }
  const handleSpecChange = (label: string, value: string) => {
    setSpecs(prev => ({ ...prev, [label]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const topeFotos = cupo?.fotosMax ?? 10
    const maxFiles = topeFotos - imagenes.length
    if (maxFiles <= 0) return

    const selected: File[] = []
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      selected.push(file)
    }
    if (selected.length === 0) return

    // Reset input so the same file can be re-selected
    e.target.value = ''

    // Optimizar en el navegador (canvas → WebP, máx 1600px) antes de subir:
    // reduce drásticamente el tamaño de cada foto → menos carga para el
    // optimizador de imágenes de Vercel y sitio más rápido.
    setProcesando(true)
    let processed = selected
    try {
      processed = await compressImages(selected)
    } catch {
      // si algo falla, subir los originales
    } finally {
      setProcesando(false)
    }

    const newImages: ImageFile[] = processed.map(file => ({
      file,
      preview: URL.createObjectURL(file) }))
    setImagenes(prev => [...prev, ...newImages])
  }

  const removeImage = (preview: string) => {
    const img = imagenes.find(i => i.preview === preview)
    if (img && img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
    setImagenes(prev => prev.filter(i => i.preview !== preview))
  }

  const uploadImages = async (): Promise<string[]> => {
    const userId = user?.id

    // Marcar todas como subiendo
    setImagenes(prev => prev.map(p => ({ ...p, uploading: true })))

    // Subir cada imagen directamente al servidor (Supabase Storage)
      const uploadPromises = imagenes.map(async (img, i) => {
        const ext = (img.file.name.split('.').pop() || 'jpg').toLowerCase()
        const key = `${userId}/${Date.now()}_${i}.${ext}`.replace(/\s+/g, '_')

        const fd = new FormData()
        fd.append('file', img.file)
        fd.append('key', key)

        const res = await fetch('/api/storage-upload', {
          method: 'POST',
          body: fd })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.error('Error subiendo foto:', data.error || res.status)
          setImagenes(prev => prev.map((p, idx) => idx === i ? { ...p, error: true, uploading: false } : p))
          throw new Error(data.error || 'No se pudo subir la foto')
        }

        const { publicUrl } = await res.json()

        setImagenes(prev => prev.map((p, idx) => idx === i ? { ...p, uploadedUrl: publicUrl, uploading: false } : p))
        return publicUrl
      })
    const results = await Promise.all(uploadPromises)
    const urls = results.filter((url): url is string => url !== null)

    // Actualizar progreso
    setUploadProgress(Math.round((urls.length / imagenes.length) * 100))

    return urls
  }

  const handleSubmit = async () => {
    if (cupo && !cupo.puedePublicar) {
      setError(t('cupoLleno'))
      return
    }

    setLoading(true)
    setError('')
    setModeracionResultado(null)

    if (!isSupabaseConfigured()) {
      setError('Supabase no esta configurado. Agrega las variables de entorno.')
      setLoading(false)
      return
    }

    // MODERACIÓN: verificar contenido antes de publicar
    const textoCompleto = `${titulo} ${descripcion}`
    const resultado = verificarContenido(textoCompleto)
    setModeracionResultado(resultado)

    if (resultado.nivel === 'prohibido') {
      setError(`Tu publicación contiene contenido que viola nuestras normas. No se permite: ${resultado.palabras.join(', ')}. Si crees que es un error, contacta soporte.`)
      setLoading(false)
      return
    }

    // Si es sospechoso, el servidor lo dejará pendiente y enviará la alerta.
    try {
      // Upload images first
      let imagenUrl: string | null = null
      let imagenesArray: string[] = []

      if (imagenes.length > 0) {
        setUploadProgress(0)
        try {
          imagenesArray = await uploadImages()
        } catch (e: any) {
          setError(e?.message || 'No se pudieron subir las fotos. Inténtalo de nuevo.')
          setLoading(false)
          return
        }
        if (imagenesArray.length === 0) {
          setError('No se pudieron subir las fotos. El anuncio no se ha publicado.')
          setLoading(false)
          return
        }
        imagenUrl = imagenesArray[0]
      }

      // NOTA: el categoria_id ya NO se resuelve aquí.
      //
      // Antes este cliente hacía `.eq('nombre', categoria).single()`. Cuando la
      // categoría no existía en la tabla `categorias` (p. ej. 'repuestos' y
      // 'materiales', que están en categoriasData pero nunca se insertaron en
      // la DB), `.single()` con 0 filas hace que PostgREST responda **406** —
      // el error que aparecía en consola — y el producto se guardaba con
      // `categoria_id = NULL`, quedando fuera de los filtros por categoría.
      //
      // Ahora se envía la CLAVE de la categoría y el servidor la resuelve (y la
      // crea si falta) con el service role. Ver src/app/api/publicar/route.ts.

      // ── Especificaciones del paso 2 ──
      // `specs` se recogía y se mostraba en la revisión, pero NUNCA se enviaba:
      // Marca/Modelo/Tipo de repuesto se perdían al publicar. Ahora se guardan.
      const limpiarValor = (v: string) => v.replace(/^otra:/, '').trim()

      const especificacionesFinal = Object.fromEntries(
        Object.entries(specs)
          .map(([k, v]) => [k, limpiarValor(v)])
          .filter(([, v]) => v)
      ) as Record<string, string>

      // La marca específica del paso 2 (p. ej. la de la máquina a la que va
      // destinado un repuesto) tiene prioridad sobre la marca genérica del paso 1.
      const campoMarca = camposEspeciales.find(esCampoMarca)
      const marcaSpec = campoMarca ? limpiarValor(specs[campoMarca.label] || '') : ''
      const marcaFinal = marcaSpec || limpiarValor(marca) || null

      // `modelo` es una columna propia de `productos`: si la subcategoría
      // define un campo Modelo, lo promovemos a esa columna.
      const campoModelo = camposEspeciales.find(c => c.label.toLowerCase() === 'modelo')
      const modeloFinal = campoModelo ? limpiarValor(specs[campoModelo.label] || '') || null : null

      // Build metodos_contacto JSON
      const metodosContacto: Record<string, any> = {}
      if (contactEmail) metodosContacto.email = contactEmail
      if (contactPhone) metodosContacto.telefono = contactPhone
      if (contactWhatsApp) metodosContacto.whatsapp = contactWhatsApp
      if (contactMessenger) metodosContacto.messenger = contactMessenger

      // Insert product via API route with rate limiting. La moderación y la
      // alerta se calculan en el servidor; no se envía una segunda alerta desde
      // el navegador para evitar duplicados y manipulación del estado.
      const precioNum = parseFloat(precioUsd) || null
      const res = await fetch('/api/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          user_id: user?.id,
          titulo,
          descripcion,
          categoria: familia || CATEGORIA_DEFAULT,
          subcategoria,
          marca: marcaFinal,
          modelo: modeloFinal,
          especificaciones: especificacionesFinal,
          estado: estadoProd,
          // Canónico ES: `precio` (euros). El alias `precio_usd` se mantiene por compat BD, ambos sincronizados.
          precio: precioNum,
          precio_eur: precioNum,
          precio_usd: precioNum,
          video_url: videoUrl.trim() || null,
          ubicacion_estado: ubicacionEstado,
          ubicacion_ciudad: ubicacionCiudad,
          imagen_url: imagenUrl,
          imagenes: imagenesArray,
          // `{}` significa que esta publicación solo acepta chat. Reservamos
          // `null` para anuncios legacy que aún no tenían esta configuración.
          metodos_contacto: metodosContacto,
          activo: true,
          destacado: false }) })
      
      const apiResult = await res.json()
      
      if (res.status === 429) {
        setError(apiResult.error || 'Demasiadas publicaciones. Espera unos minutos.')
        setLoading(false)
        return
      }

      if (res.status === 403 && apiResult.codigo === 'CUPO') {
        setError(apiResult.error || t('cupoLleno'))
        setCupo(prev =>
          prev
            ? { ...prev, puedePublicar: false, restantes: 0, usados: apiResult.usados ?? prev.usados }
            : prev,
        )
        setLoading(false)
        return
      }
      
      if (!res.ok || !apiResult.ok) {
        console.error('API error:', apiResult)
        setError('Error al guardar: ' + (apiResult.error || 'Error desconocido'))
        setLoading(false)
        return
      }
      
      const producto = apiResult.data

      // Check Pack Emprendedor (10+ publicaciones = 5 creditos gratis)
      const { count: pubCount } = await supabase
        .from('productos')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('activo', true)
      
      if (pubCount && pubCount >= 10) {
        const perfilResponse = await fetch('/api/perfil')
        const perfilResult = await perfilResponse.json().catch(() => ({}))
        if (perfilResult.profile && !perfilResult.profile.emprendedor_dado) {
          setShowEmprendedor(true)
          setTimeout(() => setShowEmprendedor(false), 6000)
        }
      }

      // EMAIL: notificar que el producto fue publicado
      const nombrePublicador = user?.email?.split('@')[0] || 'Usuario'
      try {
        await emailProductoPublicado(user?.email || '', nombrePublicador, titulo, precioUsd, producto.id)
      } catch (e) {
        console.error('Error email publicación:', e)
      }
      
      // Ir directo a la URL canónica con slug (el detalle redirige 301 si se
      // entra por UUID, y la redirección perdería el ?nuevo=1 del banner).
      router.push(`${productUrl(producto)}?nuevo=1`)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado, intentalo de nuevo.')
    }

    setLoading(false)
  }

  const canGoToStep2 = familia && subcategoria
  const canGoToStep3 = titulo && descripcion && estadoProd && precioUsd

  // ── Resumen del plan en el propio formulario ───────────────────────────
  // Quien está publicando es justo quien topa con el cupo: aquí tiene que ver
  // qué plan tiene, cuántos días le quedan y qué pasa cuando termine. Antes
  // solo decía «estás en prueba», sin fecha ni consecuencia.
  const diasHasta = (iso: string | null | undefined) => {
    if (!iso) return 0
    const ms = new Date(iso).getTime() - Date.now()
    return ms <= 0 ? 0 : Math.ceil(ms / 86400000)
  }
  const fechaCorta = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
      : ''
  const planNombre = etiquetaPlan(cupo?.plan)
  const diasPrueba = diasHasta(cupo?.trialHasta)
  const diasGracia = diasHasta(cupo?.graciaHasta)
  // `plan` es el efectivo (un pack caducado ya cuenta como gratis);
  // `planContratado` seguiría diciendo «plus» y el banner mentiría.
  const packActivo = Boolean(cupo && !cupo.trial && !cupo.trialGracia && cupo.plan !== 'gratis')
  // El vídeo es exclusivo de planes de pago (decisión de producto): el form
  // gratuito ni muestra el campo y /api/publicar lo descarta igualmente.
  // La prueba activa cuenta como plan de pago; la gracia post-prueba no.
  const puedeVideo = Boolean(cupo && !cupo.trialGracia && cupo.plan !== 'gratis')

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <p className="t-eyebrow text-ink/45">Publicar</p>
      <h1 className="t-display t-display-lg mt-4 text-ink">{t('title')}</h1>

      {/* Publicando como… (Fase 2: el comprador verá este chip en el anuncio) */}
      {tipoVendedor && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          {t('asLabel')} <BadgeTipoVendedor tipo={tipoVendedor} />
          <LocalLink href="/dashboard" className="t-label text-ink underline underline-offset-4">
            {t('changeTipo')}
          </LocalLink>
        </p>
      )}

      {cupo && (
        <div
          className={`mt-7 border p-4 ${
            cupo.puedePublicar ? 'border-moss/25 bg-moss-soft' : 'border-signal-deep/40 bg-signal-soft/60'
          }`}
        >
          <p className={`text-[13.5px] font-semibold ${cupo.puedePublicar ? 'text-moss' : 'text-ink'}`}>
            {cupo.trial
              ? t('pruebaTitulo', { plan: planNombre, dias: diasPrueba })
              : cupo.trialGracia
                ? t('graciaTitulo', { dias: diasGracia })
                : packActivo
                  ? t('packTitulo', { plan: planNombre })
                  : cupo.puedePublicar
                    ? t('freeBanner')
                    : t('cupoLlenoTitulo')}
          </p>
          <p className={`mt-1 text-[12.5px] leading-relaxed ${cupo.puedePublicar ? 'text-moss/80' : 'text-ink/70'}`}>
            {t('cupoResumen', {
              usados: cupo.usados,
              max: cupo.max == null ? '∞' : cupo.max,
              restantes: cupo.restantes == null ? '∞' : cupo.restantes })}
            {cupo.trial
              ? ` ${t('pruebaDetalle', { fecha: fechaCorta(cupo.trialHasta), gracia: fechaCorta(cupo.graciaHasta) })}`
              : cupo.trialGracia
                ? ` ${t('graciaDetalle', { fecha: fechaCorta(cupo.graciaHasta) })}`
                : packActivo
                  ? ` ${t('packDetalle')}`
                  : ''}
          </p>
          {(cupo.trial || cupo.trialGracia) && (
            <p className="text-xs mt-2">
              <LocalLink href="/para-profesionales" className="underline font-semibold">
                {t('verPlanes')}
              </LocalLink>
              <span className="mx-1 text-amber-700/60">·</span>
              <LocalLink href="/dashboard?tab=plan" className="underline font-semibold">
                {t('verMiPlan')}
              </LocalLink>
            </p>
          )}
          {!cupo.puedePublicar && (
            <p className="text-xs mt-2">
              <LocalLink href="/para-profesionales" className="underline font-semibold">
                {t('verPlanes')}
              </LocalLink>
              <span className="mx-1 text-amber-700/60">·</span>
              <LocalLink href="/dashboard?tab=productos" className="underline font-semibold">
                {t('pausarUno')}
              </LocalLink>
            </p>
          )}
        </div>
      )}
      {!cupo && (
        <div className="mt-7 border border-moss/25 bg-moss-soft p-4">
          <p className="text-[13.5px] font-semibold text-moss">{t('freeBanner')}</p>
          <p className="mt-1 text-[12.5px] text-moss/80">{t('freeBannerDesc')}</p>
        </div>
      )}

      <p className="mt-3 text-[14px] text-muted">{t('stepsDesc')}</p>

      {/* Error banner */}
      {error && (
        <div className="mt-5 flex items-start gap-2 border border-clay/40 bg-clay/[0.05] p-3 text-[13px] text-clay">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Emprendedor bonus banner */}
      {showEmprendedor && (
        <div className="mt-5 border border-line bg-paper-2/70 p-5">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{t('entrepreneurTitle')}</h3>
              <p className="mt-1 text-[13px] text-ink/70">
                {t.rich('entrepreneurDesc', { strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
              <p className="t-label mt-1 text-ink/45">{t('entrepreneurMore')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="mt-8 mb-6 flex items-center gap-2 overflow-x-auto border-y border-line py-3 hide-scrollbar">
        {[{ num: 1, label: t('stepPhotos') }, { num: 2, label: t('stepCategory') }, { num: 3, label: t('stepDetails') }, { num: 4, label: t('stepReview') }].map((s) => (
          <div key={s.num} className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              aria-current={step === s.num ? 'step' : undefined}
              className={`t-num flex h-8 w-8 items-center justify-center border text-[12px] font-semibold transition-colors ${
                step === s.num
                  ? 'border-ink bg-ink text-paper'
                  : step > s.num
                    ? 'border-ink text-ink'
                    : 'border-line text-ink/35'
              }`}
            >
              {s.num}
            </button>
            <span className={`t-label hidden sm:inline ${step >= s.num ? 'text-ink' : 'text-ink/35'}`}>
              {s.label}
            </span>
            {s.num < 4 && <div className={`h-px w-5 sm:w-8 ${step > s.num ? 'bg-ink' : 'bg-line'}`} />}
          </div>
        ))}
      </div>

      <div className="border border-line bg-[#FBFAF5] p-6 md:p-8">

        {/* PASO 2: Categoria → Subcategoria → Marca */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="t-display t-display-sm text-ink">{t('whatToPublish')}</h2>

            <div>
              <label className="t-label mb-1.5 block text-ink/50">{t('family')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FAMILIAS.map(f => {
                  let displayLabel = f.label
                  let displayDesc = ''
                  try {
                    const translated = tRoot(`familias.${f.key}.label`)
                    if (translated && translated !== `familias.${f.key}.label`) displayLabel = translated
                    const desc = tRoot(`familias.${f.key}.desc`)
                    if (desc && desc !== `familias.${f.key}.desc`) displayDesc = desc
                  } catch (e) {}
                  return (
                    <button key={f.key} onClick={() => handleFamiliaChange(f.key)} className={`border p-4 text-center transition-colors ${
                        familia === f.key ? 'border-ink bg-signal/15' : 'border-line hover:border-ink'
                      }`}>
                      <span className="text-3xl block mb-2">{f.icon}</span>
                      <span className="block text-[13.5px] font-semibold text-ink">{displayLabel}</span>
                      {displayDesc && <span className="mt-1 block text-[11.5px] leading-snug text-muted line-clamp-2">{displayDesc}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {familiaCfg && (
              <>
                <div>
                  <label className="t-label mb-1.5 block text-ink/50">{t('type')}</label>
                  <select value={subcategoria} onChange={e => handleSubChange(e.target.value)} className="field text-[15px]">
                    <option value="">{t('selectType')}</option>
                    {tiposFamilia.map(s => (
                      <option key={s.label} value={s.label}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>
                {subcategoria && sub && sub.marcas.length > 0 && (
                  <div>
                    <label className="t-label mb-1.5 block text-ink/50">{t('brand')}</label>
                    {/* Marca/modelo agrupados por fabricante: Kubota → M7 · M5 · L2…
                        El valor guardado es el canónico de
                        productos.marca (ver @/lib/marcas). */}
                    <select value={marca.startsWith('otra:') ? 'otra:' : marca} onChange={e => setMarca(e.target.value === 'otra:' ? 'otra:' : e.target.value)} className="field text-[15px]">
                      <option value="">{t('selectBrand')}</option>
                      {agruparPorFabricante(sub.marcas).map(g =>
                        g.modelos.length === 1 && !g.modelos[0].modelo ? (
                          <option key={g.modelos[0].valor} value={g.modelos[0].valor}>{g.modelos[0].valor}</option>
                        ) : (
                          <optgroup key={g.fabricante} label={g.fabricante}>
                            {g.modelos.map(m => <option key={m.valor} value={m.valor}>{etiquetaModelo(m)}</option>)}
                          </optgroup>
                        )
                      )}
                      <option value="otra:">{t('otherBrand')}</option>
                    </select>
                    {marca.startsWith('otra:') && (
                      <input
                        type="text"
                        value={marca.replace('otra:', '')}
                        onChange={e => setMarca('otra:' + e.target.value)}
                        placeholder={t('writeBrand')}
                        className="field mt-2 text-[15px]"
                      />
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn btn-outline">{t('back')}</button>
              <button onClick={() => setStep(3)} disabled={!canGoToStep2} className="btn btn-ink flex-1 btn-lg">{t('next')}</button>
            </div>
          </div>
        )}

        {/* PASO 3: Detalles */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="t-display t-display-sm text-ink">{t('productDetails')}</h2>

            <div>
              <label className="t-label mb-1.5 block text-ink/50">{t('titleField')}</label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('titlePlaceholder')} maxLength={100} required className="field text-[15px]" />
              <p className="text-xs text-gray-500 mt-1">{titulo.length}/100</p>
            </div>

            {camposEspeciales.length > 0 && (
              <div className="space-y-4 border border-line bg-paper-2/50 p-5">
                <h3 className="t-eyebrow text-ink">{t('specs')} — {subcategoria}</h3>
                <p className="mt-1 text-[12px] text-muted">{t('specsHint')}</p>
                {camposEspeciales.map(campo => {
                  const val = specs[campo.label] || ''
                  const esOtra = val.startsWith('otra:')
                  return (
                  <div key={campo.label}>
                    <label className="t-label mb-1.5 block text-ink/50">{campo.label}</label>
                    {campo.type === 'select' ? (
                      <>
                        <select value={esOtra ? 'otra:' : val} onChange={e => handleSpecChange(campo.label, e.target.value === 'otra:' ? '' : e.target.value)} className="field text-[15px]">
                          <option value="">{campo.placeholder}</option>
                          {campo.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          {esCampoMarca(campo) && <option value="otra:">{t('otherBrand')}</option>}
                        </select>
                        {esOtra && (
                          <input
                            type="text"
                            value={val.replace('otra:', '')}
                            onChange={e => handleSpecChange(campo.label, 'otra:' + e.target.value)}
                            placeholder={`Escribe ${campo.label.toLowerCase()}...`}
                            className="field mt-2 text-[15px]"
                          />
                        )}
                      </>
                    ) : (
                      <input type={campo.type} value={val} onChange={e => handleSpecChange(campo.label, e.target.value)} placeholder={campo.placeholder} className="field text-[15px]" />
                    )}
                  </div>
                  )
                })}
              </div>
            )}

            <div>
              <label className="t-label mb-1.5 block text-ink/50">{t('description')}</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={5} maxLength={2000} required className="field resize-none text-[15px]" placeholder={t('descPlaceholder')} />
              <p className="text-xs text-gray-500 mt-1">{descripcion.length}/2000</p>
            </div>

            <div>
              <label className="t-label mb-1.5 block text-ink/50">{t('condition')}</label>
              <div className="grid grid-cols-2 gap-2">
                {conditionKeys.map(c => (
                  <button key={c.value} onClick={() => setEstadoProd(c.value)} className={`border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                      estadoProd === c.value
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line text-ink/70 hover:border-ink hover:text-ink'
                    }`}>{t(c.key)}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="t-label mb-1.5 block text-ink/50">{t('priceEur')}</label>
              <input type="number" value={precioUsd} onChange={e => setPrecioUsd(e.target.value)} placeholder={t('pricePlaceholder')} min="0" step="0.01" required className="field text-[15px]" />
              <p className="text-xs text-gray-500 mt-1">{t('priceNote')}</p>
              <p className="text-xs mt-1.5">
                <LocalLink href="/tasador" className="font-bold text-brand-darkNav underline decoration-brand-signal decoration-2 underline-offset-2 hover:text-brand-signal-dark">
                  {t('estimatePriceCta')}
                </LocalLink>
              </p>
              {puedeVideo && (
                <div className="mt-3">
                  <label className="t-label mb-1.5 block text-ink/50">{t('videoLabel')}</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder={t('videoPlaceholder')}
                    maxLength={500}
                    className="field text-[15px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('videoNote')}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label mb-1.5 block text-ink/50">{t('state')}</label>
                <select value={ubicacionEstado} onChange={e => setUbicacionEstado(e.target.value)} required className="field text-[15px]">
                  <option value="">{t('statePlaceholder')}</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="t-label mb-1.5 block text-ink/50">{t('municipality')}</label>
                <select value={ubicacionCiudad} onChange={e => setUbicacionCiudad(e.target.value)} required disabled={!ubicacionEstado} className="field text-[15px]">
                  <option value="">{t('municipalityPlaceholder')}</option>
                  {(ubicacionEstado ? getMunicipiosNombres(ubicacionEstado) : []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Metodos de contacto por publicacion */}
            <div className="space-y-4 border border-line bg-paper p-5">
              <h3 className="t-eyebrow flex items-center gap-2 text-ink">
                <MapPin size={18} />
                {t('contactTitle')}
              </h3>
              <p className="text-xs text-gray-500">{t('contactDesc')}</p>

              <div className="space-y-3">
                {/* WhatsApp */}
                <div className="flex items-start gap-3 border border-line bg-paper p-3">
                  <input type="checkbox" id="useWhatsApp" checked={!!contactWhatsApp} onChange={e => setContactWhatsApp(e.target.checked ? '+' : '')} className="mt-1 rounded text-brand-primary" />
                  <label htmlFor="useWhatsApp" className="flex-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">💚 WhatsApp</span>
                    {contactWhatsApp && <input type="tel" value={contactWhatsApp} onChange={e => setContactWhatsApp(e.target.value)} placeholder="+34 600 123 456" className="field mt-1 !py-1.5 text-[13px]" />}
                  </label>
                </div>

                {/* Telefono */}
                <div className="flex items-start gap-3 border border-line bg-paper p-3">
                  <input type="checkbox" id="usePhone" checked={!!contactPhone} onChange={e => setContactPhone(e.target.checked ? '+' : '')} className="mt-1 rounded text-brand-primary" />
                  <label htmlFor="usePhone" className="flex-1">
                    <span className="text-sm font-medium flex items-center gap-1.5"><Phone size={14} /> {t('calls')}</span>
                    {contactPhone && <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+34 600 123 456" className="field mt-1 !py-1.5 text-[13px]" />}
                  </label>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 border border-line bg-paper p-3">
                  <input type="checkbox" id="useEmail" checked={!!contactEmail} onChange={e => setContactEmail(e.target.checked ? '+' : '')} className="mt-1 rounded text-brand-primary" />
                  <label htmlFor="useEmail" className="flex-1">
                    <span className="text-sm font-medium flex items-center gap-1.5"><Mail size={14} /> Email</span>
                    {contactEmail && <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="tu@email.com" className="field mt-1 !py-1.5 text-[13px]" />}
                  </label>
                </div>

                {/* Messenger */}
                <div className="flex items-start gap-3 border border-line bg-paper p-3">
                  <input type="checkbox" id="useMessenger" checked={!!contactMessenger} onChange={e => setContactMessenger(e.target.checked ? '+' : '')} className="mt-1 rounded text-brand-primary" />
                  <label htmlFor="useMessenger" className="flex-1">
                    <span className="text-sm font-medium flex items-center gap-1.5"><MessageSquare size={14} /> Facebook Messenger</span>
                    {contactMessenger && <input type="url" value={contactMessenger} onChange={e => setContactMessenger(e.target.value)} placeholder="https://m.me/tuusuario" className="field mt-1 !py-1.5 text-[13px]" />}
                  </label>
                </div>
              </div>

              {/* Chat interno siempre activo */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MessageSquare size={12} />
                <span>{t('chatAuto')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn btn-outline">{t('back')}</button>
              <button onClick={() => setStep(4)} disabled={!canGoToStep3} className="btn btn-ink flex-1 btn-lg">{t('next')}</button>
            </div>
          </div>
        )}

        {/* PASO 3: Fotos */}
        {/* PASO 1: Fotos (foto-primero: la foto es el gancho, como en WhatsApp) */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="t-display t-display-sm text-ink">{t('addPhotos')}</h2>
            <p className="text-sm text-gray-500">{t('photosDesc')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {imagenes.map((img, i) => (
                <div key={img.preview} className="group relative aspect-square overflow-hidden border border-line">
                  <Image src={img.preview} alt="" fill unoptimized sizes="200px" className="object-cover" />
                  {i === 0 && img.uploadedUrl && <span className="absolute top-1 left-1 bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{t('cover')}</span>}
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                      <X size={20} className="text-white" />
                    </div>
                  )}
                  {!img.uploading && (
                    <button onClick={() => removeImage(img.preview)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {imagenes.length < 10 && (
                <label className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent hover:bg-yellow-50 transition ${procesando ? 'pointer-events-none opacity-70' : ''}`}>
                  {procesando ? (
                    <>
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-500 mt-2 px-2 text-center">{t('optimizing')}</span>
                    </>
                  ) : (
                    <>
                      <Camera size={24} className="text-gray-500" /><span className="text-xs text-gray-500 mt-1">{t('add')}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={procesando} />
                </label>
              )}
            </div>

            {/* Moderación feedback */}
            {moderacionResultado && moderacionResultado.nivel === 'sospechoso' && (
              <div className="border border-signal-deep/40 bg-signal-soft/50 p-4">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-ink/60" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{t('moderationReview')}</p>
                    <p className="mt-1 text-[12px] text-ink/65">{t('moderationDesc')}</p>
                  </div>
                </div>
              </div>
            )}

            {loading && imagenes.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('uploading')} {uploadProgress}%</p>
                <div className="h-1 w-full bg-line">
                  <div className="h-1 bg-ink transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button onClick={() => setStep(2)} className="btn btn-ink btn-lg w-full">{t('next')}</button>
          </div>
        )}

        {/* PASO 4: Revisar */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="t-display t-display-sm text-ink">{t('reviewTitle')}</h2>
            <div className="space-y-3 border border-line p-5">
              {imagenes.length > 0 && <div className="relative aspect-[4/3] max-h-56 overflow-hidden bg-paper-2"><Image src={imagenes[0].preview} alt="" fill unoptimized sizes="240px" className="object-cover" /></div>}
              <h3 className="text-[17px] font-semibold text-ink">{titulo}</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted">{t('family')}:</span> {familiaCfg ? familiaCfg.label : '—'} → {subcategoria}</p>
                {marca && <p><span className="text-muted">{t('brand')}:</span> {marca.replace('otra:', '').trim()}</p>}
                {Object.entries(specs).filter(([,v]) => v).map(([k,v]) => <p key={k}><span className="text-muted">{k}:</span> {v}</p>)}
                <p><span className="text-muted">{t('condition')}:</span> {estadoProd}</p>
                <p><span className="text-muted">{t('priceEur')}:</span> <strong className="t-num text-[17px] font-semibold text-ink">{formatPrecio(parseFloat(precioUsd) || 0)}</strong></p>
                <p><span className="text-muted">{t('location')}:</span> {ubicacionCiudad}, {ubicacionEstado}</p>
              </div>

              {/* Metodos contacto resumen */}
              {(contactEmail || contactPhone || contactWhatsApp || contactMessenger) && (
                <div className="mt-3 border border-line bg-paper-2/60 p-3">
                  <p className="t-label mb-1 text-ink/45">{t('contactMethods')}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {contactEmail && <span className="border border-line bg-paper px-2 py-1">📧 {contactEmail}</span>}
                    {contactPhone && <span className="border border-line bg-paper px-2 py-1">📞 {contactPhone}</span>}
                    {contactWhatsApp && <span className="border border-line bg-paper px-2 py-1">💚 WhatsApp</span>}
                    {contactMessenger && <span className="border border-line bg-paper px-2 py-1">👤 Messenger</span>}
                    <span className="border border-line bg-paper px-2 py-1">{t('internalChat')}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-line pt-4"><p className="t-label text-ink/45">{t('description')}</p><p className="mt-1 text-[13.5px] leading-relaxed text-ink/75">{descripcion}</p></div>
            </div>

            {moderacionResultado && moderacionResultado.nivel === 'sospechoso' && (
              <div className="border border-signal-deep/40 bg-signal-soft/50 p-4">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-ink/60" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{t('moderationReview')}</p>
                    <p className="mt-1 text-[12px] text-ink/65">{t('moderationDesc')}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="border border-clay/40 bg-clay/[0.05] p-4">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-clay" />
                  <p className="text-[13px] text-clay">{error}</p>
                </div>
              </div>
            )}

            {/* Progreso Emprendedor */}
            {pubCount > 0 && pubCount < 10 && (
              <div className="mb-4 border border-line bg-paper-2/60 p-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[12px] font-semibold text-ink">{t('entrepreneurProgress', { count: pubCount })}</span>
                  <span className="text-[12px] text-ink/60">{t('entrepreneurRemaining', { remaining: 10 - pubCount })}</span>
                </div>
                <div className="mt-1.5 h-1 w-full bg-line">
                  <div className="h-1 bg-ink transition-all" style={{ width: `${(pubCount / 10) * 100}%` }} />
                </div>
              </div>
            )}
            {pubCount >= 10 && !showEmprendedor && (
              <div className="mb-4 flex items-center gap-2 border border-moss/25 bg-moss-soft p-3">
                <span className="text-[13px] font-semibold text-moss">{t('entrepreneurUnlocked')}</span>
              </div>
            )}

            {loading && (
              <div>
                <p className="t-label mb-2 text-ink/50">{t('publishing')} {uploadProgress}%</p>
                <div className="h-1 w-full bg-line">
                  <div className="h-1 bg-ink transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn btn-outline">{t('edit')}</button>
              <button onClick={handleSubmit} disabled={loading} className="btn btn-signal btn-lg flex-1 justify-between">{loading ? t('publishing') : t('publishFree')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
