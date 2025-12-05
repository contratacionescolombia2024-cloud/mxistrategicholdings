
# 🔄 Sistema de Verificación Automática de Pagos NowPayments

## 📋 Resumen

Se ha implementado un sistema **drástico y robusto** de verificación automática de pagos para resolver los problemas de pagos no reflejados en la aplicación.

## 🚀 Características Implementadas

### 1. **Edge Function de Auto-Verificación** (`auto-verify-payments`)
- ✅ Verifica automáticamente todos los pagos pendientes
- ✅ Se ejecuta cada 30 segundos para pagos activos
- ✅ Consulta directamente la API de NOWPayments
- ✅ Actualiza automáticamente el estado de los pagos
- ✅ Acredita MXI automáticamente cuando el pago es confirmado
- ✅ Actualiza métricas globales
- ✅ Logging detallado para debugging

### 2. **Componente de Polling Automático** (`PaymentStatusPoller`)
- ✅ Se integra en el modal de pago
- ✅ Verifica el estado cada 30 segundos automáticamente
- ✅ Muestra el estado actual del pago en tiempo real
- ✅ Botón manual "Verificar Ahora" para verificación inmediata
- ✅ Notifica al usuario cuando el pago es confirmado
- ✅ Se detiene automáticamente cuando el pago es confirmado
- ✅ Manejo de errores con mensajes claros

### 3. **Mejoras en el Modal de Pago**
- ✅ Integración del componente de polling
- ✅ Feedback visual del estado del pago
- ✅ Temporizador de expiración
- ✅ Instrucciones claras paso a paso
- ✅ Alertas automáticas cuando el pago es confirmado

## 🔧 Configuración

### 1. Desplegar la Edge Function

```bash
# Desplegar la función de auto-verificación
supabase functions deploy auto-verify-payments
```

### 2. Configurar Cron Job (Opcional pero Recomendado)

Para verificación automática en segundo plano, configura un cron job que llame a la función cada 5 minutos:

```bash
# Usando cron-job.org o similar
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/auto-verify-payments
```

O configura un cron job en Supabase:

```sql
-- Crear extensión pg_cron si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar verificación cada 5 minutos
SELECT cron.schedule(
  'auto-verify-nowpayments',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/auto-verify-payments',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### 3. Variables de Entorno Requeridas

Asegúrate de que estas variables estén configuradas en Supabase:

- `NOWPAYMENTS_API_KEY` - Tu API key de NOWPayments
- `NOWPAYMENTS_IPN_SECRET` - Tu IPN secret de NOWPayments
- `SUPABASE_URL` - URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key de Supabase

## 📊 Flujo de Verificación

### Flujo Automático (Polling)

```
Usuario crea pago
    ↓
Modal muestra PaymentStatusPoller
    ↓
Polling inicia automáticamente
    ↓
Cada 30 segundos:
    1. Consulta base de datos local
    2. Si pendiente, consulta NOWPayments API
    3. Actualiza estado en base de datos
    4. Actualiza UI
    ↓
Cuando pago es confirmado:
    1. Acredita MXI al usuario
    2. Actualiza métricas
    3. Notifica al usuario
    4. Detiene polling
```

### Flujo Manual (Botón "Verificar Ahora")

```
Usuario hace clic en "Verificar Ahora"
    ↓
Llama a check-nowpayments-status
    ↓
Consulta NOWPayments API
    ↓
Actualiza estado y acredita si es necesario
    ↓
Muestra resultado al usuario
```

### Flujo de Background (Cron Job)

```
Cron job se ejecuta cada 5 minutos
    ↓
Llama a auto-verify-payments
    ↓
Busca todos los pagos pendientes (últimas 24 horas)
    ↓
Para cada pago:
    1. Consulta NOWPayments API
    2. Actualiza estado
    3. Acredita si es necesario
    ↓
Retorna resumen de verificaciones
```

## 🐛 Debugging

### Ver Logs de la Edge Function

```bash
# Ver logs en tiempo real
supabase functions logs auto-verify-payments --tail

# Ver logs de check-nowpayments-status
supabase functions logs check-nowpayments-status --tail

