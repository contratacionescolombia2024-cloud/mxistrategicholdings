
# 🔄 Guía del Sistema de Reinicio de Usuarios

## 📋 Descripción General

El sistema de reinicio de usuarios permite a los administradores resetear todos los contadores y saldos de usuarios a cero antes de iniciar la preventa. Esta funcionalidad está diseñada para preparar el sistema para un lanzamiento limpio.

## ⚠️ ADVERTENCIA IMPORTANTE

**Esta acción es IRREVERSIBLE y eliminará permanentemente:**

- ✅ Todos los saldos MXI de usuarios (balance general, vesting, comisiones, retos)
- ✅ Todos los saldos USDT contribuidos
- ✅ Todas las comisiones registradas
- ✅ Todos los referidos y relaciones de referencia
- ✅ Todas las contribuciones históricas
- ✅ Todos los retiros pendientes y completados
- ✅ Todo el historial de retos y torneos
- ✅ Todos los tickets de lotería
- ✅ Todas las sesiones de juego
- ✅ Todas las órdenes de pago (NOWPayments)
- ✅ Todos los calendarios de retiro de MXI
- ✅ Reinicia las métricas a valores iniciales

**NOTA:** La cuenta del administrador que ejecuta el reset NO será afectada.

---

## 🎯 Ubicación

**Panel de Administración → Zona de Peligro**

El botón de reinicio se encuentra en la parte superior del panel de administración, dentro de una sección claramente marcada como "ZONA DE PELIGRO" con fondo rojo.

---

## 🔐 Requisitos de Seguridad

### 1. Permisos de Administrador
- Solo usuarios con rol de administrador en la tabla `admin_users` pueden acceder
- El sistema verifica automáticamente los permisos antes de ejecutar

### 2. Confirmación de Doble Factor
Para ejecutar el reset, debes:
1. Hacer clic en el botón "Reiniciar Todos los Usuarios"
2. Leer cuidadosamente todas las advertencias en el modal
3. Escribir exactamente "RESETEAR" (en mayúsculas) en el campo de confirmación
4. Hacer clic en "Confirmar Reset"

---

## 📊 Proceso de Reinicio

### Paso 1: Acceso al Panel
```
App → Panel de Administración → Zona de Peligro
```

### Paso 2: Iniciar Reset
- Haz clic en el botón rojo "Reiniciar Todos los Usuarios"
- Se abrirá un modal de confirmación

### Paso 3: Revisar Advertencias
El modal muestra una lista completa de lo que se eliminará:
- Saldos MXI y USDT
- Comisiones
- Referidos
- Contribuciones
- Retiros
- Pagos y órdenes
- Métricas

### Paso 4: Confirmar Acción
- Escribe "RESETEAR" en el campo de texto
- El botón "Confirmar Reset" se habilitará
- Haz clic para ejecutar

### Paso 5: Esperar Confirmación
- El sistema procesará el reset (puede tomar unos segundos)
- Verás un mensaje de éxito con el número de usuarios reseteados
- Las estadísticas se actualizarán automáticamente

---

## 🔧 Función de Base de Datos

### `admin_reset_all_users(p_admin_id UUID)`

**Parámetros:**
- `p_admin_id`: UUID del administrador que ejecuta el reset

**Retorna:**
```json
{
  "success": true,
  "message": "✅ Sistema reiniciado exitosamente. X usuarios reseteados a 0.",
  "users_reset": X
}
```

**Operaciones Ejecutadas:**

1. **Verificación de Permisos**
   - Valida que el usuario sea administrador

2. **Reset de Usuarios**
   - `mxi_balance` → 0
   - `usdt_contributed` → 0
   - `mxi_purchased_directly` → 0
   - `mxi_from_unified_commissions` → 0
   - `mxi_from_challenges` → 0
   - `mxi_vesting_locked` → 0
   - `active_referrals` → 0
   - `is_active_contributor` → false
   - `can_withdraw` → false
   - `yield_rate_per_minute` → 0
   - `accumulated_yield` → 0

3. **Eliminación de Datos**
   - DELETE FROM `commissions`
   - DELETE FROM `referrals`
   - DELETE FROM `contributions`
   - DELETE FROM `withdrawals`
   - DELETE FROM `challenge_history`
   - DELETE FROM `lottery_tickets`
   - DELETE FROM `game_participants`
   - DELETE FROM `game_results`
   - DELETE FROM `game_sessions`
   - DELETE FROM `nowpayments_orders`
   - DELETE FROM `mxi_withdrawal_schedule`

4. **Reset de Métricas**
   - `total_members` → 56527 (valor inicial)
   - `total_usdt_contributed` → 0
   - `total_mxi_distributed` → 0
   - `total_tokens_sold` → 0
   - `current_phase` → 1
   - `current_price_usdt` → 0.30
   - `phase_1_tokens_sold` → 0
   - `phase_2_tokens_sold` → 0
   - `phase_3_tokens_sold` → 0

---

## 📱 Interfaz de Usuario

### Zona de Peligro
```
┌─────────────────────────────────────┐
│  ⚠️ ZONA DE PELIGRO                 │
│                                     │
│  Reinicia todos los contadores de   │
│  usuarios a 0 antes de iniciar la   │
│  preventa. Esta acción es           │
│  IRREVERSIBLE.                      │
│                                     │
│  [🔄 Reiniciar Todos los Usuarios]  │
└─────────────────────────────────────┘
```

