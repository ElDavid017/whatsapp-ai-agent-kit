# 05 — Proteger el panel con Cloudflare Access

El panel web muestra conversaciones de clientes reales. **Nunca lo dejes público** — Cloudflare Access actúa como portero de seguridad sin coste adicional.

## Requisitos

- Dominio en Cloudflare (o subdominio de `*.easypanel.host`)
- Cuenta en Cloudflare Zero Trust (gratis hasta 50 usuarios)

## Configuración paso a paso

### 1. Acceder a Zero Trust

Ve a https://one.cloudflare.com → Zero Trust → Access → Applications.

### 2. Añadir la aplicación

- Tipo: **Self-hosted**
- Application name: `Panel WhatsApp`
- Application domain: `panel.tu-dominio.com` (o el subdominio de tu app en EasyPanel)
- Session Duration: 24 horas (o lo que prefieras)

### 3. Configurar la política de acceso

- Policy name: `Equipo`
- Action: **Allow**
- Include: **Emails** → añade los emails autorizados

O si son varios del mismo dominio:
- Include: **Emails ending in** → `@tu-empresa.com`

### 4. Identity provider (cómo se autentican)

**Recomendado: Email One-Time PIN**

- Cero configuración adicional.
- El usuario recibe un PIN de 6 dígitos por email.
- Funciona con cualquier email (Gmail, Outlook, corporativo).

Para activarlo: en Zero Trust → Settings → Authentication → añade "One-time PIN".

### 5. Guardar y probar

**Prueba OBLIGATORIA:** Abre el panel en ventana de incógnito con un email que NO esté autorizado. Debe mostrar la pantalla de Cloudflare con "Access Denied".

Si el acceso no autorizado pasa, la política no está configurada correctamente.

---

## Alternativa: dominio `*.easypanel.host`

Si no tienes dominio propio y usas el subdominio que da EasyPanel, puedes proteger el panel con **Basic Auth** en EasyPanel → la app → Settings → Basic Auth.

No es tan robusto como Cloudflare Access, pero es suficiente para uso básico.

---

## ¿Qué protege Cloudflare Access?

- El panel web (Next.js) en el puerto 3000.
- Todas las rutas de la API (`/api/*`).
- No interfiere con la conexión de WhatsApp (el bot usa WebSocket directamente, no pasa por Cloudflare).
