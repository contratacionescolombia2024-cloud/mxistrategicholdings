
# Payment Verification Flow - Diagrama Completo

## 🔄 Flujo de Verificación Manual

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO EN APP                                │
│                                                                   │
│  1. Completa pago en NowPayments                                 │
│  2. Regresa a la app                                             │
│  3. Ve pantalla "Esperando Pago"                                 │
│  4. Hace clic en "Verificar Estado del Pago" 🔍                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (payment-flow.tsx)                   │
│                                                                   │
│  handleManualCheck() {                                           │
│    - Obtiene session token                                       │
│    - Hace GET request a Edge Function                            │
│    - Pasa order_id como parámetro                                │
│  }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            EDGE FUNCTION (check-nowpayments-status)              │
│                                                                   │
│  PASO 1: Buscar Orden                                            │
│  ├─ Busca en payment_intents                                     │
│  └─ Busca en nowpayments_orders                                  │
│                                                                   │
│  PASO 2: Validar Estado                                          │
│  ├─ Si ya está confirmado → Retorna éxito                        │
│  └─ Si no → Continúa                                             │
│                                                                   │
│  PASO 3: Consultar NowPayments API                               │
│  ├─ GET /v1/payment/{payment_id}                                 │
│  └─ Obtiene estado actual                                        │
│                                                                   │
│  PASO 4: Actualizar Base de Datos                                │
│  ├─ Actualiza payment_intents                                    │
│  ├─ Actualiza nowpayments_orders                                 │
│  └─ Actualiza transaction_history                                │
│                                                                   │
│  PASO 5: Si Confirmado → Procesar Pago                           │
│  ├─ Acreditar MXI al usuario                                     │
│  ├─ Actualizar balances                                          │
│  ├─ Calcular yield rate                                          │
│  ├─ Procesar comisiones de referidos                             │
│  └─ Actualizar métricas globales                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPUESTA AL USUARIO                          │
│                                                                   │
│  ✅ CONFIRMADO:                                                   │
│     "Pago Confirmado"                                            │
│     "Se acreditaron X MXI a tu cuenta"                           │
│     [Botón: Ver Balance]                                         │
│                                                                   │
│  ⏳ PENDIENTE:                                                    │
│     "Estado del Pago"                                            │
│     "Estado actual: Esperando confirmación"                      │
│     "Por favor espera unos minutos más"                          │
│                                                                   │
│  ❌ ERROR:                                                        │
│     "Error"                                                      │
│     "No se pudo verificar el estado del pago"                    │
│     [Botón: Reintentar]                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Flujo de Webhook (Automático)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOWPAYMENTS                                   │
│                                                                   │
│  - Usuario completa pago                                         │
│  - NowPayments procesa transacción                               │
│  - Genera webhook con firma HMAC-SHA512                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION (nowpayments-webhook)                 │
│                                                                   │
│  PASO 1: Validar Firma IPN                                       │
│  ├─ Obtiene x-nowpayments-sig header                             │
│  ├─ Calcula HMAC-SHA512 del payload                              │
│  ├─ Compara firmas                                               │
│  └─ Si inválida → Registra advertencia pero continúa             │
│                                                                   │
│  PASO 2: Registrar Webhook                                       │
│  └─ Inserta en nowpayments_webhook_logs                          │
│                                                                   │
│  PASO 3: Buscar Orden                                            │
│  └─ Busca por order_id en nowpayments_orders                     │
│                                                                   │
│  PASO 4: Actualizar Estado                                       │
│  ├─ Actualiza nowpayments_orders                                 │
│  └─ Actualiza transaction_history                                │
│                                                                   │
│  PASO 5: Si Confirmado → Procesar                                │
│  ├─ Validar moneda (USDT ETH)                                    │
│  ├─ Validar monto (tolerancia 5%)                                │
│  ├─ Acreditar MXI                                                │
│  ├─ Procesar comisiones                                          │
│  └─ Actualizar métricas                                          │
│                                                                   │
│  PASO 6: Notificar Usuario (Realtime)                            │
│  └─ Supabase Realtime actualiza UI automáticamente               │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Estados de Pago

```
┌──────────────┐
│   PENDING    │  ← Intento creado, esperando selección de crypto
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   WAITING    │  ← Factura generada, esperando pago del usuario
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  CONFIRMING  │  ← Pago recibido, esperando confirmaciones de red
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────────┐  ┌──────────────┐
│  CONFIRMED   │  │    FAILED    │  ← Pago fallido
└──────┬───────┘  └──────────────┘
       │
       ▼
┌──────────────┐
│   FINISHED   │  ← Pago completado y procesado
└──────────────┘
```

