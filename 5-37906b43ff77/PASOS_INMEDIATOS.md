
# ⚡ Pasos Inmediatos - Acción Requerida

## 🔴 URGENTE: Haz Esto Primero (2 minutos)

### Paso 1: Configurar el Secreto del Webhook

1. **Abre este enlace:**
   ```
   https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/settings/functions
   ```

2. **Haz clic en:** "Edge Functions" → "Secrets"

3. **Busca:** `NOWPAYMENTS_WEBHOOK_SECRET`
   - Si existe: Haz clic en "Edit"
   - Si no existe: Haz clic en "Add Secret"

4. **Ingresa:**
   - **Name:** `NOWPAYMENTS_WEBHOOK_SECRET`
   - **Value:** `WCINfky/2ov0tzmRHd2+DNdIzLsKq6Ld`

5. **Haz clic en:** "Save"

**¡Listo! El webhook ahora funcionará.**

---

## ✅ Paso 2: Procesar Tu Pago Pendiente (1 minuto)

Tu pago con **Payment ID 4520496802** está aprobado en NowPayments pero no se ha acreditado.

**Para procesarlo:**

1. **Abre tu app**

2. **Ve a:** Historial de Transacciones

3. **Busca la transacción:**
   - Order ID: `MXI-1763946948400-c084e1d6`
   - Estado: "En espera" o "Waiting"

4. **Haz clic en:** Botón "Verificar" (icono de actualizar)

5. **Espera:** 2-3 segundos

6. **Verás:** Mensaje de éxito y tu saldo MXI actualizado

---

## 🧪 Paso 3: Verificar Que Todo Funciona (5 minutos)

### Opción A: Verificar el Pago Pendiente
1. Sigue el Paso 2 arriba
2. Si ves "✅ Pago Confirmado", ¡funciona!
3. Tu saldo MXI debería aumentar

### Opción B: Hacer un Pago de Prueba
1. Haz un pago pequeño ($3-5 USDT)
2. Completa el pago en NowPayments
3. Espera 2-3 minutos
4. Tu saldo debería actualizarse automáticamente
5. Si no, haz clic en "Verificar"

---

## 🔍 Paso 4: Verificar los Logs (Opcional)

### Ver Logs del Webhook:
1. **Abre:**
   ```
   https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/functions/nowpayments-webhook/logs
   ```

2. **Busca:**
   - ✅ "Webhook signature verified successfully"
   - ✅ "Payment processed successfully"
   - ✅ Status: 200 OK

3. **NO deberías ver:**
   - ❌ "Invalid signature"
   - ❌ Status: 401 Unauthorized

### Ver Logs del Botón Verificar:
1. **Abre:**
   ```
   https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/functions/check-nowpayments-status/logs
   ```

2. **Busca:**
   - ✅ "Payment confirmed and processed"
   - ✅ Status: 200 OK

3. **NO deberías ver:**
   - ❌ Status: 500 Internal Server Error

---

## 📊 Resumen de Lo Que Se Corrigió

### Antes:
- ❌ Webhook: Error 401 "No autorizado"
- ❌ Botón Verificar: Error 500
- ❌ Pagos no se procesaban
- ❌ Base de datos no se actualizaba

### Después (una vez configures el secreto):
- ✅ Webhook: 200 OK
- ✅ Botón Verificar: Funciona perfectamente
- ✅ Pagos se procesan automáticamente
- ✅ Base de datos se actualiza en tiempo real

---

## 🎯 Checklist de Verificación

Marca cada item cuando lo completes:

- [ ] Configuré `NOWPAYMENTS_WEBHOOK_SECRET` en Supabase
- [ ] Procesé mi pago pendiente (Payment ID 4520496802)
- [ ] Verifiqué que mi saldo MXI aumentó
- [ ] Revisé los logs del webhook (sin errores 401)
- [ ] Probé el botón "Verificar" (funciona sin errores 500)
- [ ] (Opcional) Hice un pago de prueba pequeño

---

## 🚨 Si Algo No Funciona

### El webhook aún muestra 401:
1. Verifica que copiaste el secreto correctamente (sin espacios extra)
2. Verifica que guardaste los cambios en Supabase
3. Espera 1-2 minutos para que se apliquen los cambios
4. Intenta procesar el pago nuevamente

### El botón Verificar no funciona:
1. Verifica que la transacción tenga un `payment_id`
2. Verifica los logs de Edge Function para ver el error específico
3. Asegúrate de que el pago esté realmente finalizado en NowPayments

### El pago no se acredita:
1. Verifica que la moneda de pago sea USDT ETH (no TRC20)
2. Verifica que el monto pagado coincida con el monto de la orden
3. Haz clic en "Verificar" para procesar manualmente
4. Revisa los logs para ver si hay algún error

---

## 📞 Necesitas Ayuda?

Si después de seguir estos pasos aún tienes problemas:

1. **Copia los logs de error** de Supabase
2. **Toma captura de pantalla** del error en la app
3. **Anota:**
   - Order ID de la transacción
   - Payment ID de NowPayments
   - Mensaje de error exacto
4. **Comparte** esta información para ayuda adicional

---

## 🎉 ¡Todo Listo!

Una vez que completes el **Paso 1** (configurar el secreto), todo debería funcionar automáticamente.

**Tu pago pendiente se puede procesar ahora mismo con el botón "Verificar".**

**Los nuevos pagos se procesarán automáticamente sin intervención manual.**

¡Éxito! 🚀

---

## 📝 Documentos Adicionales

Para más información, consulta:
- `NOWPAYMENTS_WEBHOOK_FIX_COMPLETE.md` - Explicación técnica completa
- `QUICK_FIX_GUIDE.md` - Guía rápida en inglés
- `PAYMENT_FLOW_EXPLAINED.md` - Flujo completo de pagos explicado
- `RESUMEN_CORRECCION_ESPAÑOL.md` - Resumen completo en español
