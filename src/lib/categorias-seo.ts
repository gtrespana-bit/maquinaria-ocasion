/**
 * SEO de categorías de MaquinariaOcasión: 3 categorías (familias) y 12
 * subcategorías de maquinaria. Los slugs coinciden con categorias.ts y las
 * claves de `CATEGORIAS_SEO` con las claves de `categoriasData`.
 */

import { categoriasData, familiaDeSub } from './categorias'

export type CategoriaSEO = {
  slug: string
  nombre: string
  icono: string
  titulo: string
  descripcion: string
  introduccion: string[]
  terminos: string[]
  faq: { pregunta: string; respuesta: string }[]
}

const CAT_AGRICOLA = categoriasData.agricola
const CAT_OBRA = categoriasData.obra
const CAT_HERRAMIENTAS = categoriasData.herramientas

export const CATEGORIAS_SEO: Record<string, CategoriaSEO> = {
  agricola: {
    slug: 'agricola',
    nombre: CAT_AGRICOLA.label,
    icono: CAT_AGRICOLA.icon,
    titulo: 'Maquinaria agrícola de ocasión: tractores, cosechadoras y aperos',
    descripcion: 'Tractores, cosechadoras, empacadoras, aperos y maquinaria ganadera de segunda mano en España. John Deere, Kubota, New Holland, Case IH, Massey Ferguson, Fendt, Claas y más. Publica gratis tu anuncio.',
    introduccion: [
      'MaquinariaOcasión reúne tractores, cosechadoras, aperos de labranza y siembra, pulverizadoras y equipos de ganadería de segunda mano de toda España: desde tractores compactos de finca hasta cosechadoras de grano y empacadoras de gran capacidad.',
      'Cada anuncio muestra la ficha técnica completa: año, horas de uso, potencia en CV, combustible, tracción, enganche de tres puntos, toma de fuerza (PTO), peso y estado. Puedes filtrar por marca, horas máximas y año mínimo, y contactar con el vendedor o publicar gratis tu máquina.',
    ],
    terminos: [
      'maquinaria agrícola de ocasión',
      'tractor de segunda mano',
      'cosechadora usada',
      'aperos agrícolas de ocasión',
      'tractor John Deere ocasión',
      'maquinaria ganadera segunda mano',
      'aperos y labranza baratos',
    ],
    faq: [
      {
        pregunta: '¿Qué maquinaria agrícola se puede comprar de segunda mano?',
        respuesta: 'Tractores, cosechadoras y empacadoras, arados, sembradoras, cultivadores, pulverizadoras, segadoras y aperos de forraje, así como equipos de ganadería como ordenadoras, comederos y vallados. En MaquinariaOcasión encontrarás anuncios de todo el mercado español con ficha técnica por horas de uso y potencia.',
      },
      {
        pregunta: '¿Qué horas de uso es "mucho" en un tractor de ocasión?',
        respuesta: 'Depende del motor y del mantenimiento, pero como referencia: un tractor de finca con 5.000–8.000 horas suele estar en la mitad de su vida útil si se ha cuidado; por encima de 12.000–15.000 horas conviene revisar motor, transmisión y hidráulica antes de comprar. Revisa siempre el libro de mantenimiento y pide las horas registradas en el diagnóstico.',
      },
      {
        pregunta: '¿Qué papeles necesita la compra de una máquina agrícola?',
        respuesta: 'Factura o albarán de compra, ficha técnica o declaración CE del fabricante, y en tractores, la tarjeta de inscripción (ficha ITV) en vigor. Verifica que el número de bastidor o el número de serie coincidan con la documentación, y comprueba la declaración CE si la máquina es de importación.',
      },
    ],
  },
  obra: {
    slug: 'obra',
    nombre: CAT_OBRA.label,
    icono: CAT_OBRA.icon,
    titulo: 'Maquinaria de obra de ocasión: excavadoras, cargadoras y plataformas',
    descripcion: 'Excavadoras, retroexcavadoras, cargadoras, minicargadoras, rodillos, dumperes y plataformas elevadoras de segunda mano en España. Caterpillar, Komatsu, Volvo, JCB, Bobcat, Manitou, Genie y más. Publica gratis.',
    introduccion: [
      'MaquinariaOcasión conecta a profesionales con excavadoras sobre oruga y ruedas, retroexcavadoras, cargadoras frontales, minicargadoras, compactadores, dumperes y plataformas elevadoras de ocasión de todas las provincias.',
      'Las fichas incluyen tracción, capacidad de carga, medidas de transporte, profundidad de excavación o altura de trabajo, horas de uso y estado, con filtros por marca y rango de año para encontrar la máquina exacta que necesita tu obra.',
    ],
    terminos: [
      'maquinaria de obra de segunda mano',
      'excavadora de ocasión',
      'cargadora usada precio',
      'plataforma elevadora de ocasión',
      'minicargadora Bobcat segunda mano',
      'rodillo compactador usado',
      'maquinaria obra España',
    ],
    faq: [
      {
        pregunta: '¿Qué maquinaria de obra se encuentra en ocasión?',
        respuesta: 'Excavadoras y retroexcavadoras, cargadoras frontales y minicargadoras (skid-steer), telecargadores, rodillos y apisonadores, dumperes articulados, y plataformas elevadoras (telescópicas, articuladas y verticales). Los anuncios indican horas de uso, estado y documentación (factura, libro y declaración CE).',
      },
      {
        pregunta: '¿Cómo sé si una excavadora de segunda mano está bien?',
        respuesta: 'Revisa las horas certificadas, el desgaste de cadenas y platillas, fugas de cilindros y mangueras, el estado del volquete y la articulación, y pide historial de mantenimiento. Una prueba de excavación con el motor frío y caliente revela problemas de bombeo que no se ven en fotos.',
      },
      {
        pregunta: '¿Necesito permiso especial para mover maquinaria por carretera?',
        respuesta: 'Depende del peso y de las medidas: maquinaria sobre oruga o de gran envergadura requiere transporte especial (permiso de escolta según normativa vigente). Las medidas de transporte indicadas en el anuncio ayudan a valorar si cabe en tu remolque o necesitas empresa de transporte dedicada.',
      },
    ],
  },
  herramientas: {
    slug: 'herramientas',
    nombre: CAT_HERRAMIENTAS.label,
    icono: CAT_HERRAMIENTAS.icon,
    titulo: 'Herramienta eléctrica, generadores y sierras de ocasión en España',
    descripcion: 'Taladros, amoladoras, motosierras, generadores, compresores y equipos de soldadura de segunda mano: Makita, Bosch, DeWalt, Milwaukee, Stihl, Husqvarna, Himoinsa, Cummins y más. Compra y publica gratis.',
    introduccion: [
      'MaquinariaOcasión reúne herramienta eléctrica profesional, generadores y grupos electrógenos, compresores, equipos de soldadura, motosierras y maquinaria de poda de segunda mano, con marcas líderes como Makita, Bosch, DeWalt, Milwaukee, Festool, Stihl, Husqvarna, Himoinsa o Atlas Copco.',
      'Cada ficha detalla potencia en watios, tensión de alimentación (230 V, 400 V, bivolt o batería), si incluye batería o accesorios, estado y documentación, con filtros por rango de potencia para encontrar la herramienta exacta que necesitas.',
    ],
    terminos: [
      'herramienta eléctrica de ocasión',
      'generador de segunda mano',
      'motosierra usada barata',
      'compresor de aire ocasión',
      'taladro profesional segunda mano',
      'soldadora de ocasión',
      'maquinaria de jardinería usada',
    ],
    faq: [
      {
        pregunta: '¿Qué conviene revisar antes de comprar herramienta de segunda mano?',
        respuesta: 'El estado de carbones y rodamientos, la línea de corte en amoladoras y motosierras, la holgura del husillo en taladros y la prueba real bajo carga. En generadores y compresores, comprueba horas de funcionamiento, fugas y tensión estable. Un anuncio con factura y libro de instrucciones da más garantía.',
      },
      {
        pregunta: '¿Merece la pena un generador eléctrico de ocasión?',
        respuesta: 'Sí si necesitas respaldo en obra o eventos: un grupo electrónico bien mantenido dura miles de horas. Compara la potencia útil en VA/W con tu consumo total, el tipo de combustible (diésel, gasolina o gas) y las horas registradas; prioriza modelos con mantenimiento documentado como Himoinsa, Cummins, Perkins o Honda.',
      },
    ],
  },
}

