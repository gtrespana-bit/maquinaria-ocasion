/**
 * Catálogo maestro de marcas y modelos de MAQUINARIA de MaquinariaOcasión.
 *
 * Tres familias, doce subcategorías. Este archivo tiene el "qué" — para el
 * "dónde se muestra" (portada, panel de filtros, ficha SEO) ver los registradores
 * `categorias.ts` (campos) y `filtros-tecnicos.ts` (filtros del catálogo).
 *
 * La configuración de cada subcategoría combina un slug semántico con la lista
 * de marcas y modelos que sirve como select del formulario de publicación y como
 * filtro de catálogo:
 *
 *  - Elige una subcategoría → `getSubConfig()` devuelve su objeto `CatSub`.
 *  - El select de Marca usa `sub.marcas` (procesado con `agruparPorFabricante()`).
 *  - `modelosDeSubcategoria()` da el modelo para el campo opcional "Modelo".
 *
 * Nota: los modelos que solo son relevantes para un ámbito concreto (el Fastrac
 * es un tractor de alta velocidad, una retroexcavadora va en excavadoras…)
 * aparecen con `aptoPara` restringido y un `nota` para la UI. Un mismo modelo
 * puede ser apto para varias subcategorías (el telecargador Merlo sirve en
 * cargadoras y plataformas).
 *
 * La sección "Marcas y modelos" de la portada usa estas mismas entradas para
 * no desincronizarse (ver `agruparPorFabricante` en portada `page.tsx`).
 */

export const SUBCATEGORIAS_SLUG = [
  'tractores', 'cosechadoras', 'maquinaria-agricola', 'ganaderia',
  'excavadoras', 'cargadoras', 'compactacion', 'plataformas',
  'herramienta-electrica', 'motores', 'sierra-poda', 'taller-manual',
] as const

export type SubSlug = (typeof SUBCATEGORIAS_SLUG)[number]

export interface MarcaModelo {
  fabricante: string
  modelo: string
  /** Nombre completo mostrado en la UI (usualmente `fabricante modelo`). */
  valor: string
  /** Subcategorías (slugs de `SUBCATEGORIAS_SLUG`) para las que aplica esta marca/modelo. */
  aptoPara: SubSlug[]
  /** Detalle contextual mostrado junto al nombre (ej. "Para jardinera compacta"). */
  nota?: string
}

