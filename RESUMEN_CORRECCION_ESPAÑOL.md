
# 🔧 Corrección Completa - Webhook NowPayments y Botón Verificar

## ✅ Problemas Corregidos

### 1. Error 401 en Webhook de NowPayments ❌ → ✅
**Problema:** El webhook de NowPayments fallaba con error 401 "No autorizado" porque la verificación de firma HMAC fallaba.

**Causa:** La variable de entorno `NOWPAYMENTS_WEBHOOK_SECRET` en Supabase no estaba configurada con el secreto IPN correcto de NowPayments.

**Solución:** 
- Actualicé la función webhook con mejor registro de verificación de firma
- Agregué mensajes de error detallados
- Mejoré el manejo de errores

### 2. Botón "Verificar" No Funcionaba ❌ → ✅
**Problema:** El botón "Verificar" para transacciones pendientes devolvía errores 500 y no realizaba llamadas exitosas.

**Causa:** La función `check-nowpayments-status` tenía mal manejo de errores y usaba `.single()` en lugar de `.maybeSingle()`.

**Solución:**
- Corregí las consultas de base de datos
- Agregué manejo completo de errores con mensajes en español
- Mejoré el manejo de errores de red

---

## 🔑 **CRÍTICO: Configurar el Secreto del Webhook**

**DEBES** configurar el secreto correcto del webhook en tu proyecto Supabase para que funcione:

### Paso 1: Obtén tu Secreto IPN de NowPayments
Según tu mensaje, tu secreto IPN es:
```
WCINfky/2ov0tzmRHd2+DNdIzLsKq6Ld
```

### Paso 2: Configura la Variable de Entorno en Supabase

1. Ve a tu Panel de Supabase: https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn
2. Navega a **Settings** → **Edge Functions** → **Secrets**
3. Agrega o actualiza el secreto:
   - **Nombre:** `NOWPAYMENTS_WEBHOOK_SECRET`
   - **Valor:** `WCINfky/2ov0tzmRHd2+DNdIzLsKq6Ld`
4. Haz clic en **Save**

### Paso 3: Verifica la URL IPN en el Panel de NowPayments

Asegúrate de que tu panel de NowPayments tenga la URL de callback IPN correcta:
```
https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
```

---

## 🧪 Probar las Correcciones

### Probar el Webhook
1. Realiza un pago de prueba a través de tu app
2. Verifica los logs de Edge Function en Supabase:
   - Ve a **Edge Functions** → **nowpayments-webhook** → **Logs**
   - Deberías ver:
     - ✅ "Webhook signature verified successfully"
     - ✅ "Payment processed successfully"
   - NO deberías ver:
     - ❌ "Invalid webhook signature"
     - ❌ Errores 401

### Probar el Botón Verificar
1. Ve a **Historial de Transacciones** en tu app
2. Encuentra una transacción pendiente
3. Haz clic en el botón **"Verificar"**
4. El botón debería:
   - ✅ Realizar una llamada API exitosa
   - ✅ Actualizar el estado de la transacción si el pago está completo
   - ✅ Mostrar un mensaje amigable
   - ✅ NO mostrar errores 500

---

## 🔍 Tu Pago Pendiente

Tienes un pago pendiente que está aprobado en NowPayments pero no se ha acreditado:

**Detalles del Pago:**
- **Order ID:** `MXI-1763946948400-c084e1d6`
- **Payment ID:** `4520496802`
- **Estado en NowPayments:** ✅ Finalizado ("finished")
- **Estado en Base de Datos:** ❌ En espera ("waiting")

**Para procesar este pago:**
1. Configura el `NOWPAYMENTS_WEBHOOK_SECRET` (ver arriba)
2. Abre tu app
3. Ve a **Historial de Transacciones**
4. Encuentra la transacción con order ID `MXI-1763946948400-c084e1d6`
5. Haz clic en el botón **"Verificar"**
6. El pago se procesará y los MXI se acreditarán a tu cuenta

---

## 📊 Qué Sucede Ahora

### Cuando se Realiza un Pago:
1. **Usuario completa el pago** en NowPayments
2. **NowPayments envía webhook** a tu función Supabase
3. **Webhook verifica la firma** usando el secreto
4. **Si la firma es válida:**
   - Actualiza tabla `nowpayments_orders`
   - Actualiza tabla `transaction_history`
   - Acredita MXI al saldo del usuario
   - Procesa comisiones de referidos (5%, 2%, 1%)
   - Actualiza métricas globales