export const CATEGORIAS_SEO_LIST = Object.values(CATEGORIAS_SEO)

export function getCategoriaSEO(slug: string): CategoriaSEO | undefined {
  return CATEGORIAS_SEO[slug]
}

/**
 * SEO de subcategorías: se usa en las landings programáticas
 * /{provincia}/{subslug} y en los textos del catálogo.
 */
export type SubcategoriaSEO = {
  slug: string
  nombre: string
  icono: string
  categoria: string // etiqueta de subcategoría tal como se guarda en la BD
  titulo: string
  descripcion: string
  terminos: string[]
  /** Párrafos de introducción de la landing /{provincia}/{slug}. */
  introduccion: string[]
  /** FAQ visible + FAQPage schema en la landing. */
  faq: { pregunta: string; respuesta: string }[]
}

type InfoSubSEO = {
  descripcion: string
  terminos: string[]
  introduccion: string[]
  faq: { pregunta: string; respuesta: string }[]
}

const SUBS_BASE: Record<string, InfoSubSEO> = {
  // ── Agrícola ──
  'tractores': {
    descripcion: 'Tractores de ocasión de todas las potencias: John Deere, Kubota, New Holland, Case IH, Massey Ferguson, Fendt, Deutz-Fahr, Valtra y Claas. Segunda mano con horas de uso y ficha técnica.',
    terminos: ['tractor de segunda mano', 'tractor John Deere ocasión', 'tractor Kubota usado', 'tractor de ocasión barato', 'tractor agrícola 4x4'],
    introduccion: [
      'El tractor es el corazón de la explotación agrícola y el producto con más salida en el mercado de ocasión: desde compactos de finca de 30 CV hasta modelos de 200 CV con transmisión CVT. Las marcas con más anuncios en España son John Deere, Kubota, New Holland, Case IH, Massey Ferguson, Fendt y Deutz-Fahr.',
      'Al elegir un tractor de segunda mano, contrasta las horas registradas con el estado del motor y de la hidráulica, comprueba que el embrague y la toma de fuerza respondan, y revisa el enganche de tres puntos y el sistema de dirección. La ficha de cada anuncio recoge horas, CV, tracción y año para comparar sin sorpresas.',
    ],
    faq: [
      {
        pregunta: '¿Cuántas horas puede durar un tractor de ocasión?',
        respuesta: 'Un tractor bien mantenido supera con frecuencia las 8.000–12.000 horas de trabajo antes de una reparación mayor de motor o transmisión. Clave: historial de cambios de aceite, estado del turbo (si lleva) y desgaste de embrague. Contrasta el horómetro con el historial de mantenimiento.',
      },
      {
        pregunta: '¿Qué potencia (CV) necesito para mi finca?',
        respuesta: 'Como orientación: labores ligeras y huerto con 30–60 CV; arado y trabajos exigentes en medianas de 80–120 CV; grandes extensiones y aperos pesados, 140–200 CV. Unos pocos CV de más no gastan mucho combustible, pero un tractor infradimensionado fuerza motor y embrague.',
      },
    ],
  },
  'cosechadoras': {
    descripcion: 'Cosechadoras y empacadoras de ocasión: Claas Lexion, New Holland CR/CX, Case IH Axial-Flow, John Deere S Series, Krone y McHale. Segunda mano con ancho de corte y horas.',
    terminos: ['cosechadora de segunda mano', 'cosechadora Claas ocasión', 'empacadora usada', 'ensiladora de ocasión', 'cosechadora de grano barata'],
    introduccion: [
      'Las cosechadoras de grano y las empacadoras son las máquinas de mayor inversión de la campaña: comprarlas de ocasión con horas certificadas y mantenimiento documentado ahorra una fracción significativa del precio de nuevo. Claas, New Holland, Case IH, John Deere y Fendt dominan el mercado español.',
      'Antes de comprar, revisa el sistema de trilla y cribado (golpeando en seco), el estado de la barredora y de la mesa de corte, y las horas totales y de rotor. En empacadoras (Krone, McHale, New Holland), verifica la aguja, los tensores y el sistema de enlazado.',
    ],
    faq: [
      {
        pregunta: '¿Qué revisar en una cosechadora de segunda mano?',
        respuesta: 'Horas totales y de rotor o cilindro, desgaste de cribos y martillos de trilla, estado de barredora y mesa, fugas hidráulicas y condición de cadenas y rodamientos. Una prueba corta en cultivo revela pérdidas en el rastrojo y problemas de alimentación que no se ven parada.',
      },
      {
        pregunta: '¿Cosechadora o empacadora: cuál me conviene?',
        respuesta: 'Si produces grano (trigo, cebada, maíz para grano), la cosechadora. Si el destino es forraje o heno paja, la empacadora (fardos grandes o circulares) o la ensiladora (maíz). Elige según el cultivo y la superficie: en fincas pequeñas a menudo sale mejor contratar el servicio a un profesional.',
      },
    ],
  },
  'maquinaria-agricola': {
    descripcion: 'Aperos y maquinaria agrícola de ocasión: arados, sembradoras, cultivadores, pulverizadoras, rastrillos y segadoras. Kuhn, Amazone, Lemken, Kverneland, Vaderstad y Horsch de segunda mano.',
    terminos: ['arado de ocasión', 'sembradora de segunda mano', 'pulverizadora usada', 'cultivador agrícola ocasión', 'aperos y labranza baratos'],
    introduccion: [
      'Los aperos determinan la rentabilidad de cada campaña: arados de discos y de vertederas, sembradoras de precisión, cultivadores, pulverizadoras de barra y segadoras de disco encuentran aquí de segunda mano a precios muy por debajo del equipo nuevo.',
      'Filtra por ancho de trabajo y tipo para encontrar la máquina que encaja con tu tractor, y comprueba el estado de discos, cuchillas y boquillas, así como los puntos de enganche y la toma de fuerza. Las fichas indican ancho, tipo y estado en todos los anuncios.',
    ],
    faq: [
      {
        pregunta: '¿Qué ancho de trabajo necesito para mi tractor?',
        respuesta: 'Regla práctica: el ancho del apero debe aprovechar el potencia disponible sin forzar el motor. Un tractor de 100 CV mueve cómodamente arados de 3–4 discos y cultivadores de 3–4 m; revisa la ficha técnica de tu tractor (CV y potencia a la toma de fuerza) y compárala con el ancho de trabajo del anuncio.',
      },
      {
        pregunta: '¿Cómo sé si una pulverizadora está en buen estado?',
        respuesta: 'Revisa boquillas (cambiarlas por juego nuevo es barato), filtro, manómetro y ausencia de fugas en el circuito. Los tanques deben estar limpios y sin residuos cristalizados de producto; pide prueba de presión y comprueba que la barra se despliega y pliega sin holguras.',
      },
    ],
  },
  'ganaderia': {
    descripcion: 'Equipos de ganadería de ocasión: ordenadoras, provocadoras de celo, comederos, bebederos y vallados. Lely, DeLaval, GEA y BouMatic de segunda mano en España.',
    terminos: ['ordenadora de ocasión', 'equipos de ganadería segunda mano', 'provocadora de celo usada', 'comedero ganadero ocasión', 'maquinaria de explotación lechera'],
    introduccion: [
      'La maquinaria de ganadería de ocasión cubre desde sistemas de ordeño (pulsoriles, tetinas, enfriadores) hasta equipos de cría y recinto: comederos, bebederos, vallados portátiles y provocadoras de celo. Lely, DeLaval, GEA y BouMatic son las marcas de referencia en ordeño.',
      'En equipos de ordeño usados, el estado de las gomas (tetinas y pulsoriles) y la higiene del circuito marcan la diferencia. Pide las horas de trabajo, el historial de sustitución de desgastes y, si es posible, una prueba de funcionamiento conectada a la sala de ordeño.',
    ],
    faq: [
      {
        pregunta: '¿Cuánto dura una ordenadora de segunda mano?',
        respuesta: 'Los pulsoriles y tetinas se cambian por desgaste (cada 1.500–2.500 horas según fabricante); el resto del equipo (bomba, enfriador, sala) puede durar años si se mantiene. Verifica el número de puestos, el año y el estado de las gomas antes de decidir.',
      },
      {
        pregunta: '¿Qué necesito para montar un corral o vallado nuevo?',
        respuesta: 'Comederos y bebederos con capacidad para el número de cabezas, vallados resistentes al ambiente (galvanizado o inoxidable) y, si manejas semovientes, portones con cierre seguro. En el catálogo puedes filtrar por tipo de equipo y número de puestos para dimensionar la compra.',
      },
    ],
  },

  // ── Obra ──
  'excavadoras': {
    descripcion: 'Excavadoras y retroexcavadoras de ocasión: Caterpillar, Komatsu, Volvo, Hitachi, JCB, Case, Hyundai, Doosan, Sany y Bobcat. Sobre oruga y ruedas, de 1,5 a 35 toneladas.',
    terminos: ['excavadora de segunda mano', 'excavadora Caterpillar ocasión', 'retroexcavadora usada', 'miniestacadora de ocasión', 'excavadora sobre oruga barata'],
    introduccion: [
      'La excavadora es la máquina más demandada de la obra: sobre oruga para trabajo pesado y continuo, sobre ruedas para desplazamientos rápidos, y miniexcavadoras de 1,5–6 t para urbanización y jardinería. Caterpillar, Komatsu, Volvo, Hitachi, JCB, Case y las marcas chinas Sany y XCMG tienen fuerte presencia en el mercado español.',
      'Cada anuncio detalla peso operativo, profundidad de excavación, tracción y horas de uso. Antes de comprar, revisa cadenas o neumáticos, holguras en boom, stick y cuchara, estado de cilindros y fugas, y pide un historial de mantenimiento verificable.',
    ],
    faq: [
      {
        pregunta: '¿Qué tamaño de excavadora necesito?',
        respuesta: 'Miniexcavadora de 1,5–3,5 t para zonas estrechas, jardinería y canalizaciones; de 6–13 t para urbanización y cimentaciones; de 20–35 t para movimiento de tierras y demolición ligera. El peso y las medidas de transporte del anuncio te dicen si puedes moverla con tu remolque.',
      },
      {
        pregunta: '¿Sobre oruga o sobre ruedas?',
        respuesta: 'La oruga da estabilidad, flotación y durabilidad en terreno blando o en continuo; las ruedas permiten desplazarse por vía pública entre puntos de obra sin camión. Para trabajo mixto urbano, hay retroexcavadoras y modelos sobre ruedas de 8–15 t que son el término medio habitual.',
      },
    ],
  },
  'cargadoras': {
    descripcion: 'Cargadoras frontales, minicargadoras y telecargadores de ocasión: Bobcat, Manitou, Merlo, JCB, Caterpillar, Volvo y New Holland. Skid-steer, frontales y telescópicas de segunda mano.',
    terminos: ['cargadora de segunda mano', 'minicargadora Bobcat ocasión', 'telecargador usado', 'cargadora frontal barata', 'cargadora sobre ruedas ocasión'],
    introduccion: [
      'Las cargadoras resuelven la manipulación de material en obra, granja y reciclaje: minicargadoras sobre ruedas (skid-steer) de Bobcat y Wacker Neuson, cargadoras frontales articuladas de Volvo, Caterpillar y New Holland, y telecargadores de Manitou, Merlo y JCB.',
      'Filtra por capacidad de carga y tracción; en las fichas encontrarás además las medidas de transporte y la altura de vuelco, decisivas para saber si la máquina entra en tu plataforma o remolque.',
    ],
    faq: [
      {
        pregunta: '¿Cuánta carga puede mover una minicargadora?',
        respuesta: 'Las skid-steer compactas (Bobcat S60/S70) mueven en torno a 700–1.000 kg; las medianas, 1.200–1.500 kg; y las frontales articuladas grandes superan los 3 t. Comprueba la capacidad junto con el peso operativo: la estabilidad depende del contraequilibrio, no solo del cifrado de fábrica.',
      },
      {
        pregunta: '¿Qué es un telecargador y cuándo merece la pena?',
        respuesta: 'Un telecargador (Manitou, Merlo, JCB Loadall) combina brazo telescópico y ruedas: carga paquetes a altura, alza palés en andamio y llega donde la cargadora frontal no. Es la máquina más versátil si trabajas en obra y almacenamiento; comprueba el estado del cilindro del brazo y de las horquillas.',
      },
    ],
  },
  'compactacion': {
    descripcion: 'Rodillos, apisonadores y dumperes de ocasión: Bomag, Hamm, Dynapac, Caterpillar, Sakai, Thwaites, Bell y Astra. Compactación de suelo y transporte en obra de segunda mano.',
    terminos: ['rodillo compactador ocasión', 'apisonador de segunda mano', 'dumper articulado usado', 'pavibradora ocasión', 'compactadora de suelo barata'],
    introduccion: [
      'La compactación garantiza la estabilidad de terraplenes, firmes y zanjas: rodillos tandem y articulados, apisonadores de placa, miniapisonadores y, para el transporte en obra, dumperes articulados de Thwaites, Bell, Astra o Perlini.',
      'Filtra por tipo y capacidad de carga. En rodillos y apisonadores, revisa el sistema vibratorio (frecuencia y amplitud), el estado del tambor y las juntas; en dumperes, ejes, articulación y estado de la caja.',
    ],
    faq: [
      {
        pregunta: '¿Qué rodillo elijo para compactar?',
        respuesta: 'Tandem doble tambor para firmes asfálticos y rodaduras; articulado para terraplenes y suelos cohesivos; apisonador de plataforma para zanjas y espacios reducidos. El peso estático y la fuerza centrífuga del anuncio indican la potencia de compactación real.',
      },
      {
        pregunta: '¿Cuánta carga mueve un dumper articulado?',
        respuesta: 'Los dumperes pequeños mueven 2–3 t; los medianos de cantera, 25–30 t; los grandes de mina superan las 40 t. Para urbanización, lo habitual son unidades de 6–10 t que caben en plataforma sin permisos especiales de movimiento.',
      },
    ],
  },
  'plataformas': {
    descripcion: 'Plataformas elevadoras de ocasión: telescópicas, articuladas (tijera) y verticales. Genie, JCB, Manitou, Haulotte, Skyjack, Niftylift, Snorkel y Magni de segunda mano.',
    terminos: ['plataforma elevadora ocasión', 'plataforma de tijera usada', 'manlift de segunda mano', 'plataforma telescópica barata', 'plataforma elevadora obra'],
    introduccion: [
      'Las plataformas elevadoras hacen segura el trabajo en altura: verticales (o elevadores de tijera) para superficies llanas y altura moderada, articuladas para saltar obstáculos, y telescópicas o rotativas para gran altura y alcance en fachada.',
      'En la ficha encontrarás altura máxima de trabajo, capacidad de la cesta (kg) y medidas de transporte, además de horas de uso. Revisa el estado de neumáticos, estabilizadores, cestas de seguridad y la batería o motor de propulsión antes de comprar.',
    ],
    faq: [
      {
        pregunta: '¿Qué tipo de plataforma necesito para mi trabajo?',
        respuesta: 'En planta y almacén, una vertical de tijera; en fachada y jardinería con obstáculos, una articulada de brazo; en grandes alturas y terreno irregular, una telescópica o de ruedas con estabilizadores. Comprueba en el anuncio la altura de trabajo y la capacidad de la cesta frente al peso de personas y material.',
      },
      {
        pregunta: '¿Se puede trabajar con plataforma elevadora sin formación?',
        respuesta: 'No: la normativa exige formación específica del operador y uso del arnés con línea de vida en altura. Antes de comprar, verifica el mantenimiento anual y las certificaciones de la máquina (las plataformas requieren revisiones periódicas) y ten en cuenta el coste de esa revisión anual.',
      },
    ],
  },

  // ── Herramientas ──
  'herramienta-electrica': {
    descripcion: 'Herramienta eléctrica y sin cable de ocasión: taladros, amoladoras, sierras circulares, rotomartillos y sistemas de baterías. Makita, Bosch, DeWalt, Milwaukee, Metabo, Festool y Hilti.',
    terminos: ['taladro de ocasión', 'amoladora usada barata', 'herramienta Makita segunda mano', 'sierra circular ocasión', 'herramienta profesional de segunda mano'],
    introduccion: [
      'El mercado de herramienta eléctrica de ocasión es amplio: taladros y rotomartillos, amoladoras angulares, sierras circulares y de calar, fresadoras y sistemas de baterías de 18 V y 54 V. Makita, Bosch Professional, DeWalt, Milwaukee, Metabo, Festool y Hilti lideran el segmento profesional.',
      'Cada anuncio indica potencia (W), tensión (230 V, 400 V, bivolt o batería) y si incluye batería y maletín. Para uso intensivo, prioriza modelos profesionales con historial de uso moderado y prueba la máquina antes de pagar.',
    ],
    faq: [
      {
        pregunta: '¿Merece la pena comprar herramienta profesional de segunda mano?',
        respuesta: 'Sí, si el uso anterior fue industrial pero cuidado: los motores brushless (sin escobillas) duran mucho y las baterías Li-Ion se degradan con el tiempo. Comprueba la holgura del rodamiento, la línea de corte y pide prueba bajo carga; evita herramientas con carcasa astillada por caídas.',
      },
      {
        pregunta: '¿Qué diferencia hay entre 230 V y 400 V en herramienta?',
        respuesta: 'Los 230 V (monofásico) cubren taladros, amoladoras y sierras de taller; los 400 V (trifásico) son necesarios en máquinas industriales de mayor potencia (sierras de banco, compresores grandes, soldadoras industriales). Comprueba la tensión de tu instalación antes de comprar un anuncio de 400 V.',
      },
    ],
  },
  'motores': {
    descripcion: 'Generadores, grupos electrógenos, compresores y equipos de soldadura de ocasión: Himoinsa, Cummins, Perkins, Honda, Pramac, Atlas Copco, Kaeser, Lincoln Electric, ESAB y Fronius.',
    terminos: ['generador de segunda mano', 'grupo electrógeno ocasión', 'compresor de aire usado', 'soldadora de ocasión barata', 'motor industrial de segunda mano'],
    introduccion: [
      'Los motores y equipos auxiliares de ocasión abarcan generadores portátiles e industriales, compresores de tornillo y alternativos, y máquinas de soldadura MIG/MAG, TIG y MMA. Himoinsa, Cummins, Perkins, Honda y Pramac en generación; Atlas Copco y Kaeser en compresión.',
      'Filtra por potencia (W), tensión y tipo. En anuncios con horas de uso registradas, un grupo electrógeno bien documentado puede funcionar miles de horas más; revisa filtros, niveles y prueba de carga antes de comprar.',
    ],
    faq: [
      {
        pregunta: '¿Qué potencia de generador necesito?',
        respuesta: 'Suma la potencia de todos los equipos simultáneos y añade margen (20–30 %). Un compresor pequeño y unas luces pueden ir en un generador inverter de 2–3 kVA; para obra, soldadora y herramienta de 400 V, se necesitan 10–30 kVA. La ficha indica vatios útiles y tensión de salida.',
      },
      {
        pregunta: '¿Cuántas horas dura un compresor de aire industrial?',
        respuesta: 'Un compresor de tornillo bien mantenido supera las 20.000–40.000 horas con cambios regulares de aceite y separadores; los alternativos de pistón duran menos horas pero son más sencillos. Pide las horas registradas, estado del aceite y prueba de presión máxima.',
      },
    ],
  },
  'sierra-poda': {
    descripcion: 'Motosierras, desbrozadoras, podadoras y cortacésped de ocasión: Stihl, Husqvarna, Oleo-Mac, Shindaiwa, RedMax, Makita y Bosch. Maquinaria de jardinería de segunda mano.',
    terminos: ['motosierra de ocasión', 'desbrozadora usada barata', 'Stihl de segunda mano', 'cortacésped ocasión', 'maquinaria de jardinería usada'],
    introduccion: [
      'La sierra y poda son la entrada al mercado de maquinaria forestal y de jardinería: motosierras de cadena, desbrozadoras de hilo y de disco, podadoras de setos y cortacésped. Stihl, Husqvarna, Oleo-Mac, Shindaiwa y RedMax son las marcas más buscadas de ocasión.',
      'Cada ficha indica tipo, potencia o cilindrada, tensión o combustible y largo de espada cuando aplica. Revisa la holgura de la cadena, el estado del piñón, la compresión del motor y, en eléctricas, el estado del cable y los carbones antes de comprar.',
    ],
    faq: [
      {
        pregunta: '¿Qué revisar en una motosierra de segunda mano?',
        respuesta: 'Prueba de arranque en frío y en caliente, compresión, estado de espada y cadena (si la espada está mellada, es señal de uso duro), embrague y freno de cadena. En motosierras profesionales, pide las horas si el modelo las registra en el cuentahoras.',
      },
      {
        pregunta: '¿Motosierra de gasolina o eléctrica/batería?',
        respuesta: 'Gasolina para trabajo forestal, poda alejada de la red y potencia máxima; eléctrica 230 V o de batería para jardín urbano, menos ruido y mantenimiento. En catálogo puedes filtrar por combustible (Gasolina, Eléctrico o Batería) y por potencia en watios.',
      },
    ],
  },
  'taller-manual': {
    descripcion: 'Herramienta manual y de taller de ocasión: juegos de llaves, destornilladores, alicates, gatas y equipos de elevación. Knipex, Wera, Bahco, Facom, Gedore, Hazet, Stanley y Würth.',
    terminos: ['juego de llaves de ocasión', 'herramienta manual segunda mano', 'alicates Knipex ocasión', 'utillaje de taller barato', 'gata hidráulica usada'],
    introduccion: [
      'La herramienta manual conserva su valor mejor que casi cualquier otra: juegos de llaves combinadas, alicates de presión, destornilladores de precisión, gatas y botellas hidráulicas o multímetros. Knipex, Wera, Bahco, Facom, Gedore, Hazet y Würth son sinónimo de durabilidad.',
      'En el catálogo puedes filtrar por tipo (juego de llaves, destornilladores, alicates, elevación) y estado. Para herramienta de precisión, inspecciona desgastes en las mordazas y juegos en las puntas; en gatas, prueba la elevación completa y revisa juntas y aceite.',
    ],
    faq: [
      {
        pregunta: '¿Cómo saber si una herramienta manual es de calidad?',
        respuesta: 'Fíjate en el material (acero cromo-vanadio o acero S2), la marca del fabricante y el acabado de las mordazas. Marcas como Knipex, Bahco, Facom o Wera publican garantía de por vida en muchos productos; una herramienta usada sin deformaciones sigue siendo una buena compra.',
      },
      {
        pregunta: '¿Qué necesito para un taller de bricolaje básico?',
        respuesta: 'Un juego de llaves combinadas y tubo (8–19 mm), alicates universal y de presión, destornilladores de estrella y plano, un juego de llaves allen y torx, martillo, cinta métrica y, si hay que elevar, una gata de 2 toneladas con soporte. Añade multímetro si tocas la eléctrica del coche.',
      },
    ],
  },
}

