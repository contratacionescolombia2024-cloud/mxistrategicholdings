
# Sistema de Pagos MXI - Documentación Completa

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema Corregido](#problema-corregido)
3. [Archivos Modificados](#archivos-modificados)
4. [Cómo Funciona](#cómo-funciona)
5. [Guía de Pruebas](#guía-de-pruebas)
6. [Solución de Problemas](#solución-de-problemas)
7. [Documentos de Referencia](#documentos-de-referencia)

## 🎯 Resumen Ejecutivo

Se corrigió el error 500 que impedía a los usuarios completar pagos en el sistema. Las mejoras incluyen:

- ✅ Logging detallado para debugging
- ✅ Mejor manejo de errores de la API de NOWPayments
- ✅ Validación mejorada de criptomonedas
- ✅ Mensajes de error más claros para usuarios
- ✅ Documentación completa del flujo de pago

## 🐛 Problema Corregido

**Síntoma:** Error 500 al intentar proceder con el pago después de seleccionar una criptomoneda.

**Causa Raíz:** 
- Manejo insuficiente de errores en la comunicación con NOWPayments API
- Falta de logging detallado para diagnosticar problemas
- Validación de monedas demasiado restrictiva

**Solución:**
- Edge Function `create-payment-intent` actualizada a versión 5
- Edge Function `nowpayments-webhook` actualizada a versión 9
- Documentación completa creada

## 📁 Archivos Modificados

### Edge Functions Actualizadas:
1. **`create-payment-intent` (v5)**
   - Ubicación: Supabase Edge Functions
   - Cambios: Logging mejorado, mejor manejo de errores
   
2. **`nowpayments-webhook` (v9)**
   - Ubicación: Supabase Edge Functions
   - Cambios: Validación de monedas mejorada, mejor logging

### Documentos Creados:
1. `PAYMENT_INTENT_500_FIX.md` - Detalles técnicos de la corrección
2. `QUICK_TEST_PAYMENT.md` - Guía rápida de pruebas
3. `RESUMEN_CORRECCION_PAGO_500.md` - Resumen en español
4. `FLUJO_PAGO_VISUAL.md` - Diagrama visual del flujo
5. `README_PAGO_CORREGIDO.md` - Este documento

## 🔄 Cómo Funciona

### Flujo Simplificado:

```
1. Usuario ingresa monto → 2. Selecciona cripto → 3. Paga en NOWPayments
                                                              ↓
6. Balance actualizado ← 5. Webhook procesa ← 4. NOWPayments confirma
```

### Componentes del Sistema:

#### Frontend (`contrataciones.tsx`)
- Interfaz de usuario para ingresar monto
- Modal de selección de criptomoneda
- Polling de estado del pago
- Notificaciones al usuario

#### Edge Function: `create-payment-intent`
**Fase 1 (sin pay_currency):**
- Obtiene lista de criptomonedas disponibles
- Retorna al frontend para mostrar en modal

**Fase 2 (con pay_currency):**
- Crea invoice en NOWPayments
- Registra transacción en base de datos
- Retorna URL de pago

#### Edge Function: `nowpayments-webhook`
- Recibe notificaciones de NOWPayments
- Verifica firma HMAC
- Acredita MXI al usuario
- Distribuye comisiones a referidores
- Actualiza métricas del sistema

## 🧪 Guía de Pruebas

### Prueba Rápida (3 USDT):

1. **Preparación:**
   ```
   - Usuario registrado y autenticado
   - Variables de entorno configuradas
   - Wallet con fondos para pagar
   ```

2. **Ejecución:**
   ```
   a) Ir a "Deposito" o "Comprar MXI"
   b) Ingresar: 3 USDT
   c) Click "Continuar al Pago"
   d) Seleccionar: USDT (TRC20)
   e) Click "Pagar"
   f) Completar pago en NOWPayments
   g) Esperar confirmación (1-5 minutos)
   ```

3. **Verificación:**
   ```sql
   -- Verificar transacción
   SELECT status, mxi_amount FROM transaction_history 
   WHERE order_id = 'TU_ORDER_ID';
   
   -- Verificar balance
   SELECT mxi_balance, mxi_purchased_directly FROM users 
   WHERE id = 'TU_USER_ID';
   ```

### Montos de Prueba Sugeridos:

| Monto USDT | MXI Esperado | Fase | Precio |
|------------|--------------|------|--------|
| 3          | 10.00        | 1    | 0.30   |
| 10         | 33.33        | 1    | 0.30   |
| 50         | 166.67       | 1    | 0.30   |
| 100        | 333.33       | 1    | 0.30   |

## 🔧 Solución de Problemas

### Error: "Configuración del servidor incompleta"

**Diagnóstico:**
```bash
# Verificar variables de entorno
supabase secrets list
```

**Solución:**
```bash
# Configurar API key
supabase secrets set NOWPAYMENTS_API_KEY=tu_clave_aqui
supabase secrets set NOWPAYMENTS_WEBHOOK_SECRET=tu_secreto_aqui
```

### Error: "Error al obtener criptomonedas disponibles"

**Diagnóstico:**
```bash
# Ver logs detallados
supabase functions logs create-payment-intent --tail
```

**Posibles Causas:**
- API key inválida o expirada
- Cuenta de NOWPayments no verificada
- Problemas de red

**Solución:**
1. Verificar API key en dashboard de NOWPayments
2. Asegurar que la cuenta esté activa
3. Revisar logs para error específico

### Error: "No se pudo generar el pago"

**Diagnóstico:**
```bash
# Ver respuesta de NOWPayments
supabase functions logs create-payment-intent | grep "NOWPayments invoice response"
```

**Posibles Causas:**
- Criptomoneda no soportada
- Monto fuera de límites
- Problemas con la API de NOWPayments

**Solución:**
1. Revisar technical_details en el error
2. Verificar que la cripto esté en la lista de NOWPayments
3. Asegurar que el monto esté dentro de límites

### Pago Atascado en "waiting"

**Diagnóstico:**
```sql
-- Verificar si webhook fue recibido
SELECT * FROM nowpayments_webhook_logs 
WHERE order_id = 'TU_ORDER_ID';

-- Verificar estado de orden
SELECT status, payment_status FROM nowpayments_orders 
WHERE order_id = 'TU_ORDER_ID';
```

**Posibles Causas:**
- Webhook no configurado en NOWPayments
- Webhook secret incorrecto
- Pago aún no confirmado en blockchain

**Solución:**
1. Verificar URL del webhook en dashboard de NOWPayments
2. Confirmar que el webhook secret sea correcto
3. Esperar más tiempo (algunas blockchains son lentas)
4. Revisar logs del webhook

## 📚 Documentos de Referencia

### Para Desarrolladores:
- `PAYMENT_INTENT_500_FIX.md` - Detalles técnicos completos
- `FLUJO_PAGO_VISUAL.md` - Diagrama de flujo detallado

### Para Testing:
- `QUICK_TEST_PAYMENT.md` - Guía rápida de pruebas
- `RESUMEN_CORRECCION_PAGO_500.md` - Resumen de cambios

### Para Usuarios:
- Interfaz intuitiva en la app
- Mensajes de error claros
- Notificaciones de estado

## 🔐 Variables de Entorno Requeridas

```env
# NOWPayments
NOWPAYMENTS_API_KEY=tu_clave_api
NOWPAYMENTS_WEBHOOK_SECRET=tu_secreto_webhook

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
```

## 📊 Monitoreo

### Comandos Útiles:

```bash
# Ver logs en tiempo real
supabase functions logs create-payment-intent --tail
supabase functions logs nowpayments-webhook --tail

# Ver últimas transacciones
psql $DATABASE_URL -c "SELECT * FROM transaction_history ORDER BY created_at DESC LIMIT 5;"

# Ver últimos webhooks
psql $DATABASE_URL -c "SELECT * FROM nowpayments_webhook_logs ORDER BY created_at DESC LIMIT 5;"
```

### Métricas Clave:

```sql
-- Tasa de éxito de pagos
SELECT 
  COUNT(*) FILTER (WHERE status = 'finished') * 100.0 / COUNT(*) as success_rate
FROM transaction_history
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Tiempo promedio de confirmación
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) / 60 as avg_minutes
FROM transaction_history
WHERE status = 'finished' AND completed_at IS NOT NULL;

-- Criptomonedas más usadas
SELECT 
  pay_currency, 
  COUNT(*) as count
FROM nowpayments_orders
WHERE status = 'confirmed'
GROUP BY pay_currency
ORDER BY count DESC;
```

## 🎯 Próximos Pasos

1. ✅ **Implementado:** Corrección del error 500
2. ✅ **Implementado:** Logging mejorado
3. ✅ **Implementado:** Documentación completa
4. 🔄 **Pendiente:** Pruebas en producción
5. 🔄 **Pendiente:** Monitoreo de primeras transacciones
6. 🔄 **Pendiente:** Ajustes basados en feedback

## 💡 Mejores Prácticas

### Para Usuarios:
- Usar montos pequeños para primera prueba
- Verificar dirección de pago antes de enviar
- Guardar order_id para referencia
- Esperar confirmación antes de cerrar app

### Para Desarrolladores:
- Revisar logs regularmente
- Monitorear tasa de éxito
- Mantener documentación actualizada
- Responder rápido a errores

### Para Administradores:
- Verificar variables de entorno periódicamente
- Revisar métricas de pagos
- Mantener cuenta de NOWPayments activa
- Actualizar webhook secret si es necesario

## 📞 Soporte

### Recursos:
- **Logs:** `supabase functions logs [function-name]`
- **Base de Datos:** Consultas SQL en sección de Monitoreo
- **NOWPayments:** https://nowpayments.io/help
- **Supabase:** https://supabase.com/docs

### Contacto:
- Para problemas técnicos: Revisar logs y documentación
- Para problemas de API: Contactar soporte de NOWPayments
- Para problemas de base de datos: Revisar Supabase dashboard

---

**Última Actualización:** Enero 2025  
**Versión del Sistema:** 5.0  
**Estado:** ✅ Producción  
**Mantenedor:** Equipo de Desarrollo MXI