5. **Usuario ve saldo actualizado** en tiempo real

### Cuando el Usuario Hace Clic en "Verificar":
1. **Botón hace llamada API** a `check-nowpayments-status`
2. **Función consulta API de NowPayments** para obtener el estado más reciente
3. **Si el pago está finalizado:**
   - Procesa el pago (igual que el webhook)
   - Acredita MXI al usuario
   - Muestra mensaje de éxito
4. **Si el pago aún está pendiente:**
   - Actualiza estado en base de datos
   - Muestra estado actual al usuario

---

## 🔍 Monitoreo y Depuración

### Verificar Logs del Webhook
```sql
-- Ver intentos recientes de webhook
SELECT 
  id,
  order_id,
  payment_id,
  status,
  processed,
  error,
  created_at
FROM nowpayments_webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Verificar Webhooks Fallidos
```sql
-- Ver intentos de webhook fallidos
SELECT 
  id,
  order_id,
  payment_id,
  status,
  error,
  payload,
  created_at
FROM nowpayments_webhook_logs
WHERE processed = false OR error IS NOT NULL
ORDER BY created_at DESC;
```

### Verificar Transacciones Pendientes
```sql
-- Ver transacciones pendientes
SELECT 
  id,
  order_id,
  payment_id,
  status,
  mxi_amount,
  usdt_amount,
  error_message,
  created_at
FROM transaction_history
WHERE status IN ('pending', 'waiting', 'confirming')
ORDER BY created_at DESC;
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema: El webhook aún devuelve 401
**Solución:** 
- Verifica que `NOWPAYMENTS_WEBHOOK_SECRET` esté configurado correctamente en Supabase
- Verifica que el secreto coincida exactamente con el de tu panel de NowPayments
- Verifica que no haya espacios extra o caracteres ocultos

### Problema: El botón Verificar muestra "Orden no encontrada"
**Solución:**
- Es posible que la orden no se haya creado correctamente
- Verifica si el `order_id` existe en las tablas `nowpayments_orders` o `payment_intents`
- El usuario puede necesitar crear un nuevo pago

### Problema: El pago está "finished" en NowPayments pero no se acredita
**Solución:**
- Haz clic en el botón "Verificar" para procesar manualmente el pago
- Verifica los logs de Edge Function para errores
- Verifica que la moneda de pago sea USDT ETH (no TRC20)

---

## 📝 Resumen de Cambios

### Archivos Modificados:
1. **`supabase/functions/nowpayments-webhook/index.ts`**
   - Mejorado el registro de verificación de firma
   - Agregados mensajes de error detallados
   - Mejorado el flujo de procesamiento del webhook

2. **`supabase/functions/check-nowpayments-status/index.ts`**
   - Corregidas consultas de base de datos (`.single()` → `.maybeSingle()`)
   - Agregado manejo completo de errores
   - Agregados mensajes de error en español
   - Mejorado el manejo de errores de red

---

## ✅ Próximos Pasos

1. **Configura el secreto del webhook** en Supabase (ver instrucciones arriba)
2. **Procesa tu pago pendiente** haciendo clic en "Verificar"
3. **Prueba con un pago pequeño** para verificar que todo funcione
4. **Monitorea los logs** para los primeros pagos

---

## 🎉 Resultados Esperados

Después de configurar el secreto del webhook:
- ✅ Los webhooks serán aceptados (200 OK en lugar de 401)
- ✅ Los pagos se procesarán automáticamente
- ✅ Los saldos de usuario se actualizarán en tiempo real
- ✅ El botón Verificar funcionará para verificaciones manuales
- ✅ No más errores 401 o 500

---

## 📞 Soporte

Si continúas experimentando problemas:
1. Verifica los logs de Edge Function en Supabase
2. Ejecuta las consultas SQL arriba para verificar el estado de la base de datos
3. Verifica que el secreto del webhook esté configurado correctamente
4. Prueba primero con un monto de pago pequeño

¡Las correcciones están ahora desplegadas y listas para usar una vez que configures el secreto del webhook! 🚀