const TODAS_SUBS = Object.values(categoriasData).flatMap(cat => cat.subs)

const SUBS: SubcategoriaSEO[] = TODAS_SUBS.map((sub) => {
  const info = SUBS_BASE[sub.slug]
  if (!info) {
    throw new Error(`categorias-seo: falta el SEO de la subcategoría "${sub.slug}"`)
  }
  return {
    slug: sub.slug,
    nombre: sub.label,
    icono: sub.icon,
    categoria: sub.label,
    titulo: `${sub.label} de ocasión en España`,
    descripcion: info.descripcion,
    terminos: info.terminos,
    introduccion: info.introduccion,
    faq: info.faq,
  }
})

export const SUBCATEGORIAS_SEO: SubcategoriaSEO[] = SUBS

export const SUBCATEGORIAS_SEO_MAP: Record<string, SubcategoriaSEO> = Object.fromEntries(
  SUBS.map(s => [s.slug, s])
)

export function getSubcategoriaSEO(slug: string): SubcategoriaSEO | undefined {
  return SUBCATEGORIAS_SEO_MAP[slug]
}

// ── Landings nacionales indexables de /categoria/[slug] ──────────────────
//
// Las búsquedas con volumen del sector son por subcategoría («tractores de
// segunda mano», «excavadoras de ocasión»…), no por familia. Hasta ahora
// solo las 3 familias tenían landing y las subcategorías vivían como filtro
// del catálogo (?subcategoria=), que canonicaliza a /catalogo: para Google
// no existía ninguna página de tractores/excavadoras/etc. Esta lista une
// familias y subcategorías en las landings que sirve /categoria/[slug],
// reutilizando el contenido editorial ya existente de cada subcategoría.

