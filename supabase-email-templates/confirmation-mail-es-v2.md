# Template Emails de Confirmación — MaquinariaOcasión (variante)
## (Copiar en Supabase Dashboard → Authentication → Email Templates → Confirmation Mail)

> Esta es una variante del template `confirmation-mail-es.md` con el mismo contenido y la instrucción de URLs: copiar el HTML también aquí si usas la v2.

---

Ver `confirmation-mail-es.md` para el HTML definitivo de MaquinariaOcasión (grafito/verde/naranja, soporte@maquinaria.click, maquinaria.click).

URLs en Supabase → Authentication → URLs:
- **Site URL:** `https://maquinaria.click`
- **Redirect URL:** `https://maquinaria.click/confirm`

Flujo: registro → email → `{{ .ConfirmationURL }}` → `/api/confirm-email?token=…` → `/confirm` → login.
