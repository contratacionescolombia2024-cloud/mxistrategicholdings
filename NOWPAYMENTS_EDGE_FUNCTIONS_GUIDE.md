
# NOWPayments Edge Functions - Guía Completa

## Resumen

Este proyecto ahora incluye **tres Supabase Edge Functions** para integrar pagos cripto mediante NOWPayments, adaptadas a los ejemplos de la API oficial de NOWPayments.

## Edge Functions Disponibles

### 1. `create-payment-intent`
**Endpoint:** `POST /functions/v1/create-payment-intent`

**Propósito:** Crear una invoice o payment en NOWPayments y registrar el pedido en la tabla `payments`.

**Autenticación:** Requerida. Enviar `Authorization: Bearer <token de sesión de Supabase>`.

**Body JSON (Estándar):**
```json
{
  "order_id": "unique-order-id",
  "price_amount": 10,
  "price_currency": "USD",
  "pay_currency": "USDT"
}
```

**Body JSON (Con Invoice ID - Método invoice-payment):**
```json
{
  "order_id": "unique-order-id",
  "price_amount": 10,
  "price_currency": "USD",
  "pay_currency": "BTC",
  "invoice_id": "12345678",
  "payout_address": "0x...",
  "payout_currency": "USDTTRC20"
}
```

**Respuesta (Ejemplo):**
```json
{
  "success": true,
  "intent": {
    "id": "5745459419",
    "order_id": "unique-order-id",
    "invoice_url": "https://nowpayments.io/payment/...",
    "payment_id": "5745459419",
    "pay_address": "3EZ2uTdVDAMFXTfc6uLDDKR6o8qKBZXVkj",
    "pay_amount": 0.17070286,
    "pay_currency": "btc",
    "price_amount": 10,
    "price_currency": "usd",
    "mxi_amount": 25.0,
    "payment_status": "waiting",
    "expires_at": "2025-01-23T15:00:22.742Z",
    "network": "btc",
    "network_precision": 8
  }
}
```

**Características:**
- Soporta dos métodos de creación de pagos:
  - **Método estándar (invoice):** Crea una nueva invoice completa
  - **Método invoice-payment:** Crea un pago en una invoice existente (útil para crypto2crypto)
- Calcula automáticamente la cantidad de MXI tokens basado en el precio actual de la fase
- Almacena el pago en la base de datos local
- Retorna la URL de pago para redirigir al usuario

**Uso en la app:**
1. Llamar a este endpoint al iniciar un pago
2. Redirigir al usuario a `invoice_url` en un WebView o navegador in-app
3. Guardar `order_id` localmente para correlacionar el pago

---

### 2. `get-payment-status`
**Endpoint:** `POST /functions/v1/get-payment-status`

**Propósito:** Obtener el estado actual de un pago desde NOWPayments y actualizar la base de datos local.

**Autenticación:** Requerida. Enviar `Authorization: Bearer <token de sesión de Supabase>`.

**Body JSON:**
```json
{
  "payment_id": "6249365965"
}
```

**Respuesta (Ejemplo):**
```json
{
  "success": true,
  "payment": {
    "payment_id": 6249365965,
    "invoice_id": null,
    "payment_status": "finished",
    "pay_address": "address",
    "payin_extra_id": null,
    "price_amount": 1,
    "price_currency": "usd",
    "pay_amount": 11.8,
    "actually_paid": 12,
    "pay_currency": "trx",
    "order_id": null,
    "order_description": null,
    "purchase_id": "5312822613",
    "outcome_amount": 11.8405,
    "outcome_currency": "trx",
    "payout_hash": "hash",
    "payin_hash": "hash",
    "created_at": "2023-07-28T15:06:09.932Z",
    "updated_at": "2023-07-28T15:09:40.535Z",
    "burning_percent": "null",
    "type": "crypto2crypto",
    "payment_extra_ids": [5513339153]
  }
}
```

**Características:**
- Consulta el estado del pago directamente desde NOWPayments
- Actualiza automáticamente el registro local en la tabla `payments`
- Útil para verificar el estado de un pago manualmente

**Uso en la app:**
1. Llamar cuando el usuario regrese de la página de pago
2. Usar para verificar el estado antes de mostrar confirmación
3. Útil para debugging y soporte al cliente

---

### 3. `update-payment-estimate`
**Endpoint:** `POST /functions/v1/update-payment-estimate`

**Propósito:** Actualizar la estimación del monto a pagar (útil cuando el precio de la criptomoneda cambia).

**Autenticación:** Requerida. Enviar `Authorization: Bearer <token de sesión de Supabase>`.

**Body JSON:**
```json
{
  "payment_id": "4409701815"
}
```