# Ver logs del webhook
supabase functions logs nowpayments-webhook --tail
```

### Verificar Pagos Pendientes Manualmente

```sql
-- Ver todos los pagos pendientes
SELECT 
  id,
  order_id,
  payment_id,
  status,
  payment_status,
  price_amount,
  mxi_amount,
  created_at,
  updated_at
FROM payments
WHERE status IN ('waiting', 'pending', 'confirming', 'sending')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Ejecutar Verificación Manual

```bash
# Ejecutar verificación de todos los pagos pendientes
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/auto-verify-payments
```

## 🔍 Solución de Problemas

### Problema: Pago no se refleja después de 5 minutos

**Solución:**
1. Verificar que el pago existe en NOWPayments dashboard
2. Verificar que el `payment_id` está guardado en la base de datos
3. Ejecutar verificación manual:
   ```bash
   curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/auto-verify-payments
   ```
4. Revisar logs de la edge function
5. Verificar que las variables de entorno están configuradas correctamente

### Problema: Webhook retorna 401

**Solución:**
1. Verificar que `NOWPAYMENTS_IPN_SECRET` está configurado correctamente
2. Verificar que el secret en NOWPayments dashboard coincide
3. Revisar logs del webhook para ver el error exacto
4. El webhook ahora ignora la expiración del JWT (NOWPayments no envía `exp`)

### Problema: check-nowpayments-status retorna 500

**Solución:**
1. Verificar que `NOWPAYMENTS_API_KEY` está configurado correctamente
2. Verificar que el `payment_id` existe en NOWPayments
3. Revisar logs para ver el error específico de NOWPayments
4. Verificar que el usuario tiene sesión activa

## 📈 Métricas y Monitoreo

### Consultas Útiles

```sql
-- Pagos verificados en las últimas 24 horas
SELECT 
  COUNT(*) as total_verified,
  SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM payments
WHERE updated_at > NOW() - INTERVAL '24 hours';

-- Tiempo promedio de confirmación
SELECT 
  AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at))) / 60 as avg_minutes
FROM payments
WHERE confirmed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days';

-- Pagos pendientes por más de 1 hora
SELECT 
  order_id,
  payment_id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_pending
FROM payments
WHERE status IN ('waiting', 'pending', 'confirming')
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;
```

## 🎯 Mejores Prácticas

1. **Monitoreo Activo**: Revisa los logs regularmente para detectar problemas temprano
2. **Cron Job**: Configura el cron job para verificación automática en segundo plano
3. **Alertas**: Configura alertas para pagos pendientes por más de 30 minutos
4. **Backup Manual**: Siempre ten disponible la opción de verificación manual
5. **Documentación**: Mantén actualizada la documentación de errores comunes

## 🔐 Seguridad

- ✅ Todas las edge functions requieren autenticación
- ✅ Webhook verifica firma JWT de NOWPayments
- ✅ Service role key solo se usa en edge functions
- ✅ Validación de datos en cada paso
- ✅ Logging detallado sin exponer información sensible

## 📞 Soporte

Si un pago no se refleja después de seguir todos los pasos:

1. Recopilar información:
   - Order ID
   - Payment ID
   - Timestamp del pago
   - Logs de las edge functions
   - Screenshot del dashboard de NOWPayments

2. Verificar manualmente en NOWPayments dashboard

3. Ejecutar verificación manual con la edge function

4. Si el problema persiste, contactar soporte de NOWPayments

## 🎉 Resultado Esperado

Con este sistema implementado:

- ✅ Los pagos se verifican automáticamente cada 30 segundos
- ✅ Los usuarios ven el estado en tiempo real
- ✅ Los MXI se acreditan automáticamente
- ✅ No se requiere intervención manual
- ✅ Logging completo para debugging
- ✅ Múltiples capas de verificación (polling + cron + webhook)

## 📝 Notas Adicionales

- El sistema verifica pagos de las últimas 24 horas
- Los pagos expirados no se verifican
- El polling se detiene automáticamente cuando el pago es confirmado
- El usuario puede cerrar el modal y el pago seguirá siendo verificado en segundo plano
- El cron job actúa como red de seguridad para pagos que no fueron verificados por el polling
