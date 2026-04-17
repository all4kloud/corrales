# Configuración de Resend para Envío de Correos

## Pasos para configurar Resend:

### 1. Crear cuenta en Resend
- Ve a https://resend.com
- Crea una cuenta gratuita (incluye 3,000 correos/mes gratis)

### 2. Obtener API Key
- Una vez en el dashboard de Resend
- Ve a "API Keys" en el menú lateral
- Haz clic en "Create API Key"
- Dale un nombre (ejemplo: "Conecta Production")
- Copia la API key generada

### 3. Configurar dominio (Opcional pero recomendado)
- Ve a "Domains" en Resend
- Agrega tu dominio (ejemplo: conecta-re.com)
- Configura los registros DNS según las instrucciones de Resend
- Una vez verificado, podrás enviar correos desde tu dominio

### 4. Agregar variables de entorno en Vercel

En tu proyecto de Vercel:
1. Ve a Settings → Environment Variables
2. Agrega las siguientes variables:

\`\`\`
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Conecta <noreply@tu-dominio.com>
\`\`\`

**Nota:** Si no has configurado un dominio personalizado, puedes usar:
\`\`\`
RESEND_FROM_EMAIL=Conecta <onboarding@resend.dev>
\`\`\`

### 5. Instalar dependencia
La dependencia `resend` ya debe estar incluida, pero si necesitas reinstalarla:

\`\`\`bash
npm install resend
\`\`\`

### 6. Probar el envío de correos
- Una vez configuradas las variables de entorno, redeploya tu aplicación
- Prueba la funcionalidad de "Forgot Password"
- El correo debería llegar en segundos

## Solución de problemas:

- **Los correos no llegan:** Verifica que la API key esté correctamente configurada en Vercel
- **Error "Email service not configured":** Falta la variable `RESEND_API_KEY`
- **Correos van a spam:** Configura un dominio personalizado con DKIM/SPF
- **Límite de correos alcanzado:** Upgrade tu plan en Resend o espera al siguiente mes

## Precios de Resend:
- **Free:** 3,000 correos/mes, 100 correos/día
- **Pro:** $20/mes, 50,000 correos/mes
- **Business:** $250/mes, 750,000 correos/mes