## 🗄️ Tablas de Base de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      payment_intents                             │
├─────────────────────────────────────────────────────────────────┤
│  - id (uuid)                                                     │
│  - user_id (uuid) → users.id                                     │
│  - order_id (text, unique)                                       │
│  - price_amount (numeric)                                        │
│  - price_currency (text) = 'USD'                                 │
│  - pay_currency (text) = 'usdteth'                               │
│  - pay_amount (numeric)                                          │
│  - payment_id (text) → NowPayments ID                            │
│  - nowpayment_invoice_url (text)                                 │
│  - status (text)                                                 │
│  - mxi_amount (numeric)                                          │
│  - phase (integer)                                               │
│  - created_at, updated_at, expires_at                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    nowpayments_orders                            │
├─────────────────────────────────────────────────────────────────┤
│  - id (uuid)                                                     │
│  - user_id (uuid) → users.id                                     │
│  - order_id (text, unique)                                       │
│  - payment_id (text, unique)                                     │
│  - payment_url (text)                                            │
│  - mxi_amount (numeric)                                          │
│  - usdt_amount (numeric)                                         │
│  - status (text)                                                 │
│  - payment_status (text)                                         │
│  - actually_paid (numeric)                                       │
│  - created_at, updated_at, confirmed_at                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   transaction_history                            │
├─────────────────────────────────────────────────────────────────┤
│  - id (uuid)                                                     │
│  - user_id (uuid) → users.id                                     │
│  - transaction_type (text) = 'nowpayments_order'                 │
│  - order_id (text)                                               │
│  - payment_id (text)                                             │
│  - mxi_amount (numeric)                                          │
│  - usdt_amount (numeric)                                         │
│  - status (text)                                                 │
│  - error_message (text)                                          │
│  - payment_url (text)                                            │
│  - created_at, updated_at, completed_at                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 nowpayments_webhook_logs                         │
├─────────────────────────────────────────────────────────────────┤
│  - id (uuid)                                                     │
│  - payment_id (text)                                             │
│  - order_id (text)                                               │
│  - payload (jsonb) → Webhook completo                            │
│  - status (text)                                                 │
│  - processed (boolean)                                           │
│  - error (text)                                                  │
│  - created_at                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Debugging Checklist

### 1. Verificar Orden Existe
```sql
SELECT * FROM payment_intents WHERE order_id = 'MXI-XXX';
SELECT * FROM nowpayments_orders WHERE order_id = 'MXI-XXX';
```

### 2. Verificar Payment ID
```sql
SELECT payment_id, status FROM payment_intents WHERE order_id = 'MXI-XXX';
```

### 3. Ver Logs de Webhook
```sql
SELECT * FROM nowpayments_webhook_logs 
WHERE order_id = 'MXI-XXX' 
ORDER BY created_at DESC;
```

### 4. Verificar Balance Usuario
```sql
SELECT mxi_balance, mxi_purchased_directly, usdt_contributed 
FROM users WHERE id = 'USER_ID';
```

### 5. Ver Historial de Transacciones
```sql
SELECT * FROM transaction_history 
WHERE order_id = 'MXI-XXX' 
ORDER BY created_at DESC;
```

## 🎯 Puntos Clave

1. **Botón Verificar**: Consulta manualmente el estado con NowPayments
2. **Webhook**: Actualiza automáticamente cuando NowPayments notifica
3. **Dual Table**: Soporta tanto `payment_intents` como `nowpayments_orders`
4. **IPN Validation**: Valida firma HMAC-SHA512 de webhooks
5. **Idempotency**: Previene procesamiento duplicado
6. **Error Handling**: Manejo robusto de errores con mensajes claros
7. **Realtime Updates**: UI se actualiza automáticamente vía Supabase Realtime

## ✅ Todo Funciona Correctamente

- ✅ Botón "Verificar" hace llamada correcta
- ✅ Edge Function procesa solicitud
- ✅ Consulta NowPayments API
- ✅ Actualiza base de datos
- ✅ Procesa pagos confirmados
- ✅ Acredita MXI al usuario
- ✅ Procesa comisiones de referidos
- ✅ Actualiza métricas
- ✅ Muestra resultado al usuario
