'use client'

import { formatPrecio } from '@/lib/precio'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, ShoppingBag, Eye, TrendingUp, DollarSign, Star, Clock } from 'lucide-react'

export default function MetricasTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [topSellers, setTopSellers] = useState<any[]>([])

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        // Total counts
        const [
          { count: totalUsers },
          { count: totalProducts },
          { count: activeProducts },
          { count: totalVisits },
          { count: totalResenas },
          { count: totalTransactions },
          { count: verifiedSellers },
          { count: pendingTransactions },
        ] = await Promise.all([
          supabase.from('perfiles').select('id', { count: 'exact', head: true }),
          supabase.from('productos').select('id', { count: 'exact', head: true }),
          supabase.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true),
          supabase.from('productos').select('visitas', { count: 'exact' }).then(({ data }: any) => {
            return { count: data?.reduce((s: number, p: any) => s + (p.visitas || 0), 0) || 0 }
          }),
          supabase.from('resenas').select('id', { count: 'exact', head: true }),
          supabase.from('transacciones_creditos').select('id', { count: 'exact', head: true }),
          supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('verificado', true),
          supabase.from('transacciones_creditos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        ])

        // Recent activity (last 20 products)
        const { data: recent } = await supabase
          .from('productos')
          .select('id, titulo, creado_en, visitas, activo, seller_nombre, precio_usd')
          .order('creado_en', { ascending: false })
          .limit(20)

        // Top sellers by visits
        const { data: sellers } = await supabase
          .from('productos')
          .select('seller_nombre, seller_telefono, user_id')
          .eq('activo', true)
          .order('visitas', { ascending: false })
          .limit(10)

        // Aggregate by seller - Fase 5: limitar a 1000 productos activos para evitar payload gigante
        const sellerStats: Record<string, any> = {}
        const { data: prods } = await supabase
          .from('productos')
          .select('seller_nombre, visitas, activo')
          .limit(1000)

        prods?.forEach((p: any) => {
          if (!p.seller_nombre) return
          if (!sellerStats[p.seller_nombre]) {
            sellerStats[p.seller_nombre] = { nombre: p.seller_nombre, totalVisits: 0, activeProducts: 0, totalProducts: 0 }
          }
          sellerStats[p.seller_nombre].totalVisits += p.visitas || 0
          sellerStats[p.seller_nombre].totalProducts++
          if (p.activo) sellerStats[p.seller_nombre].activeProducts++
        })

        setStats({
          totalUsers: totalUsers || 0,
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          totalVisits: (totalVisits as any).count || 0,
          totalResenas: totalResenas || 0,
          totalTransactions: totalTransactions || 0,
          verifiedSellers: verifiedSellers || 0,
          pendingTransactions: pendingTransactions || 0 })
        setRecentActivity(recent || [])
        setTopSellers(Object.values(sellerStats).sort((a: any, b: any) => b.totalVisits - a.totalVisits).slice(0, 10))
      } catch (err) {
        console.error('Error loading metrics:', err)
      }
      setLoading(false)
    }

    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: 'Usuarios registrados', value: stats.totalUsers, icon: Users, color: 'text-ink', bg: 'bg-blue-50' },
    { label: 'Publicaciones totales', value: stats.totalProducts, icon: ShoppingBag, color: 'text-ink', bg: 'bg-purple-50' },
    { label: 'Publicaciones activas', value: stats.activeProducts, icon: ShoppingBag, color: 'text-moss', bg: 'bg-signal/10' },
    { label: 'Visitas totales', value: stats.totalVisits?.toLocaleString(), icon: Eye, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Reseñas', value: stats.totalResenas, icon: Star, color: 'text-signal-deep', bg: 'bg-paper-2' },
    { label: 'Transacciones', value: stats.totalTransactions, icon: DollarSign, color: 'text-moss', bg: 'bg-moss/10' },
    { label: 'Vendedores verificados', value: stats.verifiedSellers, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Pagos pendientes', value: stats.pendingTransactions, icon: Clock, color: 'text-clay', bg: 'bg-clay/[0.07]' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#FBFAF5] rounded-xl p-5  border border-line">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-semibold text-ink">{card.value ?? 0}</p>
            <p className="text-[12.5px] text-ink/45 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publicaciones recientes */}
        <div className="bg-[#FBFAF5] rounded-xl  border border-line">
          <div className="p-5 border-b border-line flex items-center gap-2">
            <Clock size={18} className="text-ink" />
            <h3 className="font-semibold text-ink">Publicaciones recientes</h3>
          </div>
          <div className="divide-y divide-line">
            {recentActivity.slice(0, 10).map((p: any) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{p.titulo}</p>
                  <p className="text-[12.5px] text-ink/45">
                    {formatPrecio(p.precio_usd || 0)} · {p.seller_nombre}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-[12.5px] text-ink/45">
                    {new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(p.creado_en))}
                  </p>
                  <p className="text-[12.5px] text-ink/45 flex items-center gap-1 justify-end">
                    <Eye size={10} /> {p.visitas || 0}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] leading-relaxed text-ink/55">No hay publicaciones aún</p>
            )}
          </div>
        </div>

        {/* Top vendedores por visitas */}
        <div className="bg-[#FBFAF5] rounded-xl  border border-line">
          <div className="p-5 border-b border-line flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-600" />
            <h3 className="font-semibold text-ink">Top vendedores por visitas</h3>
          </div>
          <div className="divide-y divide-line">
            {topSellers.slice(0, 10).map((s: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-signal/15 text-ink' : i === 1 ? 'bg-paper-2 text-ink' : i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-paper-2 text-ink/55'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{s.nombre}</p>
                    <p className="text-[12.5px] text-ink/45">{s.activeProducts} activos de {s.totalProducts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                  <Eye size={14} />
                  {formatPrecio(s.totalVisits)}
                </div>
              </div>
            ))}
            {topSellers.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] leading-relaxed text-ink/55">No hay datos aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue estimate */}
      {stats.totalTransactions > 0 && (
        <div className="border border-moss/30 bg-moss/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={24} className="text-moss" />
            <h3 className="font-semibold text-ink text-lg">Estimación de ingresos</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[13px] leading-relaxed text-ink/55">Si 20% compran el paquete 5 €</p>
              <p className="text-2xl font-semibold text-moss">${(stats.totalTransactions * 0.2 * 5).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[13px] leading-relaxed text-ink/55">Si 20% compran el paquete 10 €</p>
              <p className="text-2xl font-semibold text-moss">${(stats.totalTransactions * 0.2 * 10).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[13px] leading-relaxed text-ink/55">Si 20% compran el paquete 20 €</p>
              <p className="text-2xl font-semibold text-moss">${(stats.totalTransactions * 0.2 * 20).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