export const MARCAS_MODELOS: MarcaModelo[] = [
  // ───────────────────────────── Tractores ─────────────────────────────
  { fabricante: 'John Deere', modelo: '5M', valor: 'John Deere 5M', aptoPara: ['tractores'], nota: 'Tractor polivalente medio' },
  { fabricante: 'John Deere', modelo: '6M', valor: 'John Deere 6M', aptoPara: ['tractores'], nota: 'Tractor multipropósito' },
  { fabricante: 'John Deere', modelo: '6R', valor: 'John Deere 6R', aptoPara: ['tractores'], nota: 'Alta potencia y confort' },
  { fabricante: 'John Deere', modelo: '', valor: 'John Deere', aptoPara: ['tractores'], nota: 'Gama general' },
  { fabricante: 'Kubota', modelo: 'M7', valor: 'Kubota M7', aptoPara: ['tractores'], nota: 'Gran tractor Kubota' },
  { fabricante: 'Kubota', modelo: 'M6', valor: 'Kubota M6', aptoPara: ['tractores'], nota: 'Tractor medio-alto' },
  { fabricante: 'Kubota', modelo: 'M5', valor: 'Kubota M5', aptoPara: ['tractores'], nota: 'Tractor medio' },
  { fabricante: 'Kubota', modelo: 'L1', valor: 'Kubota L1', aptoPara: ['tractores'], nota: 'Tractor compacto' },
  { fabricante: 'New Holland', modelo: 'T5', valor: 'New Holland T5', aptoPara: ['tractores'], nota: 'Tractor medio' },
  { fabricante: 'New Holland', modelo: 'T6', valor: 'New Holland T6', aptoPara: ['tractores'], nota: 'Multipropósito' },
  { fabricante: 'New Holland', modelo: 'T7', valor: 'New Holland T7', aptoPara: ['tractores'], nota: 'Alta potencia' },
  { fabricante: 'New Holland', modelo: 'Workmaster', valor: 'New Holland Workmaster', aptoPara: ['tractores'], nota: 'Relación prestaciones-precio' },
  { fabricante: 'Case IH', modelo: 'Puma', valor: 'Case IH Puma', aptoPara: ['tractores'], nota: 'Tractor versátil' },
  { fabricante: 'Case IH', modelo: 'Maxxum', valor: 'Case IH Maxxum', aptoPara: ['tractores'], nota: 'Tractor medio-alto' },
  { fabricante: 'Case IH', modelo: 'Farmall', valor: 'Case IH Farmall', aptoPara: ['tractores'], nota: 'Tractor de labores ligeras' },
  { fabricante: 'Massey Ferguson', modelo: '5700', valor: 'Massey Ferguson 5700', aptoPara: ['tractores'], nota: 'Tractor medio' },
  { fabricante: 'Massey Ferguson', modelo: '6700', valor: 'Massey Ferguson 6700', aptoPara: ['tractores'], nota: 'Multipropósito' },
  { fabricante: 'Massey Ferguson', modelo: '7700', valor: 'Massey Ferguson 7700', aptoPara: ['tractores'], nota: 'Alta potencia' },
  { fabricante: 'Fendt', modelo: '300 Vario', valor: 'Fendt 300 Vario', aptoPara: ['tractores'], nota: 'CVT compacto' },
  { fabricante: 'Fendt', modelo: '500 Vario', valor: 'Fendt 500 Vario', aptoPara: ['tractores'], nota: 'Multipropósito CVT' },
  { fabricante: 'Fendt', modelo: '700 Vario', valor: 'Fendt 700 Vario', aptoPara: ['tractores'], nota: 'Alta gama' },
  { fabricante: 'Deutz-Fahr', modelo: 'Agrotron 4', valor: 'Deutz-Fahr Agrotron 4', aptoPara: ['tractores'], nota: 'Tractor medio' },
  { fabricante: 'Deutz-Fahr', modelo: 'Agrotron 6', valor: 'Deutz-Fahr Agrotron 6', aptoPara: ['tractores'], nota: 'Multipropósito' },
  { fabricante: 'Same', modelo: 'Dorado', valor: 'Same Dorado', aptoPara: ['tractores'], nota: 'Tractor polivalente' },
  { fabricante: 'Same', modelo: 'Virtuoso', valor: 'Same Virtuoso', aptoPara: ['tractores'], nota: 'Alta gama Same' },
  { fabricante: 'Lamborghini', modelo: 'Racer', valor: 'Lamborghini Racer', aptoPara: ['tractores'], nota: 'Tractor de labra' },
  { fabricante: 'Lamborghini', modelo: 'Nitro', valor: 'Lamborghini Nitro', aptoPara: ['tractores'], nota: 'Multipropósito' },
  { fabricante: 'Valtra', modelo: 'N Series', valor: 'Valtra N Series', aptoPara: ['tractores'], nota: 'Tractor nórdico' },
  { fabricante: 'Valtra', modelo: 'T Series', valor: 'Valtra T Series', aptoPara: ['tractores'], nota: 'Alta potencia nórdica' },
  { fabricante: 'Claas', modelo: 'Elios', valor: 'Claas Elios', aptoPara: ['tractores'], nota: 'Tractor de invernadero y labores ligeras' },
  { fabricante: 'Claas', modelo: 'Axos', valor: 'Claas Axos', aptoPara: ['tractores'], nota: 'Tractor medio' },
  { fabricante: 'Zetor', modelo: 'Proxima', valor: 'Zetor Proxima', aptoPara: ['tractores'], nota: 'Tractor robusto' },
  { fabricante: 'Belarus', modelo: '800.1', valor: 'Belarus 800.1', aptoPara: ['tractores'], nota: 'Tractor simple y durable' },
  { fabricante: 'McCormick', modelo: 'X7', valor: 'McCormick X7', aptoPara: ['tractores'], nota: 'Alta potencia' },
  { fabricante: 'JCB', modelo: 'Fastrac', valor: 'JCB Fastrac', aptoPara: ['tractores'], nota: 'Tractor de alta velocidad' },

  // ─────────────────────── Cosechadoras y empacadoras ───────────────────────
  { fabricante: 'New Holland', modelo: 'CR', valor: 'New Holland CR', aptoPara: ['cosechadoras'], nota: 'Cosechadora axial de alto rendimiento' },
  { fabricante: 'New Holland', modelo: 'CX', valor: 'New Holland CX', aptoPara: ['cosechadoras'], nota: 'Cosechadora de grano' },
  { fabricante: 'Case IH', modelo: 'Axial-Flow', valor: 'Case IH Axial-Flow', aptoPara: ['cosechadoras'], nota: 'Cosechadora de flujo axial' },
  { fabricante: 'John Deere', modelo: 'S Series', valor: 'John Deere S Series', aptoPara: ['cosechadoras'], nota: 'Cosechadora de alto volumen' },
  { fabricante: 'John Deere', modelo: 'W Series', valor: 'John Deere W Series', aptoPara: ['cosechadoras'], nota: 'Cosechadora de trigo' },
  { fabricante: 'Claas', modelo: 'Lexion', valor: 'Claas Lexion', aptoPara: ['cosechadoras'], nota: 'Cosechadora premium' },
  { fabricante: 'Claas', modelo: 'Tucano', valor: 'Claas Tucano', aptoPara: ['cosechadoras'], nota: 'Cosechadora media' },
  { fabricante: 'Claas', modelo: 'Jaguar', valor: 'Claas Jaguar', aptoPara: ['cosechadoras'], nota: 'Ensiladora (maíz y forraje)' },
  { fabricante: 'Krone', modelo: 'BiG Pack', valor: 'Krone BiG Pack', aptoPara: ['cosechadoras'], nota: 'Empacadora de fardos grandes' },
  { fabricante: 'Krone', modelo: 'BiG Baler', valor: 'Krone BiG Baler', aptoPara: ['cosechadoras'], nota: 'Empacadora circular' },
  { fabricante: 'McHale', modelo: 'Fusion', valor: 'McHale Fusion', aptoPara: ['cosechadoras'], nota: 'Empacadora combinada' },
  { fabricante: 'Fendt', modelo: 'C Series', valor: 'Fendt C Series', aptoPara: ['cosechadoras'], nota: 'Cosechadora de maíz' },

  // ─────────────────────── Maquinaria agrícola auxiliar ───────────────────────
  { fabricante: 'Kuhn', modelo: '', valor: 'Kuhn', aptoPara: ['maquinaria-agricola', 'ganaderia'], nota: 'Aperos y alimentación animal' },
  { fabricante: 'Amazone', modelo: '', valor: 'Amazone', aptoPara: ['maquinaria-agricola'], nota: 'Sembradoras y fertilizadoras' },
  { fabricante: 'Lemken', modelo: '', valor: 'Lemken', aptoPara: ['maquinaria-agricola'], nota: 'Arados y labranza' },
  { fabricante: 'Kverneland', modelo: '', valor: 'Kverneland', aptoPara: ['maquinaria-agricola'], nota: 'Arados y siembra' },
  { fabricante: 'Vaderstad', modelo: 'Rapid', valor: 'Vaderstad Rapid', aptoPara: ['maquinaria-agricola'], nota: 'Sembradora de precisión' },
  { fabricante: 'Horsch', modelo: '', valor: 'Horsch', aptoPara: ['maquinaria-agricola'], nota: 'Siembra y pulverización' },
  { fabricante: 'Grimme', modelo: '', valor: 'Grimme', aptoPara: ['maquinaria-agricola'], nota: 'Máquinas para patata y remolacha' },
  { fabricante: 'Pöttinger', modelo: '', valor: 'Pöttinger', aptoPara: ['maquinaria-agricola'], nota: 'Segadoras y aperos de forraje' },
  { fabricante: 'Fella', modelo: '', valor: 'Fella', aptoPara: ['maquinaria-agricola'], nota: 'Segadoras y henificadores' },
  { fabricante: 'Hardi', modelo: '', valor: 'Hardi', aptoPara: ['maquinaria-agricola'], nota: 'Pulverizadoras' },
  { fabricante: 'Berthoud', modelo: '', valor: 'Berthoud', aptoPara: ['maquinaria-agricola'], nota: 'Pulverizadoras de barra' },

  // ─────────────────────────── Ganadería ───────────────────────────
  { fabricante: 'Lely', modelo: '', valor: 'Lely', aptoPara: ['ganaderia'], nota: 'Ordeño automático y robótica' },
  { fabricante: 'DeLaval', modelo: '', valor: 'DeLaval', aptoPara: ['ganaderia'], nota: 'Ordeño y enfriado de leche' },
  { fabricante: 'GEA', modelo: '', valor: 'GEA', aptoPara: ['ganaderia'], nota: 'Ordenadoras y gestión de rebaño' },
  { fabricante: 'BouMatic', modelo: '', valor: 'BouMatic', aptoPara: ['ganaderia'], nota: 'Equipos de ordeño' },
  { fabricante: 'Kerbl', modelo: '', valor: 'Kerbl', aptoPara: ['ganaderia'], nota: 'Comederos, bebederos y vallados' },

  // ─────────────────────────── Excavadoras ───────────────────────────
  { fabricante: 'Caterpillar', modelo: '320', valor: 'Caterpillar 320', aptoPara: ['excavadoras'], nota: 'Excavadora de oruga 20 t' },
  { fabricante: 'Caterpillar', modelo: '330', valor: 'Caterpillar 330', aptoPara: ['excavadoras'], nota: 'Excavadora de oruga 30 t' },
  { fabricante: 'Caterpillar', modelo: '305', valor: 'Caterpillar 305', aptoPara: ['excavadoras'], nota: 'Miniestacadora' },
  { fabricante: 'Komatsu', modelo: 'PC210', valor: 'Komatsu PC210', aptoPara: ['excavadoras'], nota: 'Excavadora 20 t' },
  { fabricante: 'Komatsu', modelo: 'PC138', valor: 'Komatsu PC138', aptoPara: ['excavadoras'], nota: 'Excavadora 13 t' },
  { fabricante: 'Volvo', modelo: 'EC210', valor: 'Volvo EC210', aptoPara: ['excavadoras'], nota: 'Excavadora 20 t' },
  { fabricante: 'Volvo', modelo: 'EC140', valor: 'Volvo EC140', aptoPara: ['excavadoras'], nota: 'Excavadora 14 t' },
  { fabricante: 'Hitachi', modelo: 'ZX200', valor: 'Hitachi ZX200', aptoPara: ['excavadoras'], nota: 'Excavadora 20 t' },
  { fabricante: 'Hitachi', modelo: 'ZX135', valor: 'Hitachi ZX135', aptoPara: ['excavadoras'], nota: 'Excavadora 13 t' },
  { fabricante: 'JCB', modelo: 'JS220', valor: 'JCB JS220', aptoPara: ['excavadoras'], nota: 'Excavadora 22 t' },
  { fabricante: 'JCB', modelo: 'JS145', valor: 'JCB JS145', aptoPara: ['excavadoras'], nota: 'Excavadora 14 t' },
  { fabricante: 'Case', modelo: 'CX210', valor: 'Case CX210', aptoPara: ['excavadoras'], nota: 'Excavadora 21 t' },
  { fabricante: 'Case', modelo: 'CX130', valor: 'Case CX130', aptoPara: ['excavadoras'], nota: 'Excavadora 13 t' },
  { fabricante: 'Case', modelo: '580 Super N', valor: 'Case 580 Super N', aptoPara: ['excavadoras'], nota: 'Retroexcavadora sobre ruedas' },
  { fabricante: 'Hyundai', modelo: 'R215', valor: 'Hyundai R215', aptoPara: ['excavadoras'], nota: 'Excavadora 21 t' },
  { fabricante: 'Hyundai', modelo: 'R140', valor: 'Hyundai R140', aptoPara: ['excavadoras'], nota: 'Excavadora 14 t' },
  { fabricante: 'Doosan', modelo: 'DX225', valor: 'Doosan DX225', aptoPara: ['excavadoras'], nota: 'Excavadora 22 t' },
  { fabricante: 'Doosan', modelo: 'DX140', valor: 'Doosan DX140', aptoPara: ['excavadoras'], nota: 'Excavadora 14 t' },
  { fabricante: 'Sany', modelo: 'SY215', valor: 'Sany SY215', aptoPara: ['excavadoras'], nota: 'Excavadora 21 t' },
  { fabricante: 'Sany', modelo: 'SY135', valor: 'Sany SY135', aptoPara: ['excavadoras'], nota: 'Excavadora 13 t' },
  { fabricante: 'XCMG', modelo: 'XE215', valor: 'XCMG XE215', aptoPara: ['excavadoras'], nota: 'Excavadora 21 t' },
  { fabricante: 'XCMG', modelo: 'XE150', valor: 'XCMG XE150', aptoPara: ['excavadoras'], nota: 'Excavadora 15 t' },
  { fabricante: 'Liebherr', modelo: 'R926', valor: 'Liebherr R926', aptoPara: ['excavadoras'], nota: 'Excavadora 26 t' },
  { fabricante: 'Liebherr', modelo: 'R944', valor: 'Liebherr R944', aptoPara: ['excavadoras'], nota: 'Excavadora 44 t' },
  { fabricante: 'Kobelco', modelo: 'SK210', valor: 'Kobelco SK210', aptoPara: ['excavadoras'], nota: 'Excavadora 21 t' },
  { fabricante: 'Kobelco', modelo: 'SK130', valor: 'Kobelco SK130', aptoPara: ['excavadoras'], nota: 'Excavadora 13 t' },
  { fabricante: 'Bobcat', modelo: 'E80', valor: 'Bobcat E80', aptoPara: ['excavadoras'], nota: 'Miniestacadora 8 t' },
  { fabricante: 'Bobcat', modelo: 'E50', valor: 'Bobcat E50', aptoPara: ['excavadoras'], nota: 'Miniestacadora 5 t' },
  { fabricante: 'Takeuchi', modelo: 'TB240', valor: 'Takeuchi TB240', aptoPara: ['excavadoras'], nota: 'Miniestacadora compacta' },
  { fabricante: 'Yanmar', modelo: 'ViO55', valor: 'Yanmar ViO55', aptoPara: ['excavadoras'], nota: 'Miniestacadora de oruga' },
  { fabricante: 'Wacker Neuson', modelo: 'EZ50', valor: 'Wacker Neuson EZ50', aptoPara: ['excavadoras'], nota: 'Miniestacadora' },

  // ─────────────────────────── Cargadoras ───────────────────────────
  { fabricante: 'Bobcat', modelo: 'S70', valor: 'Bobcat S70', aptoPara: ['cargadoras'], nota: 'Minicargadora de ruedas' },
  { fabricante: 'Bobcat', modelo: 'S64', valor: 'Bobcat S64', aptoPara: ['cargadoras'], nota: 'Minicargadora compacta' },
  { fabricante: 'Bobcat', modelo: 'A70', valor: 'Bobcat A70', aptoPara: ['cargadoras'], nota: 'Minicargadora artículada' },
  { fabricante: 'Manitou', modelo: 'M540', valor: 'Manitou M540', aptoPara: ['cargadoras'], nota: 'Telecargador sobre ruedas' },
  { fabricante: 'Manitou', modelo: 'MT 1335', valor: 'Manitou MT 1335', aptoPara: ['cargadoras'], nota: 'Telecargador compacto' },
  { fabricante: 'Merlo', modelo: '', valor: 'Merlo', aptoPara: ['cargadoras', 'plataformas'], nota: 'Telecargadores y plataformas' },
  { fabricante: 'JCB', modelo: '411', valor: 'JCB 411', aptoPara: ['cargadoras'], nota: 'Cargadora frontal sobre ruedas' },
  { fabricante: 'JCB', modelo: '540-170', valor: 'JCB 540-170', aptoPara: ['cargadoras', 'plataformas'], nota: 'Telecargador telescópico' },
  { fabricante: 'Caterpillar', modelo: '950', valor: 'Caterpillar 950', aptoPara: ['cargadoras'], nota: 'Cargadora frontal' },
  { fabricante: 'Caterpillar', modelo: '906', valor: 'Caterpillar 906', aptoPara: ['cargadoras'], nota: 'Cargadora compacta' },
  { fabricante: 'Volvo', modelo: 'L60', valor: 'Volvo L60', aptoPara: ['cargadoras'], nota: 'Cargadora artículada' },
  { fabricante: 'Volvo', modelo: 'L25', valor: 'Volvo L25', aptoPara: ['cargadoras'], nota: 'Cargadora compacta' },
  { fabricante: 'New Holland', modelo: 'L220', valor: 'New Holland L220', aptoPara: ['cargadoras'], nota: 'Telecargador' },
  { fabricante: 'New Holland', modelo: 'W170', valor: 'New Holland W170', aptoPara: ['cargadoras'], nota: 'Cargadora sobre ruedas' },
  { fabricante: 'Schäffer', modelo: '', valor: 'Schäffer', aptoPara: ['cargadoras'], nota: 'Cargadoras compactas' },
  { fabricante: 'Weidemann', modelo: '', valor: 'Weidemann', aptoPara: ['cargadoras'], nota: 'Minicargadoras articuladas' },
  { fabricante: 'Avant', modelo: '', valor: 'Avant', aptoPara: ['cargadoras'], nota: 'Cargadoras multifunción compactas' },
  { fabricante: 'Takeuchi', modelo: 'TL10', valor: 'Takeuchi TL10', aptoPara: ['cargadoras'], nota: 'Cargadora compacta' },

  // ──────────────────── Compactación y dumperes ────────────────────
  { fabricante: 'Bomag', modelo: 'BW120', valor: 'Bomag BW120', aptoPara: ['compactacion'], nota: 'Rodillo compactador' },
  { fabricante: 'Bomag', modelo: 'BW212', valor: 'Bomag BW212', aptoPara: ['compactacion'], nota: 'Rodillo de doble tambor' },
  { fabricante: 'Hamm', modelo: 'HD12', valor: 'Hamm HD12', aptoPara: ['compactacion'], nota: 'Rodillo articulado' },
  { fabricante: 'Hamm', modelo: 'HD 14', valor: 'Hamm HD 14', aptoPara: ['compactacion'], nota: 'Rodillo tandem' },
  { fabricante: 'Dynapac', modelo: 'F141', valor: 'Dynapac F141', aptoPara: ['compactacion'], nota: 'Pavibradora' },
  { fabricante: 'Dynapac', modelo: 'CA250', valor: 'Dynapac CA250', aptoPara: ['compactacion'], nota: 'Rodillo compactador' },
  { fabricante: 'Caterpillar', modelo: 'CB2', valor: 'Caterpillar CB2', aptoPara: ['compactacion'], nota: 'Compactador de tambor vibratorio' },
  { fabricante: 'Caterpillar', modelo: 'CP56', valor: 'Caterpillar CP56', aptoPara: ['compactacion'], nota: 'Rodillo estático-vibratorio' },
  { fabricante: 'Sakai', modelo: 'SV500', valor: 'Sakai SV500', aptoPara: ['compactacion'], nota: 'Rodillo articulado' },
  { fabricante: 'Wacker Neuson', modelo: 'AP1850', valor: 'Wacker Neuson AP1850', aptoPara: ['compactacion'], nota: 'Apisonador vibratorio' },
  { fabricante: 'Thwaites', modelo: '', valor: 'Thwaites', aptoPara: ['compactacion'], nota: 'Dumperes articulados' },
  { fabricante: 'Bell', modelo: 'B25E', valor: 'Bell B25E', aptoPara: ['compactacion'], nota: 'Dumper articulado' },
  { fabricante: 'Astra', modelo: '', valor: 'Astra', aptoPara: ['compactacion'], nota: 'Dumperes para obra y cantera' },
  { fabricante: 'Perlini', modelo: '', valor: 'Perlini', aptoPara: ['compactacion'], nota: 'Dumperes articulados' },

  // ─────────────────────────── Plataformas elevadoras ───────────────────────────
  { fabricante: 'Genie', modelo: 'S-85', valor: 'Genie S-85', aptoPara: ['plataformas'], nota: 'Plataforma telescópica' },
  { fabricante: 'Genie', modelo: 'S-65', valor: 'Genie S-65', aptoPara: ['plataformas'], nota: 'Plataforma telescópica' },
  { fabricante: 'Genie', modelo: 'GS-2630', valor: 'Genie GS-2630', aptoPara: ['plataformas'], nota: 'Plataforma de tijera eléctrica' },
  { fabricante: 'Genie', modelo: 'Z-45', valor: 'Genie Z-45', aptoPara: ['plataformas'], nota: 'Plataforma articulada' },
  { fabricante: 'JCB', modelo: 'S1932', valor: 'JCB S1932', aptoPara: ['plataformas'], nota: 'Plataforma vertical móvil' },
  { fabricante: 'Manitou', modelo: '200 ATL', valor: 'Manitou 200 ATL', aptoPara: ['plataformas'], nota: 'Plataforma sobre telecargador' },
  { fabricante: 'Manitou', modelo: '110 ATJ', valor: 'Manitou 110 ATJ', aptoPara: ['plataformas'], nota: 'Plataforma articulada' },
  { fabricante: 'Haulotte', modelo: 'HA20 RTJ', valor: 'Haulotte HA20 RTJ', aptoPara: ['plataformas'], nota: 'Plataforma articulada todoterreno' },
  { fabricante: 'Skyjack', modelo: '', valor: 'Skyjack', aptoPara: ['plataformas'], nota: 'Plataformas de tijera y obra' },
  { fabricante: 'Niftylift', modelo: 'HR15', valor: 'Niftylift HR15', aptoPara: ['plataformas'], nota: 'Plataforma elevadora articulada' },
  { fabricante: 'Snorkel', modelo: 'TM12', valor: 'Snorkel TM12', aptoPara: ['plataformas'], nota: 'Plataforma telescópica autopropulsada' },
  { fabricante: 'Magni', modelo: '', valor: 'Magni', aptoPara: ['plataformas', 'cargadoras'], nota: 'Telecargadores rotativos' },

  // ─────────────────────── Herramienta eléctrica ───────────────────────
  { fabricante: 'Makita', modelo: '', valor: 'Makita', aptoPara: ['herramienta-electrica', 'sierra-poda'], nota: 'Herramienta inalámbrica y de jardín' },
  { fabricante: 'Bosch', modelo: '', valor: 'Bosch', aptoPara: ['herramienta-electrica', 'sierra-poda'], nota: 'Profesional y DIY' },
  { fabricante: 'DeWalt', modelo: '', valor: 'DeWalt', aptoPara: ['herramienta-electrica'], nota: 'Herramienta profesional 18V/54V' },
  { fabricante: 'Milwaukee', modelo: '', valor: 'Milwaukee', aptoPara: ['herramienta-electrica'], nota: 'M18 FUEL profesional' },
  { fabricante: 'Metabo', modelo: '', valor: 'Metabo', aptoPara: ['herramienta-electrica'], nota: 'Amoladoras y taladradoras' },
  { fabricante: 'Festool', modelo: '', valor: 'Festool', aptoPara: ['herramienta-electrica'], nota: 'Sistemas de lijado y corte' },
  { fabricante: 'Hilti', modelo: '', valor: 'Hilti', aptoPara: ['herramienta-electrica'], nota: 'Demolición y anclaje profesional' },
  { fabricante: 'Einhell', modelo: '', valor: 'Einhell', aptoPara: ['herramienta-electrica'], nota: 'Herramienta y jardinería' },
  { fabricante: 'Ryobi', modelo: '', valor: 'Ryobi', aptoPara: ['herramienta-electrica'], nota: 'Sistema de baterías ONE+' },
  { fabricante: 'HiKoki', modelo: '', valor: 'HiKoki', aptoPara: ['herramienta-electrica'], nota: 'Ex Hitachi Power Tools' },
  { fabricante: 'Flex', modelo: '', valor: 'Flex', aptoPara: ['herramienta-electrica'], nota: 'Amoladoras y pulidoras' },

  // ─────────────── Motores, generadores y compresores ───────────────
  { fabricante: 'Himoinsa', modelo: '', valor: 'Himoinsa', aptoPara: ['motores'], nota: 'Grupos electrógenos diésel y gas' },
  { fabricante: 'Cummins', modelo: '', valor: 'Cummins', aptoPara: ['motores'], nota: 'Motores y grupos electrógenos' },
  { fabricante: 'Perkins', modelo: '', valor: 'Perkins', aptoPara: ['motores'], nota: 'Motores diésel industriales' },
  { fabricante: 'Honda', modelo: '', valor: 'Honda', aptoPara: ['motores', 'sierra-poda'], nota: 'Generadores y maquinaria de jardín' },
  { fabricante: 'Pramac', modelo: '', valor: 'Pramac', aptoPara: ['motores'], nota: 'Grupos electrógenos' },
  { fabricante: 'Stephill', modelo: '', valor: 'Stephill', aptoPara: ['motores'], nota: 'Generadores portátiles' },
  { fabricante: 'Kipor', modelo: '', valor: 'Kipor', aptoPara: ['motores'], nota: 'Generadores inverter y abultados' },
  { fabricante: 'Denyo', modelo: '', valor: 'Denyo', aptoPara: ['motores'], nota: 'Grupos silenciados' },
  { fabricante: 'Atlas Copco', modelo: '', valor: 'Atlas Copco', aptoPara: ['motores'], nota: 'Compresores de tornillo' },
  { fabricante: 'Kaeser', modelo: '', valor: 'Kaeser', aptoPara: ['motores'], nota: 'Compresores industriales' },
  { fabricante: 'Ingersoll Rand', modelo: '', valor: 'Ingersoll Rand', aptoPara: ['motores'], nota: 'Compresores y herramienta' },
  { fabricante: 'Lincoln Electric', modelo: '', valor: 'Lincoln Electric', aptoPara: ['motores'], nota: 'Soldadura MIG/MAG y TIG' },
  { fabricante: 'ESAB', modelo: '', valor: 'ESAB', aptoPara: ['motores'], nota: 'Equipos de soldadura y corte' },
  { fabricante: 'Kemppi', modelo: '', valor: 'Kemppi', aptoPara: ['motores'], nota: 'Soldadura TIG/MMA' },
  { fabricante: 'Fronius', modelo: '', valor: 'Fronius', aptoPara: ['motores'], nota: 'Soldadura industrial' },

  // ─────────────────────── Sierra y poda ───────────────────────
  { fabricante: 'Stihl', modelo: '', valor: 'Stihl', aptoPara: ['sierra-poda'], nota: 'Motosierras, desbrozadoras y poda' },
  { fabricante: 'Husqvarna', modelo: '', valor: 'Husqvarna', aptoPara: ['sierra-poda'], nota: 'Motosierras y jardinería' },
  { fabricante: 'Oleo-Mac', modelo: '', valor: 'Oleo-Mac', aptoPara: ['sierra-poda'], nota: 'Motosierras y desbrozadoras' },
  { fabricante: 'Shindaiwa', modelo: '', valor: 'Shindaiwa', aptoPara: ['sierra-poda'], nota: 'Motosierras y podadoras' },
  { fabricante: 'RedMax', modelo: '', valor: 'RedMax', aptoPara: ['sierra-poda'], nota: 'Desbrozadoras y motosierras' },
  { fabricante: 'Cub Cadet', modelo: '', valor: 'Cub Cadet', aptoPara: ['sierra-poda'], nota: 'Cortacésped y jardinería' },

  // ─────────────────────── Taller manual ───────────────────────
  { fabricante: 'Knipex', modelo: '', valor: 'Knipex', aptoPara: ['taller-manual'], nota: 'Alicates y presión' },
  { fabricante: 'Wera', modelo: '', valor: 'Wera', aptoPara: ['taller-manual'], nota: 'Destornilladores y juego de llaves' },
  { fabricante: 'Bahco', modelo: '', valor: 'Bahco', aptoPara: ['taller-manual'], nota: 'Herramienta de corte y ajuste' },
  { fabricante: 'Facom', modelo: '', valor: 'Facom', aptoPara: ['taller-manual'], nota: 'Juegos de llaves y utillaje' },
  { fabricante: 'Gedore', modelo: '', valor: 'Gedore', aptoPara: ['taller-manual'], nota: 'Utillaje de precisión' },
  { fabricante: 'Hazet', modelo: '', valor: 'Hazet', aptoPara: ['taller-manual'], nota: 'Herramienta profesional' },
  { fabricante: 'Stanley', modelo: '', valor: 'Stanley', aptoPara: ['taller-manual'], nota: 'Medición y mano' },
  { fabricante: 'Würth', modelo: '', valor: 'Würth', aptoPara: ['taller-manual'], nota: 'Fijación y utillaje' },
  { fabricante: 'Jonnesway', modelo: '', valor: 'Jonnesway', aptoPara: ['taller-manual'], nota: 'Juegos de llaves y combinadas' },
]