export type LandingCategoriaSEO = CategoriaSEO & {
  tipo: 'familia' | 'subcategoria'
  /** Slug de la familia (clave de categoriasData); en familias, el propio slug. */
  familiaSlug: string
  familiaNombre: string
  /** Etiqueta guardada en productos.subcategoria; null en landings de familia. */
  subEtiqueta: string | null
}

function landingDeFamilia(cat: CategoriaSEO): LandingCategoriaSEO {
  return { ...cat, tipo: 'familia', familiaSlug: cat.slug, familiaNombre: cat.nombre, subEtiqueta: null }
}

function landingDeSub(sub: SubcategoriaSEO): LandingCategoriaSEO | undefined {
  const familia = familiaDeSub(sub.slug)
  if (!familia) return undefined
  return {
    slug: sub.slug,
    nombre: sub.nombre,
    icono: sub.icono,
    titulo: sub.titulo,
    descripcion: sub.descripcion,
    introduccion: sub.introduccion,
    terminos: sub.terminos,
    faq: sub.faq,
    tipo: 'subcategoria',
    familiaSlug: familia.key,
    familiaNombre: familia.label,
    subEtiqueta: sub.categoria,
  }
}

export const LANDINGS_CATEGORIA_LIST: LandingCategoriaSEO[] = [
  ...CATEGORIAS_SEO_LIST.map(landingDeFamilia),
  ...SUBS.map(landingDeSub).filter((l): l is LandingCategoriaSEO => Boolean(l)),
]

const LANDINGS_CATEGORIA_MAP: Record<string, LandingCategoriaSEO> = Object.fromEntries(
  LANDINGS_CATEGORIA_LIST.map((l) => [l.slug, l]),
)

/** Landing nacional (familia o subcategoría) por slug de /categoria/[slug]. */
export function getLandingCategoriaSEO(slug: string): LandingCategoriaSEO | undefined {
  return LANDINGS_CATEGORIA_MAP[slug]
}
