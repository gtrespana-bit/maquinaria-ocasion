/**
 * Generador de plantillas de email de Supabase Auth (GoTrue) — MaquinariaOcasión.
 *
 * Fuente única de verdad de los correos que envía Supabase (confirmación,
 * recuperación, cambio de email, notificaciones de seguridad…). Reutiliza el
 * mismo layout que los correos transaccionales de la app
 * (`src/lib/email-layout.ts`) para que cualquier correo que salga por el
 * fallback de Supabase se vea idéntico a los que envía la propia aplicación.
 *
 * Uso:  node supabase-email-templates/generar.mjs
 * Genera un .html por plantilla y `asuntos.json` con los asuntos, listos para
 * aplicar vía Management API (`mailer_templates_*` / `mailer_subjects_*`) o
 * pegando en Dashboard → Authentication → Emails.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))

const COLORS = {
  primary: '#0F172A',
  accent: '#EA580C',
  bg: '#F5F7FA',
  white: '#FFFFFF',
  dark: '#1E293B',
  gray: '#64748B',
  lightGray: '#E2E8F0',
  success: '#059669',
}
const SITE = 'https://maquinaria.click'
const LOGO = `${SITE}/logo-maquinariaocasion.png`
const CONTACT = 'soporte@maquinaria.click'

function layout({ titulo, preheader, cuerpo, ctaTexto, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="es" style="margin:0;padding:0">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${titulo} — MaquinariaOcasión</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};padding:24px 0">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <tr>
            <td align="center" style="background:${COLORS.primary};padding:32px 24px 28px">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:8px">
                    <a href="${SITE}" style="text-decoration:none">
                      <img src="${LOGO}" alt="MaquinariaOcasión" width="160" style="display:block;max-width:160px;height:auto;border:0">
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:20px;font-weight:700;color:${COLORS.white};letter-spacing:-0.3px">${titulo}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td height="3" style="background:${COLORS.accent}"></td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:15px;color:${COLORS.dark};line-height:1.65">
                    ${cuerpo}
                  </td>
                </tr>
              </table>
            </td>
          </tr>${
            ctaTexto && ctaUrl
              ? `
          <tr>
            <td align="left" style="padding:24px 28px 32px">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <th align="center" style="background:${COLORS.primary};border-radius:8px">
                    <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block;padding:14px 36px;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;color:${COLORS.white};text-decoration:none;letter-spacing:0.3px">
                      ${ctaTexto}
                    </a>
                  </th>
                </tr>
              </table>
            </td>
          </tr>`
              : `
          <tr><td style="padding-bottom:24px"></td></tr>`
          }
          <tr>
            <td style="border-top:1px solid ${COLORS.lightGray};padding:24px 28px;background:${COLORS.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:12px;color:${COLORS.gray};line-height:1.65">
                    <p style="margin:0 0 6px;font-weight:600;color:${COLORS.dark}">MaquinariaOcasión</p>
                    <p style="margin:0 0 6px">El marketplace español</p>
                    <p style="margin:0"><a href="mailto:${CONTACT}" style="color:${COLORS.primary};text-decoration:none">${CONTACT}</a></p>
                    <p style="margin:6px 0 0"><a href="${SITE}" style="color:${COLORS.primary};text-decoration:none">${SITE}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const enlaceAlternativo = (url) => `<p style="margin:0 0 8px;font-size:12px;color:#64748B">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
     <p style="margin:0 0 8px;font-size:12px;word-break:break-all"><a href="${url}" style="color:#0F172A">${url}</a></p>`

const notaSeguridad = (texto) =>
  `<p style="margin:20px 0 0;font-size:12px;color:#94A3B8">${texto}</p>`

const avisoNoFuiYo = `<p style="margin:0 0 20px">Si no has sido tú, escríbenos cuanto antes a <a href="mailto:${CONTACT}" style="color:#0F172A;font-weight:600">${CONTACT}</a> para que revisemos tu cuenta.</p>`

const CONFIRM = '{{ .ConfirmationURL }}'
const CADUCA_1H = 'El enlace caduca en 1 hora y solo puede utilizarse una vez.'

export const PLANTILLAS = [
  {
    archivo: 'confirmation.html',
    claveContenido: 'mailer_templates_confirmation_content',
    claveAsunto: 'mailer_subjects_confirmation',
    asunto: 'Confirma tu cuenta en MaquinariaOcasión',
    html: layout({
      titulo: 'Confirma tu cuenta',
      preheader: 'Confirma tu correo para activar tu cuenta en MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Gracias por registrarte en <strong>MaquinariaOcasión</strong>, el marketplace de maquinaria de ocasión en España. Solo falta un paso para activar tu cuenta: confirmar tu correo electrónico.</p>
     <p style="margin:0 0 20px">Con tu cuenta podrás publicar tu maquinaria gratis, seguir tus anuncios y contactar directamente con compradores y vendedores, sin intermediarios.</p>
     ${enlaceAlternativo(CONFIRM)}
     ${notaSeguridad(`¿No te has registrado en MaquinariaOcasión? Ignora este correo. ${CADUCA_1H}`)}`,
      ctaTexto: 'CONFIRMAR MI CUENTA',
      ctaUrl: CONFIRM,
    }),
  },
  {
    archivo: 'recovery.html',
    claveContenido: 'mailer_templates_recovery_content',
    claveAsunto: 'mailer_subjects_recovery',
    asunto: 'Restablece tu contraseña de MaquinariaOcasión',
    html: layout({
      titulo: 'Restablecer contraseña',
      preheader: 'Enlace para restablecer tu contraseña de MaquinariaOcasión. Caduca en 1 hora.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>MaquinariaOcasión</strong>. Pulsa el botón para elegir una contraseña nueva.</p>
     ${enlaceAlternativo(CONFIRM)}
     ${notaSeguridad(`¿No has solicitado este cambio? Ignora este correo: tu contraseña no se modificará. ${CADUCA_1H}`)}`,
      ctaTexto: 'RESTABLECER CONTRASEÑA',
      ctaUrl: CONFIRM,
    }),
  },
  {
    archivo: 'magic-link.html',
    claveContenido: 'mailer_templates_magic_link_content',
    claveAsunto: 'mailer_subjects_magic_link',
    asunto: 'Tu enlace de acceso a MaquinariaOcasión',
    html: layout({
      titulo: 'Accede a tu cuenta',
      preheader: 'Tu enlace de acceso a MaquinariaOcasión. Caduca en 1 hora.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Pulsa el botón para iniciar sesión en <strong>MaquinariaOcasión</strong> sin necesidad de contraseña.</p>
     ${enlaceAlternativo(CONFIRM)}
     ${notaSeguridad(`${CADUCA_1H} Si no has pedido este enlace, ignora este correo.`)}`,
      ctaTexto: 'INICIAR SESIÓN',
      ctaUrl: CONFIRM,
    }),
  },
  {
    archivo: 'invite.html',
    claveContenido: 'mailer_templates_invite_content',
    claveAsunto: 'mailer_subjects_invite',
    asunto: 'Te han invitado a MaquinariaOcasión',
    html: layout({
      titulo: 'Has recibido una invitación',
      preheader: 'Acepta tu invitación para crear tu cuenta en MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Te han invitado a crear una cuenta en <strong>MaquinariaOcasión</strong>, el marketplace de maquinaria agrícola, de construcción e industrial de ocasión en España. Acepta la invitación para empezar a comprar y vender maquinaria sin intermediarios.</p>
     ${enlaceAlternativo(CONFIRM)}
     ${notaSeguridad(`¿No esperabas esta invitación? Ignora este correo. ${CADUCA_1H}`)}`,
      ctaTexto: 'ACEPTAR INVITACIÓN',
      ctaUrl: CONFIRM,
    }),
  },
  {
    archivo: 'email-change.html',
    claveContenido: 'mailer_templates_email_change_content',
    claveAsunto: 'mailer_subjects_email_change',
    asunto: 'Confirma tu nueva dirección de correo',
    html: layout({
      titulo: 'Confirma tu nuevo correo',
      preheader: 'Confirma la nueva dirección de correo de tu cuenta de MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Has solicitado cambiar la dirección de correo de tu cuenta de <strong>MaquinariaOcasión</strong> por <strong>{{ .NewEmail }}</strong>. Confirma el cambio para seguir recibiendo avisos sobre tus anuncios, mensajes y la actividad de tu cuenta.</p>
     ${enlaceAlternativo(CONFIRM)}
     ${notaSeguridad(`¿No has solicitado este cambio? Ignora este correo: tu dirección actual no se modificará. ${CADUCA_1H}`)}`,
      ctaTexto: 'CONFIRMAR NUEVO CORREO',
      ctaUrl: CONFIRM,
    }),
  },
  {
    archivo: 'reauthentication.html',
    claveContenido: 'mailer_templates_reauthentication_content',
    claveAsunto: 'mailer_subjects_reauthentication',
    asunto: '{{ .Token }} es tu código de verificación de MaquinariaOcasión',
    html: layout({
      titulo: 'Código de verificación',
      preheader: 'Tu código de verificación de MaquinariaOcasión. Caduca en 1 hora.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Introduce este código en <strong>MaquinariaOcasión</strong> para confirmar que eres tú:</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;border:1px solid #E2E8F0;border-radius:10px;margin:8px 0"><tr><td align="center" style="padding:20px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#0F172A">{{ .Token }}</td></tr></table>
     ${notaSeguridad('El código caduca en 1 hora. No lo compartas con nadie: el equipo de MaquinariaOcasión nunca te lo pedirá. Si no has sido tú, ignora este correo y revisa la seguridad de tu cuenta.')}`,
    }),
  },
  {
    archivo: 'password-changed.html',
    claveContenido: 'mailer_templates_password_changed_notification_content',
    claveAsunto: 'mailer_subjects_password_changed_notification',
    asunto: 'Tu contraseña de MaquinariaOcasión ha cambiado',
    html: layout({
      titulo: 'Contraseña actualizada',
      preheader: 'La contraseña de tu cuenta de MaquinariaOcasión se ha cambiado.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Te confirmamos que la contraseña de tu cuenta de <strong>MaquinariaOcasión</strong> se ha cambiado correctamente. Ya puedes iniciar sesión con la nueva contraseña.</p>
     ${avisoNoFuiYo}`,
      ctaTexto: 'IR A MI CUENTA',
      ctaUrl: `${SITE}/login`,
    }),
  },
  {
    archivo: 'email-changed.html',
    claveContenido: 'mailer_templates_email_changed_notification_content',
    claveAsunto: 'mailer_subjects_email_changed_notification',
    asunto: 'La dirección de correo de tu cuenta ha cambiado',
    html: layout({
      titulo: 'Correo actualizado',
      preheader: 'La dirección de correo de tu cuenta de MaquinariaOcasión ha cambiado.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">La dirección de correo de tu cuenta de <strong>MaquinariaOcasión</strong> ha pasado de <strong>{{ .OldEmail }}</strong> a <strong>{{ .Email }}</strong>. A partir de ahora recibirás los avisos de tu cuenta en la nueva dirección.</p>
     ${avisoNoFuiYo}`,
    }),
  },
  {
    archivo: 'phone-changed.html',
    claveContenido: 'mailer_templates_phone_changed_notification_content',
    claveAsunto: 'mailer_subjects_phone_changed_notification',
    asunto: 'El teléfono de tu cuenta ha cambiado',
    html: layout({
      titulo: 'Teléfono actualizado',
      preheader: 'El número de teléfono de tu cuenta de MaquinariaOcasión ha cambiado.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">El número de teléfono de tu cuenta de <strong>MaquinariaOcasión</strong> ha pasado de <strong>{{ .OldPhone }}</strong> a <strong>{{ .Phone }}</strong>.</p>
     ${avisoNoFuiYo}`,
    }),
  },
  {
    archivo: 'mfa-factor-enrolled.html',
    claveContenido: 'mailer_templates_mfa_factor_enrolled_notification_content',
    claveAsunto: 'mailer_subjects_mfa_factor_enrolled_notification',
    asunto: 'Nuevo método de verificación añadido a tu cuenta',
    html: layout({
      titulo: 'Verificación reforzada',
      preheader: 'Se ha añadido un método de verificación a tu cuenta de MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Se ha añadido un nuevo método de verificación (<strong>{{ .FactorType }}</strong>) a tu cuenta de <strong>MaquinariaOcasión</strong>. A partir de ahora te lo pediremos al iniciar sesión.</p>
     ${avisoNoFuiYo}`,
    }),
  },
  {
    archivo: 'mfa-factor-unenrolled.html',
    claveContenido: 'mailer_templates_mfa_factor_unenrolled_notification_content',
    claveAsunto: 'mailer_subjects_mfa_factor_unenrolled_notification',
    asunto: 'Se ha eliminado un método de verificación de tu cuenta',
    html: layout({
      titulo: 'Método de verificación eliminado',
      preheader: 'Se ha eliminado un método de verificación de tu cuenta de MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Se ha eliminado el método de verificación (<strong>{{ .FactorType }}</strong>) de tu cuenta de <strong>MaquinariaOcasión</strong>. Ten en cuenta que tu cuenta queda menos protegida.</p>
     ${avisoNoFuiYo}`,
    }),
  },
  {
    archivo: 'identity-linked.html',
    claveContenido: 'mailer_templates_identity_linked_notification_content',
    claveAsunto: 'mailer_subjects_identity_linked_notification',
    asunto: 'Nuevo método de acceso vinculado a tu cuenta',
    html: layout({
      titulo: 'Método de acceso vinculado',
      preheader: 'Se ha vinculado un nuevo método de acceso a tu cuenta de MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Tu cuenta de <strong>{{ .Provider }}</strong> se ha vinculado como nuevo método de acceso para <strong>{{ .Email }}</strong> en <strong>MaquinariaOcasión</strong>.</p>
     ${avisoNoFuiYo}`,
    }),
  },
  {
    archivo: 'identity-unlinked.html',
    claveContenido: 'mailer_templates_identity_unlinked_notification_content',
    claveAsunto: 'mailer_subjects_identity_unlinked_notification',
    asunto: 'Se ha eliminado un método de acceso de tu cuenta',
    html: layout({
      titulo: 'Método de acceso eliminado',
      preheader: 'Se ha eliminado un método de acceso de tu cuenta de MaquinariaOcasión.',
      cuerpo: `<p style="margin:0 0 16px">Hola,</p>
     <p style="margin:0 0 20px">Tu cuenta de <strong>{{ .Provider }}</strong> ha dejado de ser un método de acceso para <strong>{{ .Email }}</strong> en <strong>MaquinariaOcasión</strong>.</p>
     ${avisoNoFuiYo}`,
    }),
  },
]

const asuntos = {}
for (const p of PLANTILLAS) {
  writeFileSync(join(DIR, p.archivo), p.html + '\n', 'utf8')
  asuntos[p.claveAsunto] = p.asunto
}
writeFileSync(join(DIR, 'asuntos.json'), JSON.stringify(asuntos, null, 2) + '\n', 'utf8')

console.log(`Plantillas generadas: ${PLANTILLAS.length}`)
for (const p of PLANTILLAS) console.log(` - ${p.archivo} · «${p.asunto}»`)
console.log(' - asuntos.json')
