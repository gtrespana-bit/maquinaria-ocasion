# Dossiers fotográficos de la semilla

Esta carpeta es la entrada operativa para sustituir, anuncio a anuncio, las
111 rutas heredadas que están en cuarentena. No contiene todavía ningún
dossier aprobado.

## Flujo

1. Copia `manifiesto.ejemplo.json` a `manifiesto.json` (fichero local, no
   versionado).
2. Coloca los originales autorizados en
   `semilla-fotos/originales/<SEM-XXX>/` o usa URLs HTTPS directas a los
   originales cuando la licencia lo permita.
3. Completa procedencia, autor, licencia, evidencia de derechos, contexto,
   fecha de sesión y checklist de revisión. La `ref` debe existir en
   `src/lib/semilla-datos.js` y las vistas deben cubrir exactamente las que
   exige `vistasRequeridas()` en `src/lib/semilla-calidad.js`.
4. Concilia antes el anuncio con la unidad fotografiada: modelo/variante,
   año, horas, accesorios, defectos, precio, vendedor y ciudad. Nunca se
   adapta la lectura de las fotos al texto previo.
5. Valida sin escribir nada:

   ```bash
   npm run fotos:importar -- --manifiesto=semilla-fotos/manifiesto.json --seco
   ```

6. Importa y genera los derivados:

   ```bash
   npm run fotos:importar -- --manifiesto=semilla-fotos/manifiesto.json --confirmar-conciliacion
   ```

El importador:

- exige originales de al menos 1408×768 tras aplicar la orientación EXIF;
- genera JPG y WebP de 1408×768 en `public/images/anuncios/`;
- calcula SHA-256 del original y del WebP publicado;
- escribe el expediente en `src/lib/semilla-dossiers.json`;
- se niega a sobrescribir un dossier o un derivado sin `--forzar`;
- no cambia título, ficha, precio ni `decision`: esas conciliaciones siguen
  siendo editoriales y deben revisarse en el mismo cambio.

Para auditar lo ya registrado:

```bash
npm run fotos:verificar
```

## Reglas que no se negocian

- Todas las fotos deben ser de la misma unidad y de una sesión compatible.
- Nada de IA, renders, packshots, catálogo del fabricante, collages ni
  material promocional.
- Nada de fotos de otro vendedor con su logo, matrícula comercial o marca de
  agua.
- Una foto pública no equivale a una foto reutilizable: debe constar la
  licencia abierta exacta o un permiso/contrato trazable.
- Si la licencia es CC BY o CC BY-SA, el expediente debe llevar atribución,
  descripción de cambios y URL pública bajo `/creditos-fotograficos`. Esa
  página debe existir antes de aprobar el primer dossier CC BY/CC BY-SA.
- El número de serie completo se conserva en el expediente interno; en la
  galería pública basta una placa que acredite modelo sin exponer más datos
  de los necesarios.

El detalle de la búsqueda abierta y de los rechazos está en
`docs/SEMILLA-FOTOS-CANDIDATAS-2026-10-26.csv`; el encargo de producción y las
plantillas de contacto están en
`docs/SEMILLA-FOTOS-BRIEF-ENCARGO-2026-10-26.md`.
