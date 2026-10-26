/** @jest-environment node */
import fs from 'node:fs'
import path from 'node:path'
import { ANUNCIOS, VENDEDORES, specs } from '@/lib/semilla-datos.js'
import { analizarSemilla } from '@/lib/semilla-calidad.js'

const porRef = (ref: string): any => {
  const anuncio = ANUNCIOS.find((a: any) => a.ref === ref)
  if (!anuncio) throw new Error(`Falta ${ref} en la semilla`)
  return anuncio
}
const vendedorDe = (anuncio: any) => VENDEDORES.find((v: any) => v.slug === anuncio.vendedor)

describe('reconstrucción editorial de la semilla', () => {
  test('cada anuncio tiene ref estable, canal de venta y decisión trazable', () => {
    expect(ANUNCIOS).toHaveLength(37)
    expect(new Set(ANUNCIOS.map((a: any) => a.ref)).size).toBe(37)
    for (const anuncio of ANUNCIOS as any[]) {
      expect(anuncio.ref).toMatch(/^SEM-\d{3}$/)
      expect(anuncio.canalVenta).toBeTruthy()
      expect(['mantener', 'corregir-modelo', 'sustituir']).toContain(anuncio.decision)
      expect(vendedorDe(anuncio)?.perfilVoz).toBeTruthy()
    }
  })

  test('la voz y el canal son compatibles con el vendedor asignado', () => {
    const { errores } = analizarSemilla({ VENDEDORES, ANUNCIOS })
    expect(errores).toEqual([])

    const familiar = porRef('SEM-004')
    expect(vendedorDe(familiar)?.tipo).toBe('particular')
    expect(familiar.canalVenta).toBe('venta-particular')
    expect(familiar.descripcion).toMatch(/finca de cítricos familiar/i)

    const herramientaParticular = porRef('SEM-030')
    expect(vendedorDe(herramientaParticular)?.tipo).toBe('particular')
    expect(herramientaParticular.descripcion).toMatch(/^Vendo mi sierra/i)
  })

  test('ninguna foto heredada se declara verificada sin dossier de una sola unidad', () => {
    const resultado = analizarSemilla({ VENDEDORES, ANUNCIOS }, { exigirFotosVerificadas: true })
    expect(ANUNCIOS.every((a: any) => a.estadoFotos === 'cuarentena')).toBe(true)
    expect(resultado.bloqueosFotos).toHaveLength(37)
    expect(resultado.errores).toHaveLength(37)

    // Las rutas actuales existen, pero existir no equivale a estar aprobadas:
    // siguen referenciadas solo como material en cuarentena para la auditoría.
    for (const anuncio of ANUNCIOS as any[]) {
      for (const foto of anuncio.fotos) {
        expect(fs.existsSync(path.join(process.cwd(), 'public', foto))).toBe(true)
      }
    }
  })

  test('las fichas ya no heredan Diésel, transmisión ni cero horas por defecto', () => {
    expect(specs({ familia: 'herramientas', comb: 'Gasolina' })).toEqual({ Combustible: 'Gasolina' })
    expect(specs({ familia: 'herramientas', horas: 0 })).toEqual({})
    expect(specs({ familia: 'agricola', anio: 2020 })).toEqual({ 'Año': '2020' })

    for (const anuncio of ANUNCIOS as any[]) {
      expect(anuncio.ficha['Horas de uso']).not.toBe('0')
      if (['Maquinaria agrícola', 'Ganadería', 'Taller manual'].includes(anuncio.sub)) {
        expect(anuncio.ficha.Combustible).toBeUndefined()
      }
    }
  })

  test('correcciones de identidad más graves de la auditoría', () => {
    expect(porRef('SEM-020').titulo).toMatch(/Cargadora de ruedas JCB 411/)
    expect(porRef('SEM-020').titulo).not.toMatch(/retroexcavadora/i)
    expect(porRef('SEM-022').ficha).toMatchObject({ 'Potencia (CV)': '33', 'Peso (kg)': '2700' })
    expect(porRef('SEM-025').titulo).toMatch(/telescópica Genie S-65/)
    expect(porRef('SEM-037')).toMatchObject({
      sub: 'Herramienta eléctrica',
      marca: 'Einhell',
      modelo: 'TC-MX 1400-2 E',
    })
    expect(porRef('SEM-037').ficha.Combustible).toBe('Eléctrico')
  })
})