**Respuesta (Ejemplo):**
```json
{
  "success": true,
  "estimate": {
    "id": "4455667788",
    "token_id": "5566778899",
    "pay_amount": 0.04671013,
    "expiration_estimate_date": "2022-08-12T13:14:28.536Z"
  }
}
```

**Características:**
- Actualiza el monto estimado a pagar basado en el precio actual de la criptomoneda
- Extiende el tiempo de expiración del pago
- Actualiza automáticamente el registro local

**Uso en la app:**
1. Llamar cuando el usuario vea que el precio ha cambiado
2. Mostrar el nuevo monto estimado al usuario
3. Útil para pagos de larga duración

---

## Webhook (Ya existente)

### `nowpayments-webhook`
**Endpoint:** `POST /functions/v1/nowpayments-webhook`

**Propósito:** Endpoint IPN para NOWPayments. Valida firma HMAC-SHA512 y actualiza la tabla `payments`.

**Autenticación:** No requiere; se valida por firma IPN con `NOWPAYMENTS_IPN_SECRET`.

**Configuración:** NOWPayments envía IPN a:
```
https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
```

**Características:**
- Valida la firma HMAC para seguridad
- Actualiza el estado del pago automáticamente
- Acredita MXI tokens al usuario cuando el pago se completa
- Registra todos los webhooks en `payment_webhook_logs` para auditoría

---

## Estados de Pago

### Estados de NOWPayments (`payment_status`)
- `waiting` - Esperando el pago
- `confirming` - Confirmando transacción en blockchain
- `confirmed` - Transacción confirmada
- `sending` - Enviando fondos (para crypto2crypto)
- `finished` - Pago completado exitosamente
- `failed` - Pago fallido
- `refunded` - Pago reembolsado
- `expired` - Pago expirado
- `partially_paid` / `part_paid` - Pago parcial recibido

### Estados Internos (`status`)
- `pending` - Pago iniciado pero no procesado
- `waiting` - Esperando pago del usuario
- `confirming` - Confirmando en blockchain
- `confirmed` - Confirmado y acreditado
- `finished` - Completado
- `failed` - Fallido
- `expired` - Expirado
- `cancelled` - Cancelado
- `refunded` - Reembolsado
- `partially_paid` - Pago parcial

---

## Flujo de Pago Completo

### 1. Crear Pago (Frontend)
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/create-payment-intent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      order_id: `${userId}-${Date.now()}-${randomString}`,
      price_amount: 100,
      price_currency: 'usd',
      pay_currency: 'usdteth',
    }),
  }
);

const data = await response.json();
if (data.success) {
  // Abrir invoice_url en WebView
  await WebBrowser.openBrowserAsync(data.intent.invoice_url);
  
  // Guardar order_id para seguimiento
  await AsyncStorage.setItem('pending_order_id', data.intent.order_id);
}
```

### 2. Usuario Completa el Pago
El usuario es redirigido a NOWPayments donde:
1. Ve la dirección de pago y el monto
2. Envía la criptomoneda desde su wallet
3. Espera confirmación en blockchain

### 3. NOWPayments Envía Webhook
Cuando el pago cambia de estado, NOWPayments envía un webhook a:
```
POST /functions/v1/nowpayments-webhook
```

El webhook:
1. Valida la firma HMAC
2. Actualiza el estado en la tabla `payments`
3. Si el pago está `finished` o `confirmed`:
   - Acredita MXI tokens al usuario
   - Actualiza métricas globales
   - Procesa comisiones de referidos

### 4. Frontend Detecta Cambio
El frontend puede detectar el cambio mediante:

**Opción A: Realtime Subscription**
```typescript
const channel = supabase
  .channel('payment-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'payments',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      console.log('Payment updated:', payload);
      // Actualizar UI
    }
  )
  .subscribe();
```

**Opción B: Polling**
```typescript
const interval = setInterval(async () => {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();
    
  if (data.status === 'finished' || data.status === 'confirmed') {
    clearInterval(interval);
    // Mostrar éxito
  }
}, 5000);
```

**Opción C: Verificación Manual**
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/get-payment-status`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      payment_id: paymentId,
    }),
  }
);
```

---

## Ejemplos de Uso Avanzado

### Crear Pago con Invoice Existente (crypto2crypto)
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/create-payment-intent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      order_id: `${userId}-${Date.now()}`,
      price_amount: 100,
      price_currency: 'usd',
      pay_currency: 'btc',
      invoice_id: '12345678', // Invoice existente
      payout_address: '0x...', // Dirección de payout
      payout_currency: 'usdttrc20', // Moneda de payout
    }),
  }
);
```

