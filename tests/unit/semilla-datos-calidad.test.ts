/** @jest-environment node */
import fs from 'node:fs'
import path from 'node:path'
import { ANUNCIOS, VENDEDORES, specs } from '@/lib/semilla-datos.js'
import { analizarDossierFotos, analizarSemilla, vistasRequeridas } from '@/lib/semilla-calidad.js'

const porRef = (ref: string): any => {
  const anuncio = ANUNCIOS.find((a: any) => a.ref === ref)
  if (!anuncio) throw new Error(`Falta ${ref} en la semilla`)
  return anuncio
}
const vendedorDe = (anuncio: any) => VENDEDORES.find((v: any) => v.slug === anuncio.vendedor)

function anuncioConDossierValido(): any {
  const base = structuredClone(porRef('SEM-030'))
  const hash = 'a'.repeat(64)
  const fotos = vistasRequeridas(base).map((vista: string, indice: number) => ({
    ruta: `/images/anuncios/festool-ts-55-v2-${String(indice + 1).padStart(2, '0')}-${vista}.webp`,
    vista,
    origen: `https://upload.wikimedia.org/wikipedia/commons/ejemplo-${vista}.jpg`,
    esPortada: indice === 0,
    anchoOriginal: 1600,
    altoOriginal: 1200,
    anchoSalida: 1408,
    altoSalida: 768,
    sha256Original: hash,
    sha256Salida: hash,
  }))

  return {
    ...base,
    estadoFotos: 'verificado',
    fotos: fotos.map((f: any) => f.ruta),
    dossierFotos: {
      version: 1,
      estadoRevision: 'aprobado',
      mismaUnidad: true,
      procedencia: {
        tipo: 'archivo-abierto',
        nombre: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/File:Ejemplo.jpg',
        autor: 'Autor de prueba',
        licencia: 'CC BY-SA 4.0',
        licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        evidenciaDerechos: 'https://commons.wikimedia.org/wiki/File:Ejemplo.jpg',
        atribucion: 'Autor de prueba, CC BY-SA 4.0',
        atribucionUrl: '/creditos-fotograficos#sem-030',
        cambios: 'Recorte 1408x768 y conversión a WebP',
      },
      unidad: {
        marcaModelo: 'Festool TS 55 F',
        fechaSesion: '2026-10-26',
        contexto: 'Banco de trabajo del vendedor particular',
        conciliadoConAnuncio: true,
      },
      revision: {
        revisor: 'Revisión editorial',
        fecha: '2026-10-26',
        checklist: {
          mismaUnidad: true,
          modeloYConfiguracion: true,
          contextoCompatibleConVendedor: true,
          desgasteYDefectosCoherentes: true,
          sinMarcasNiLogosDeTerceros: true,
          sinIaRenderNiPackshot: true,
          derechosComprobados: true,
        },
      },
      fotos,
    },
  }
}

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

  test('un dossier verificado exige procedencia, revisión, vistas y rutas trazables', () => {
    expect(analizarDossierFotos(anuncioConDossierValido())).toEqual([])

    const sinVista = anuncioConDossierValido()
    sinVista.dossierFotos.fotos.pop()
    sinVista.fotos = sinVista.dossierFotos.fotos.map((f: any) => f.ruta)
    expect(analizarDossierFotos(sinVista).join(' ')).toMatch(/vistas requeridas/)

    const sinAtribucion = anuncioConDossierValido()
    sinAtribucion.dossierFotos.procedencia.atribucion = ''
    expect(analizarDossierFotos(sinAtribucion).join(' ')).toMatch(/CC BY sin texto de atribución/)

    const rutasDescuadradas = anuncioConDossierValido()
    rutasDescuadradas.fotos = [...rutasDescuadradas.fotos].reverse()
    expect(analizarDossierFotos(rutasDescuadradas).join(' ')).toMatch(/no coinciden en orden/)

    const anunciosSinExpediente = structuredClone(ANUNCIOS).map((a: any) => (
      a.ref === 'SEM-030' ? { ...a, estadoFotos: 'verificado' } : a
    ))
    const resultado = analizarSemilla({ VENDEDORES, ANUNCIOS: anunciosSinExpediente })
    expect(resultado.errores.join(' ')).toMatch(/SEM-030: estadoFotos=verificado sin dossierFotos/)
  })
})