// ─── Validación de integridad (se ejecuta al importar) ───
// - `aptoPara` DEBE usar slugs reales de `SUBCATEGORIAS_SLUG`.
// - `valor` debe ser único y no vacío (así no hay ambigüedad en el select de
//   Marca: dos modelos idénticos se agrupan en `agruparPorFabricante()`).
function validarCatalogoMarcas(): void {
  const slugsValidos = new Set<string>(SUBCATEGORIAS_SLUG)
  const vistos = new Set<string>()
  for (const m of MARCAS_MODELOS) {
    if (!m.valor || m.valor.trim() === '') {
      throw new Error(`MARCAS_MODELOS: entrada con "valor" vacío (${m.fabricante})`)
    }
    for (const sub of m.aptoPara) {
      if (!slugsValidos.has(sub)) {
        throw new Error(`MARCAS_MODELOS: "${m.valor}" apunta a subcategoría desconocida "${sub}"`)
      }
    }
    const clave = m.valor.trim().toLowerCase()
    if (vistos.has(clave)) {
      throw new Error(`MARCAS_MODELOS: valor duplicado "${m.valor}"`)
    }
    vistos.add(clave)
  }
}
validarCatalogoMarcas()

/** Devuelve los modelos aptos para la subcategoría dada. */
export function modelosDeSubcategoria(slug: SubSlug): MarcaModelo[] {
  return MARCAS_MODELOS.filter(m => m.aptoPara.includes(slug))
}

