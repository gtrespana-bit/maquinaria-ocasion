# Template Emails de Confirmación — MaquinariaOcasión (variante)
## (Copiar en Supabase Dashboard → Authentication → Email Templates → Confirmation Mail)

> Esta es una variante del template `confirmation-mail-es.md` con el mismo contenido y la instrucción de URLs: copiar el HTML también aquí si usas la v2.

---

Ver `confirmation-mail-es.md` para el HTML definitivo de MaquinariaOcasión (grafito/verde/naranja, soporte@maquinariaocasion.online, maquinariaocasion.online).

URLs en Supabase → Authentication → URLs:
- **Site URL:** `https://maquinariaocasion.online`
- **Redirect URL:** `https://maquinariaocasion.online/confirm`

Flujo: registro → email → `{{ .ConfirmationURL }}` → `/api/confirm-email?token=…` → `/confirm` → login.
