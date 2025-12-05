
# Sistema de Solicitud de Verificación Manual de Pagos

## Resumen

Se ha implementado un sistema completo de solicitud de verificación manual de pagos que permite a los usuarios solicitar que un administrador revise y apruebe manualmente sus pagos cuando la verificación automática no funciona correctamente.

## Características Principales

### Para Usuarios

1. **Botón de Solicitud de Verificación Manual**
   - Ubicado en el historial de pagos (`payment-history.tsx`)
   - Solo visible para pagos que no están confirmados/finalizados
   - No se muestra si ya existe una solicitud pendiente

2. **Información Clara**
   - Mensaje informativo explicando que el proceso puede tomar hasta 2 horas
   - Estados visuales claros:
     - ⏳ Pendiente: Solicitud enviada, esperando revisión
     - 👀 Revisando: Un administrador está revisando el pago
     - ✅ Aprobado: Pago verificado y acreditado

3. **Notificaciones en Tiempo Real**
   - Suscripción a cambios en la tabla `manual_verification_requests`
   - Actualización automática del estado de la solicitud

### Para Administradores

1. **Panel de Verificaciones Manuales**
   - Nueva pantalla: `manual-verification-requests.tsx`
   - Accesible desde el panel de administración principal
   - Badge con contador de solicitudes pendientes

2. **Dos Pestañas**
   - **Pendientes**: Solo solicitudes pendientes o en revisión
   - **Todas**: Historial completo de solicitudes

3. **Información Detallada**
   - Datos del usuario (email, nombre, balance actual)
   - Detalles del pago (monto, MXI, fase, moneda)
   - Order ID y Payment ID
   - Fecha de solicitud y revisión

4. **Acciones de Administrador**
   - **Aprobar**: Verifica el pago con NOWPayments y lo acredita si está confirmado
   - **Rechazar**: Marca la solicitud como rechazada
   - Notas administrativas automáticas

## Estructura de Base de Datos

### Tabla: `manual_verification_requests`

```sql
create table manual_verification_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  order_id text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid references admin_users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Políticas RLS

- **Usuarios**: Pueden ver y crear sus propias solicitudes
- **Administradores**: Pueden ver y actualizar todas las solicitudes

### Índices

- `idx_manual_verification_requests_user_id`
- `idx_manual_verification_requests_payment_id`
- `idx_manual_verification_requests_status`
- `idx_manual_verification_requests_created_at`

## Flujo de Trabajo

### Flujo del Usuario

1. Usuario realiza un pago que no se acredita automáticamente
2. Usuario ve el pago en su historial con estado "pendiente" o "esperando"
3. Usuario hace clic en "Solicitar Verificación Manual"
4. Sistema muestra confirmación con detalles del pago
5. Usuario confirma la solicitud
6. Sistema crea registro en `manual_verification_requests`
7. Usuario ve badge "⏳ Verificación manual solicitada"
8. Usuario recibe actualización cuando el administrador revisa la solicitud

### Flujo del Administrador

1. Administrador ve badge con número de solicitudes pendientes
2. Administrador accede a "Verificaciones Manuales"
3. Administrador revisa detalles de la solicitud
4. Administrador hace clic en "Aprobar"
5. Sistema:
   - Actualiza estado a "reviewing"
   - Llama a `manual-verify-payment` edge function
   - Verifica estado con NOWPayments
   - Acredita MXI si el pago está confirmado
   - Actualiza métricas globales
   - Marca solicitud como "approved"
6. Usuario recibe notificación de pago acreditado

## Integración con Sistema Existente

### Edge Function: `manual-verify-payment`

La función existente se reutiliza para:
- Verificar el estado del pago con NOWPayments
- Acreditar MXI al usuario si está confirmado
- Actualizar métricas globales
- Prevenir doble acreditación

### Realtime Subscriptions

- Usuarios: Suscritos a cambios en sus solicitudes
- Administradores: Suscritos a todas las solicitudes

## Mensajes y Comunicación

### Mensajes al Usuario

- **Solicitud Enviada**: "Tu solicitud de verificación manual ha sido enviada exitosamente. Un administrador revisará tu pago en las próximas 2 horas."
- **Pendiente**: "⏳ Verificación manual solicitada. Un administrador revisará tu pago en las próximas 2 horas."
- **Revisando**: "👀 Un administrador está revisando tu pago en este momento."
- **Aprobado**: "✅ Pago acreditado exitosamente"

### Mensajes al Administrador

- **Confirmación de Aprobación**: Muestra detalles del usuario y pago antes de aprobar
- **Pago Acreditado**: "El pago ha sido verificado y acreditado exitosamente. X MXI han sido agregados a la cuenta del usuario."
- **Ya Acreditado**: "Este pago ya había sido acreditado anteriormente."
- **Pago No Confirmado**: "El pago aún no ha sido confirmado por NOWPayments. Estado actual: X"

## Tiempo de Respuesta

- **Objetivo**: Máximo 2 horas
- **Comunicado al usuario**: En todos los mensajes y notificaciones
- **Recomendación**: Revisar solicitudes cada hora durante horario laboral

## Seguridad

1. **Autenticación**: Requiere sesión válida
2. **Autorización**: 
   - Usuarios solo pueden ver/crear sus propias solicitudes
   - Administradores pueden ver/actualizar todas las solicitudes
3. **Validación**: 
   - Verifica que el pago pertenezca al usuario
   - Previene solicitudes duplicadas
   - Verifica estado del pago antes de acreditar
4. **Auditoría**: 
   - Registra quién revisó cada solicitud
   - Registra fecha y hora de revisión
   - Registra notas administrativas

## Archivos Modificados/Creados

### Nuevos Archivos

1. `app/(tabs)/(home)/payment-history.tsx` - Actualizado con botón de solicitud
2. `app/(tabs)/(admin)/manual-verification-requests.tsx` - Nueva pantalla de administración
3. `MANUAL_VERIFICATION_REQUEST_SYSTEM.md` - Esta documentación

### Archivos Modificados

1. `app/(tabs)/(admin)/_layout.tsx` - Agregada nueva ruta
2. `app/(tabs)/(admin)/index.tsx` - Agregado botón de acceso rápido

### Migraciones

1. `create_manual_verification_requests_table` - Crea tabla y políticas RLS

## Próximos Pasos Recomendados

1. **Notificaciones Push**: Implementar notificaciones push cuando se aprueba una solicitud
2. **Email Notifications**: Enviar email al usuario cuando se aprueba/rechaza
3. **Estadísticas**: Agregar métricas de tiempo promedio de respuesta
4. **Filtros Avanzados**: Agregar filtros por fecha, usuario, estado en panel admin
5. **Exportación**: Permitir exportar historial de solicitudes a CSV/Excel

## Notas Importantes

- El sistema reutiliza la lógica existente de `manual-verify-payment` para garantizar consistencia
- Las solicitudes no se pueden eliminar, solo cambiar de estado
- Un pago puede tener solo una solicitud de verificación manual
- El sistema previene doble acreditación verificando el estado del pago
- Los administradores deben verificar que el pago esté realmente confirmado en NOWPayments antes de aprobar manualmente

## Soporte y Mantenimiento

Para cualquier problema o pregunta sobre el sistema:

1. Revisar logs de la edge function `manual-verify-payment`
2. Verificar estado de la solicitud en la tabla `manual_verification_requests`
3. Verificar estado del pago en NOWPayments directamente
4. Revisar políticas RLS si hay problemas de permisos