/** Busca una entrada por su valor canónico (el de `productos.marca`). */
export function modeloPorValor(valor: string): MarcaModelo | undefined {
  return MARCAS_MODELOS.find(m => m.valor === valor)
}

export interface GrupoFabricante {
  fabricante: string
  modelos: MarcaModelo[]
}

/**
 * Agrupa una lista de modelos por fabricante, ordenando alfabéticamente los
 * grupos (es-ES) y dentro de cada grupo por modelo. Es la base de los
 * <optgroup> de los selectores y de las tarjetas de la página /marcas.
 */
export function agruparPorFabricante(modelos: MarcaModelo[]): GrupoFabricante[] {
  const grupos = new Map<string, MarcaModelo[]>()
  for (const m of modelos) {
    const lista = grupos.get(m.fabricante)
    if (lista) lista.push(m)
    else grupos.set(m.fabricante, [m])
  }
  return [...grupos.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([fabricante, lista]) => ({
      fabricante,
      modelos: [...lista].sort((a, b) =>
        etiquetaModelo(a).localeCompare(etiquetaModelo(b), 'es')
      ),
    }))
}

/**
 * Slug de URL de un modelo, para /modelo/[slug]. Se deriva del valor canónico
 * (que es lo que está guardado en `productos.marca`), así que la URL y el
 * filtro del catálogo no pueden divergir.
 */