### Actualizar Estimación de Pago
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/update-payment-estimate`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      payment_id: '4409701815',
    }),
  }
);

const data = await response.json();
if (data.success) {
  console.log('Nuevo monto:', data.estimate.pay_amount);
  console.log('Nueva expiración:', data.estimate.expiration_estimate_date);
}
```

---

## Variables de Entorno Requeridas

Asegúrate de tener configuradas estas variables en Supabase:

```bash
NOWPAYMENTS_API_KEY=tu_api_key_aqui
NOWPAYMENTS_IPN_SECRET=tu_ipn_secret_aqui
SUPABASE_URL=https://aeyfnjuatbtcauiumbhn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

---

## Configuración en NOWPayments

1. **IPN Callback URL:**
   ```
   https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
   ```

2. **Criptomonedas Habilitadas:**
   - USDT (Ethereum - ERC20)
   - BTC
   - ETH
   - TRX
   - Cualquier otra que necesites

3. **IPN Secret:**
   - Genera un secret en el dashboard de NOWPayments
   - Configúralo como variable de entorno `NOWPAYMENTS_IPN_SECRET`

---

## Manejo de Errores

Todos los endpoints retornan errores en el siguiente formato:

```json
{
  "success": false,
  "error": "Mensaje de error amigable para el usuario",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": { /* detalles adicionales */ },
  "requestId": "abc12345"
}
```

### Códigos de Error Comunes

- `MISSING_API_KEY` - API key no configurada
- `MISSING_SUPABASE_CREDS` - Credenciales de Supabase no configuradas
- `NO_AUTH_HEADER` - No se envió el header de autorización
- `INVALID_SESSION` - Sesión de usuario inválida
- `INVALID_JSON` - Body JSON inválido
- `MISSING_FIELDS` - Faltan campos requeridos
- `METRICS_ERROR` - Error al obtener información de fase
- `NOWPAYMENTS_CONNECTION_ERROR` - Error de conexión con NOWPayments
- `NOWPAYMENTS_API_ERROR` - Error de la API de NOWPayments
- `NOWPAYMENTS_INVALID_JSON` - Respuesta inválida de NOWPayments
- `DATABASE_ERROR` - Error al guardar en base de datos
- `UNEXPECTED_ERROR` - Error inesperado

---

## Seguridad

1. **Autenticación de Usuario:**
   - Todos los endpoints requieren un token JWT válido de Supabase
   - El token se valida en cada request

2. **Validación de Webhook:**
   - Los webhooks de NOWPayments se validan con firma HMAC-SHA512
   - Solo se procesan webhooks con firma válida

3. **Row Level Security (RLS):**
   - Los usuarios solo pueden ver sus propios pagos
   - El webhook usa service role para actualizaciones

4. **Logging:**
   - Todos los webhooks se registran en `payment_webhook_logs`
   - Cada request tiene un `requestId` único para debugging

---

## Testing

### Test de Creación de Pago
```bash
curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_id": "test-order-123",
    "price_amount": 10,
    "price_currency": "usd",
    "pay_currency": "usdteth"
  }'
```

### Test de Estado de Pago
```bash
curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/get-payment-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "payment_id": "6249365965"
  }'
```

### Test de Actualización de Estimación
```bash
curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/update-payment-estimate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "payment_id": "4409701815"
  }'
```

---

## Troubleshooting

### El pago no se crea
1. Verifica que `NOWPAYMENTS_API_KEY` esté configurada correctamente
2. Verifica que la criptomoneda esté habilitada en tu cuenta de NOWPayments
3. Revisa los logs de la Edge Function en Supabase Dashboard

### El webhook no se recibe
1. Verifica que la URL del webhook esté configurada en NOWPayments
2. Verifica que `NOWPAYMENTS_IPN_SECRET` esté configurada
3. Revisa `payment_webhook_logs` para ver si se recibió pero falló

### El pago no se acredita
1. Verifica el estado del pago en `payments` table
2. Revisa los logs del webhook en `payment_webhook_logs`
3. Verifica que el usuario exista en la tabla `users`

---

## Próximos Pasos

1. **Implementar en Frontend:**
   - Actualizar `contrataciones.tsx` para usar los nuevos endpoints
   - Agregar botones para verificar estado y actualizar estimación
   - Mejorar el manejo de errores

2. **Testing:**
   - Probar con pagos reales en sandbox de NOWPayments
   - Verificar que los webhooks se reciban correctamente
   - Probar diferentes criptomonedas

3. **Monitoreo:**
   - Configurar alertas para pagos fallidos
   - Monitorear logs de webhooks
   - Revisar métricas de conversión

---

## Soporte

Para más información sobre la API de NOWPayments:
- Documentación: https://documenter.getpostman.com/view/7907941/S1a32n38
- Dashboard: https://nowpayments.io/dashboard
- Soporte: support@nowpayments.io
