
# 🚨 SOLUCIÓN RÁPIDA: Error de Configuración NOWPayments

## El Problema

Los usuarios están viendo este error:
```
Error de configuración del servidor. Contacta al soporte técnico.
```

**Causa**: Las variables de entorno de NOWPayments no están configuradas en Supabase.

## Solución Rápida (5 minutos)

### Paso 1: Obtener Credenciales de NOWPayments

1. Ve a https://nowpayments.io/
2. Inicia sesión en tu cuenta
3. Ve a **Settings** → **API Keys**
4. Copia:
   - **API Key** (algo como: `ABC123XYZ...`)
   - **IPN Secret** (algo como: `DEF456UVW...`)

### Paso 2: Configurar Variables en Supabase

#### Opción A: Dashboard de Supabase (Recomendado)

1. Ve a https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn
2. Click en **Project Settings** (ícono de engranaje en la barra lateral)
3. Click en **Edge Functions** en el menú lateral
4. Scroll hasta **Environment Variables**
5. Click en **Add Variable**
6. Agrega estas dos variables:

   **Variable 1:**
   - Name: `NOWPAYMENTS_API_KEY`
   - Value: `[tu API key de NOWPayments]`
   - Click **Save**

   **Variable 2:**
   - Name: `NOWPAYMENTS_IPN_SECRET`
   - Value: `[tu IPN secret de NOWPayments]`
   - Click **Save**

#### Opción B: Supabase CLI

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref aeyfnjuatbtcauiumbhn

# Configurar secrets
supabase secrets set NOWPAYMENTS_API_KEY=tu_api_key_aqui
supabase secrets set NOWPAYMENTS_IPN_SECRET=tu_ipn_secret_aqui
```

### Paso 3: Redesplegar Edge Functions

Las Edge Functions necesitan ser redesplegadas para usar las nuevas variables:

```bash
# Redesplegar create-payment-intent
supabase functions deploy create-payment-intent

# Redesplegar nowpayments-webhook
supabase functions deploy nowpayments-webhook
```

O desde el Dashboard:
1. Ve a **Edge Functions** en la barra lateral
2. Click en cada función
3. Click en **Deploy**

### Paso 4: Configurar IPN URL en NOWPayments

1. Ve a https://nowpayments.io/app/settings/api-keys
2. Encuentra tu API key
3. En **IPN Callback URL**, ingresa:
   ```
   https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
   ```
4. Click **Save**

### Paso 5: Verificar

1. Abre la app
2. Ve a "Comprar MXI"
3. Intenta crear un pago
4. Si funciona, verás la página de pago de NOWPayments
5. Si aún hay error, revisa los logs en Supabase Dashboard → Edge Functions → Logs

## Verificación de Variables

Para verificar que las variables están configuradas:

```bash
# Ver todas las secrets configuradas
supabase secrets list
```

Deberías ver:
- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `SUPABASE_URL` (automático)
- `SUPABASE_SERVICE_ROLE_KEY` (automático)

## Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste la API key completa sin espacios
- Verifica que la API key es de producción, no de sandbox
- Verifica que tu cuenta de NOWPayments está activa

### Error: "Invalid webhook signature"
- Verifica que el IPN Secret es correcto
- Verifica que no hay espacios al inicio o final del secret

### Los pagos no se actualizan automáticamente
- Verifica que la IPN URL está configurada en NOWPayments
- Verifica que la URL es exactamente: `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook`
- Revisa la tabla `payment_webhook_logs` en Supabase para ver si los webhooks están llegando

## Contacto de Soporte

Si después de seguir estos pasos el problema persiste:

1. Revisa los logs en Supabase Dashboard → Edge Functions → Logs
2. Revisa la tabla `payment_webhook_logs` para errores de webhook
3. Contacta a NOWPayments: https://nowpayments.io/help
4. Verifica que tu cuenta de NOWPayments tiene fondos y está activa

## Notas de Seguridad

- ⚠️ **NUNCA** compartas tu API key o IPN secret públicamente
- ⚠️ **NUNCA** comitees las credenciales a Git
- ⚠️ Usa siempre variables de entorno para datos sensibles
- ⚠️ Rota tus API keys periódicamente