export function slugModelo(m: MarcaModelo): string {
  return m.valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Busca un modelo por su slug de URL. */
export function modeloPorSlug(slug: string): MarcaModelo | undefined {
  return MARCAS_MODELOS.find(m => slugModelo(m) === slug)
}

/** Slug de URL de un fabricante: 'John Deere' → 'john-deere'. */
export function slugFabricante(fabricante: string): string {
  return fabricante
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Busca un fabricante por su slug de URL. */
export function fabricantePorSlug(slug: string): string | undefined {
  return fabricantesUnicos(MARCAS_MODELOS).find(f => slugFabricante(f) === slug)
}

/** Modelos (entradas `MarcaModelo`) de un fabricante concreto. */
export function modelosDeFabricante(fabricante: string): MarcaModelo[] {
  return MARCAS_MODELOS.filter(m => m.fabricante === fabricante)
}

/** Etiqueta visible de un modelo dentro de su fabricante: '6M', 'PC210'… */
export function etiquetaModelo(m: MarcaModelo): string {
  return m.modelo || m.valor
}

/** Lista canónica plana (valores de `productos.marca`) sin duplicados. */
export function valoresUnicos(modelos: MarcaModelo[]): string[] {
  const vistos = new Set<string>()
  const valores: string[] = []
  for (const m of modelos) {
    if (!vistos.has(m.valor)) {
      vistos.add(m.valor)
      valores.push(m.valor)
    }
  }
  return valores
}

/** Fabricantes únicos de una lista de modelos, en orden alfabético es-ES. */
export function fabricantesUnicos(modelos: MarcaModelo[]): string[] {
  return agruparPorFabricante(modelos).map(g => g.fabricante)
}

/**
 * Resumen compacto para tarjetas: 'Caterpillar · Komatsu · Volvo +6'. Devuelve ''
 * si no hay modelos.
 */
export function resumenFabricantes(modelos: MarcaModelo[], max = 3): string {
  const fabs = fabricantesUnicos(modelos)
  if (fabs.length === 0) return ''
  const visibles = fabs.slice(0, max).join(' · ')
  return fabs.length > max ? `${visibles} +${fabs.length - max}` : visibles
}
