# Plantillas de email de Supabase Auth — MaquinariaOcasión

Plantillas profesionales en español para **todos** los correos que puede
enviar Supabase Auth (confirmación, recuperación, cambio de correo y
notificaciones de seguridad), con el mismo diseño que los correos
transaccionales de la app (`src/lib/email-layout.ts`): cabecera grafito
`#0F172A` con logo, línea naranja `#EA580C`, botón grafito y pie con
`soporte@maquinaria.click`.

## Fuente única: `generar.mjs`

Los `.html` y `asuntos.json` son **generados**: no se editan a mano.

```bash
node supabase-email-templates/generar.mjs
```

Si cambia el layout de la app (`email-layout.ts`), se replica el cambio en
`generar.mjs`, se regenera y se vuelve a aplicar.

## Cómo aplicarlas (5 minutos, una sola vez)

La API de gestión de Supabase que usa nuestro conector **no admite editar
plantillas** (solo lectura + ajustes básicos), así que se pegan en el
dashboard:

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard/project/uwstkzojtwresdxhfext/auth/templates)
   → **Authentication → Emails**.
2. Para cada plantilla de la tabla: abre la plantilla, pega el **Asunto** en
   el campo *Subject* y el contenido completo del **fichero HTML** en el
   campo del cuerpo, y guarda (*Save changes*).

| Plantilla en Supabase | Fichero | Asunto |
|---|---|---|
| Confirm signup | `confirmation.html` | Confirma tu cuenta en MaquinariaOcasión |
| Reset Password | `recovery.html` | Restablece tu contraseña de MaquinariaOcasión |
| Magic Link | `magic-link.html` | Tu enlace de acceso a MaquinariaOcasión |
| Invite User | `invite.html` | Te han invitado a MaquinariaOcasión |
| Change Email Address | `email-change.html` | Confirma tu nueva dirección de correo |
| Reauthentication | `reauthentication.html` | {{ .Token }} es tu código de verificación de MaquinariaOcasión |
| Password Changed (notificación) | `password-changed.html` | Tu contraseña de MaquinariaOcasión ha cambiado |
| Email Address Changed (notificación) | `email-changed.html` | La dirección de correo de tu cuenta ha cambiado |
| Phone Number Changed (notificación) | `phone-changed.html` | El teléfono de tu cuenta ha cambiado |
| Multi-Factor Authentication Enrolled | `mfa-factor-enrolled.html` | Nuevo método de verificación añadido a tu cuenta |
| Multi-Factor Authentication Unenrolled | `mfa-factor-unenrolled.html` | Se ha eliminado un método de verificación de tu cuenta |
| Identity Linked | `identity-linked.html` | Nuevo método de acceso vinculado a tu cuenta |
| Identity Unlinked | `identity-unlinked.html` | Se ha eliminado un método de acceso de tu cuenta |

3. En la misma pantalla, **activa las notificaciones de seguridad**
   *Password Changed* y *Email Address Changed* (su interruptor): sin
   interruptor no se envían aunque la plantilla esté rellena. Las demás
   notificaciones quedan desactivadas (no usamos teléfono, MFA ni accesos
   sociales); sus plantillas quedan igualmente aplicadas por si se activan
   en el futuro.

## Estado de configuración (2026-10-26)

- **Site URL:** `https://maquinaria.click` ✅
- **Redirect URLs:** aplicadas vía API ✅
  `https://maquinaria.click/confirm`, `/en/confirm`,
  `/reset-password`, `/en/reset-password`
  (sin esto, GoTrue ignora el `redirectTo` de la app y los enlaces de
  correo aterrizarían en la home).
- **Plantillas:** preparadas en esta carpeta; **pendientes de pegar** en el
  dashboard (pasos de arriba). Hasta entonces, cualquier correo que salga
  por Supabase usa el texto por defecto en inglés.
- **SMTP de Supabase:** sin configurar (servicio compartido de Supabase,
  límite ~2 correos/hora y remitente genérico). La app **no depende** de él:
  confirmación y recuperación se envían por el canal propio
  (`src/lib/confirmacion-email.ts`, `src/lib/recuperacion-email.ts`) y estas
  plantillas actúan como red de seguridad (reenvíos por el fallback,
  acciones desde el dashboard, futuros flujos).

  Para dejarlo redondo tras el lanzamiento: configurar el SMTP de Resend en
  *Project Settings → Authentication → SMTP* (`smtp.resend.com`, usuario
  `resend`, contraseña = API key de Resend, remitente
  `MaquinariaOcasión <noreply@maquinaria.click>`), que requiere el dominio
  `maquinaria.click` verificado en Resend, y subir entonces el límite de
  envío de Auth.

## Flujo de los enlaces

`{{ .ConfirmationURL }}` → Supabase verifica el token → redirige a
`https://maquinaria.click/confirm` (confirmación) o
`/reset-password` (recuperación), coherente con las Redirect URLs de arriba.
Los enlaces y códigos caducan en **1 hora** (`mailer_otp_exp: 3600`).