### Modal de Confirmación
```
┌─────────────────────────────────────┐
│         ⚠️ [ICONO GRANDE]           │
│                                     │
│  ¿Reiniciar Todos los Usuarios?    │
│                                     │
│  Esta acción es IRREVERSIBLE y      │
│  eliminará todos los datos:         │
│                                     │
│  • Todos los saldos MXI y USDT     │
│  • Se eliminarán todas las          │
│    comisiones                       │
│  • Se eliminarán todos los          │
│    referidos                        │
│  • [más advertencias...]            │
│                                     │
│  Escribe "RESETEAR" para confirmar: │
│  [________________]                 │
│                                     │
│  [Cancelar] [Confirmar Reset]       │
└─────────────────────────────────────┘
```

---

## 🎨 Estilos Visuales

### Colores
- **Zona de Peligro:** Fondo rojo claro (`colors.error + '10'`)
- **Borde:** Rojo (`colors.error + '40'`)
- **Botón Reset:** Rojo sólido (`colors.error`)
- **Modal:** Borde rojo de 2px

### Iconos
- **Zona de Peligro:** ⚠️
- **Botón Reset:** 🔄 (arrow.counterclockwise.circle.fill)
- **Modal:** ⚠️ (exclamationmark.triangle.fill)

---

## 🔍 Casos de Uso

### Caso 1: Preparación para Preventa
**Escenario:** Estás listo para lanzar la preventa oficial y quieres empezar con datos limpios.

**Pasos:**
1. Asegúrate de tener un backup de datos importantes (si es necesario)
2. Accede al Panel de Administración
3. Ejecuta el reset siguiendo el proceso de confirmación
4. Verifica que las métricas se hayan reiniciado correctamente
5. Inicia la preventa

### Caso 2: Reset Después de Pruebas
**Escenario:** Has estado probando el sistema con datos de prueba y quieres limpiar todo.

**Pasos:**
1. Documenta cualquier configuración importante
2. Ejecuta el reset
3. Reconfigura las métricas si es necesario
4. Verifica que todo funcione correctamente

---

## ⚡ Rendimiento

- **Tiempo de Ejecución:** 2-5 segundos (depende del número de usuarios)
- **Operaciones:** Múltiples DELETE y UPDATE en transacción
- **Seguridad:** SECURITY DEFINER para permisos elevados
- **Atomicidad:** Todo o nada (si falla, no se aplica ningún cambio)

---

## 🐛 Manejo de Errores

### Error: "No tienes permisos de administrador"
**Causa:** El usuario no está en la tabla `admin_users`
**Solución:** Verifica que tu cuenta tenga permisos de administrador

### Error: "Debes escribir 'RESETEAR' para confirmar"
**Causa:** El texto de confirmación no coincide exactamente
**Solución:** Escribe "RESETEAR" en mayúsculas, sin espacios

### Error en la Ejecución
**Causa:** Error en la base de datos durante el reset
**Solución:** 
1. Revisa los logs de Supabase
2. Verifica la integridad de la base de datos
3. Contacta al soporte técnico si persiste

---

## 📝 Logs y Auditoría

El sistema registra:
- ✅ Quién ejecutó el reset (p_admin_id)
- ✅ Cuándo se ejecutó (timestamp automático)
- ✅ Número de usuarios afectados
- ✅ Resultado de la operación (éxito/error)

**Nota:** Los logs se pueden consultar en:
```sql
-- Ver actividad reciente de admin
SELECT * FROM admin_users WHERE user_id = 'admin_id';
```

---

## 🔒 Seguridad

### Protecciones Implementadas

1. **Verificación de Permisos**
   - Solo administradores pueden ejecutar
   - Verificación en base de datos

2. **Confirmación de Doble Factor**
   - Modal de advertencia
   - Campo de texto de confirmación
   - Botón deshabilitado hasta confirmar

3. **Protección del Admin**
   - La cuenta del admin que ejecuta NO se resetea
   - Preserva acceso administrativo

4. **Transacciones Atómicas**
   - Todo o nada
   - Rollback automático en caso de error

---

## 📞 Soporte

Si encuentras problemas con el sistema de reset:

1. **Verifica los logs de Supabase:**
   - Panel de Supabase → Logs → API
   - Busca errores relacionados con `admin_reset_all_users`

2. **Revisa los permisos:**
   - Confirma que eres administrador
   - Verifica RLS policies

3. **Contacta al equipo técnico:**
   - Proporciona el mensaje de error exacto
   - Indica cuándo ocurrió el problema
   - Describe los pasos que seguiste

---

## ✅ Checklist Pre-Reset

Antes de ejecutar el reset, verifica:

- [ ] Tienes permisos de administrador
- [ ] Has informado al equipo sobre el reset
- [ ] Has documentado configuraciones importantes
- [ ] Entiendes que la acción es irreversible
- [ ] Estás listo para iniciar la preventa
- [ ] Has verificado que no hay operaciones críticas en curso
- [ ] Tienes tiempo para verificar el resultado

---

## 🎯 Después del Reset

Tareas a realizar después del reset:

1. **Verificar Métricas**
   - Confirma que `total_members` = 56527
   - Verifica que `current_phase` = 1
   - Confirma que `current_price_usdt` = 0.30

2. **Verificar Usuarios**
   - Todos los saldos en 0
   - No hay referidos activos
   - No hay comisiones pendientes

3. **Comunicar al Equipo**
   - Notifica que el reset se completó
   - Confirma que el sistema está listo

4. **Iniciar Preventa**
   - Activa los sistemas de pago
   - Habilita las compras de MXI
   - Monitorea las primeras transacciones

---

## 📚 Referencias

- **Función de Base de Datos:** `admin_reset_all_users`
- **Archivo de Migración:** `admin_reset_all_users_function`
- **Componente UI:** `app/(tabs)/(admin)/index.tsx`
- **Tabla de Permisos:** `admin_users`

---

**Última Actualización:** 2025
**Versión:** 1.0.0
**Autor:** Sistema MXI Strategic
