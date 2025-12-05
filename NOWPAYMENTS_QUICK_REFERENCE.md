
# NOWPayments - Referencia Rápida

## 🚀 Endpoints

### 1. Crear Pago
```typescript
POST /functions/v1/create-payment-intent

// Body
{
  "order_id": "unique-id",
  "price_amount": 100,
  "price_currency": "usd",
  "pay_currency": "usdteth"
}

// Respuesta
{
  "success": true,
  "intent": {
    "invoice_url": "https://...",
    "payment_id": "123",
    "pay_amount": 100.5,
    ...
  }
}
```

### 2. Consultar Estado
```typescript
POST /functions/v1/get-payment-status

// Body
{
  "payment_id": "123"
}

// Respuesta
{
  "success": true,
  "payment": {
    "payment_status": "finished",
    "actually_paid": 100.5,
    ...
  }
}
```

### 3. Actualizar Estimación
```typescript
POST /functions/v1/update-payment-estimate

// Body
{
  "payment_id": "123"
}

// Respuesta
{
  "success": true,
  "estimate": {
    "pay_amount": 101.2,
    "expiration_estimate_date": "2025-01-23T..."
  }
}
```

---

## 📋 Estados de Pago

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `waiting` | Esperando pago | Mostrar dirección de pago |
| `confirming` | Confirmando | Mostrar "Confirmando..." |
| `confirmed` | Confirmado | Mostrar "Confirmado" |
| `finished` | Completado | Acreditar tokens |
| `failed` | Fallido | Mostrar error |
| `expired` | Expirado | Permitir crear nuevo pago |
| `partially_paid` | Pago parcial | Mostrar monto faltante |

---

## 🔑 Variables de Entorno

```bash
NOWPAYMENTS_API_KEY=tu_api_key
NOWPAYMENTS_IPN_SECRET=tu_ipn_secret
SUPABASE_URL=https://aeyfnjuatbtcauiumbhn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

---

## 🎨 Ejemplo de Uso en React Native

```typescript
import { supabase } from '@/lib/supabase';

// 1. Crear pago
const createPayment = async (amount: number) => {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({
        order_id: `${userId}-${Date.now()}`,
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdteth',
      }),
    }
  );
  
  const data = await response.json();
  if (data.success) {
    // Abrir URL de pago
    await WebBrowser.openBrowserAsync(data.intent.invoice_url);
  }
};

// 2. Verificar estado
const checkStatus = async (paymentId: string) => {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-payment-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ payment_id: paymentId }),
    }
  );
  
  const data = await response.json();
  return data.payment.payment_status;
};

// 3. Suscribirse a cambios (Realtime)
const subscribeToPayments = () => {
  const channel = supabase
    .channel('payment-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Payment updated:', payload);
        // Actualizar UI
      }
    )
    .subscribe();
    
  return () => supabase.removeChannel(channel);
};
```

---

## ⚠️ Errores Comunes

| Código | Causa | Solución |
|--------|-------|----------|
| `MISSING_API_KEY` | API key no configurada | Configurar en Supabase |
| `INVALID_SESSION` | Token JWT inválido | Refrescar sesión |
| `NOWPAYMENTS_API_ERROR` | Error de NOWPayments | Revisar logs |
| `DATABASE_ERROR` | Error de BD | Verificar permisos |

---

## 🧪 Testing Rápido

```bash
# Obtener token JWT
TOKEN=$(curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.access_token')

# Crear pago
curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-123",
    "price_amount": 10,
    "price_currency": "usd",
    "pay_currency": "usdteth"
  }'
```

---

## 📊 Flujo de Pago

```
1. Usuario → Crear Pago → create-payment-intent
                ↓
2. Abrir invoice_url en WebView
                ↓
3. Usuario paga en NOWPayments
                ↓
4. NOWPayments → Webhook → nowpayments-webhook
                ↓
5. Actualizar BD → Acreditar tokens
                ↓
6. Frontend detecta cambio (Realtime/Polling)
                ↓
7. Mostrar confirmación al usuario
```

---

## 🔗 Links Útiles

- **Documentación Completa:** `NOWPAYMENTS_EDGE_FUNCTIONS_GUIDE.md`
- **Resumen de Implementación:** `IMPLEMENTACION_NOWPAYMENTS_COMPLETA.md`
- **API de NOWPayments:** https://documenter.getpostman.com/view/7907941/S1a32n38
- **Dashboard de NOWPayments:** https://nowpayments.io/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn

---

## 💡 Tips

1. **Siempre validar el token JWT** antes de hacer requests
2. **Usar Realtime** para detectar cambios automáticamente
3. **Guardar order_id** localmente para tracking
4. **Mostrar estado del pago** en tiempo real al usuario
5. **Manejar errores** con mensajes amigables
6. **Logging** detallado para debugging
7. **Testing** en sandbox antes de producción

---

## 🎯 Checklist de Implementación

- [ ] Configurar variables de entorno en Supabase
- [ ] Configurar IPN URL en NOWPayments
- [ ] Habilitar criptomonedas en NOWPayments
- [ ] Probar creación de pago en sandbox
- [ ] Probar webhook en sandbox
- [ ] Implementar UI en frontend
- [ ] Agregar manejo de errores
- [ ] Agregar Realtime subscription
- [ ] Testing completo
- [ ] Deploy a producción

---

**¡Listo para usar!** 🚀
