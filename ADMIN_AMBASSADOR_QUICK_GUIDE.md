
# 🎯 Guía Rápida: Embajadores MXI para Administradores

## ✅ Resumen Ejecutivo

**Todos los pagos asignados por el administrador con comisión y las validaciones manuales aprobadas ahora cuentan para los bonos de Embajadores MXI.**

---

## 🔧 Cómo Funciona

### 1. Añadir Saldo CON Comisión

**Ubicación:** Panel de Administrador → Gestión de Usuarios → Seleccionar Usuario → "Añadir Con Comisión"

**Qué hace:**
- ✅ Añade MXI al balance del usuario
- ✅ Genera comisiones para sus referidores (5%, 2%, 1%)
- ✅ **Crea un registro de pago que cuenta para Embajadores MXI**
- ✅ **Actualiza automáticamente el nivel de embajador del referidor**

**Ejemplo:**
```
Usuario: Juan Pérez
Referidor: María García
Acción: Añadir 500 MXI con comisión

Resultado:
1. Juan recibe 500 MXI
2. María recibe 25 MXI de comisión (5%)
3. Se crea pago: ADMIN-1234567890-abc123
4. Monto USDT: $200 (500 MXI × $0.40)
5. María suma $200 a sus compras válidas de embajador
6. Si María alcanza un nuevo nivel, recibe notificación
```

---

### 2. Aprobar Validación Manual

**Ubicación:** Panel de Administrador → Solicitudes de Verificación Manual → Aprobar

**Qué hace:**
- ✅ Marca el pago como aprobado
- ✅ **Cuenta para Embajadores MXI si es >= 50 USDT**
- ✅ **Actualiza automáticamente el nivel de embajador del referidor**

**Ejemplo:**
```
Usuario: Pedro López
Referidor: Ana Martínez
Pago: $100 USDT
Acción: Aprobar validación manual

Resultado:
1. Pedro recibe su MXI
2. Ana suma $100 a sus compras válidas de embajador
3. Si Ana alcanza un nuevo nivel, recibe notificación
```

---

## 📊 Niveles de Embajador

| Nivel | Nombre | Requisito | Bono | Emoji |
|-------|--------|-----------|------|-------|
| 1 | Bronce | $300 USDT | +$10 USDT | 🥉 |
| 2 | Plata | $1,000 USDT | +$30 USDT | 🥈 |
| 3 | Oro | $2,500 USDT | +$100 USDT | 🥇 |
| 4 | Diamante | $10,000 USDT | +$600 USDT | 💎 |
| 5 | Élite Global | $25,000 USDT | +$2,000 USDT | 🟪 |
| 6 | Legendario | $50,000 USDT | +$5,000 USDT | 🟦 |

**Importante:**
- Los bonos son **acumulativos** (si alcanzas nivel 3, recibes $10 + $30 + $100 = $140 USDT)
- Los bonos son **adicionales** a la comisión del 5%
- Solo cuentan compras de **referidos directos (Nivel 1)**
- Monto mínimo por compra: **50 USDT**

---

## ✅ Qué Cuenta para Embajadores MXI

### ✅ SÍ Cuenta

1. **Pagos Automáticos**
   - Usuario paga vía NOWPayments
   - Estado: 'finished' o 'confirmed'
   - Monto: >= 50 USDT

2. **Validaciones Manuales Aprobadas**
   - Usuario solicita verificación manual
   - Admin aprueba
   - Monto: >= 50 USDT

3. **Pagos Asignados por Admin CON Comisión**
   - Admin usa "Añadir Con Comisión"
   - Se crea registro de pago automáticamente
   - Monto equivalente: >= 50 USDT

### ❌ NO Cuenta

1. **Pagos Asignados por Admin SIN Comisión**
   - Admin usa "Añadir Sin Comisión"
   - No se crea registro de pago
   - No cuenta para embajadores

2. **Pagos Menores a 50 USDT**
   - Cualquier pago < 50 USDT
   - No importa el tipo

3. **Referidos de Nivel 2 o 3**
   - Solo cuentan referidos directos (Nivel 1)

4. **Pagos Pendientes o Rechazados**
   - Estado: 'pending', 'failed', 'rejected'

---

## 🔍 Verificar Cálculos

### Ver Detalles de Cálculo

```sql
-- Ver todos los pagos de referidos de nivel 1 y si cuentan para embajador
SELECT * FROM get_ambassador_calculation_details('USER_ID_AQUI');
```

**Resultado muestra:**
- ID del pago
- Monto en USDT
- Si es pago de admin
- Si tiene aprobación manual
- **Si cuenta para embajador (true/false)**

### Recalcular Manualmente

```sql
-- Forzar recálculo del nivel de embajador
SELECT admin_recalculate_ambassador_level('USER_ID_AQUI');
```

**Cuándo usar:**
- Después de corregir datos manualmente
- Si los números no coinciden
- Para verificar cálculos

---

## 🎯 Casos de Uso Comunes

### Caso 1: Usuario Pagó Pero No Se Reflejó

**Problema:** Usuario dice que pagó pero no aparece en su balance

**Solución:**
1. Verificar en tabla `payments` si existe el pago
2. Si existe pero estado es 'pending':
   - Opción A: Aprobar manualmente en "Solicitudes de Verificación Manual"
   - Opción B: Usar "Añadir Con Comisión" para acreditar
3. El sistema automáticamente actualizará el nivel de embajador del referidor

### Caso 2: Referidor No Ve Actualización de Nivel

**Problema:** Referidor dice que su referido pagó pero su nivel no subió

**Solución:**
1. Verificar que el pago sea >= 50 USDT
2. Verificar que el referido sea de Nivel 1 (directo)
3. Usar función de debug:
   ```sql
   SELECT * FROM get_ambassador_calculation_details('REFERRER_ID');
   ```
4. Si el pago debería contar pero no cuenta:
   ```sql
   SELECT admin_recalculate_ambassador_level('REFERRER_ID');
   ```

### Caso 3: Acreditar Pago Retroactivo

**Problema:** Usuario pagó hace tiempo pero no se registró

**Solución:**
1. Ir a Gestión de Usuarios
2. Seleccionar el usuario
3. Usar "Añadir Con Comisión"
4. Ingresar el monto de MXI correspondiente
5. El sistema:
   - Crea registro de pago con USDT equivalente
   - Genera comisiones
   - Actualiza nivel de embajador del referidor
   - Envía notificación en tiempo real

---

## 📱 Notificaciones en Tiempo Real

Cuando actualizas un nivel de embajador, el usuario recibe:

1. **Notificación Push** (si está habilitada)
2. **Actualización en Tiempo Real** en la página "Embajadores MXI"
3. **Mensaje:** "¡Felicidades! Has alcanzado el nivel X de embajador"

---

## 🚨 Errores Comunes

### Error: "No tienes permisos de administrador"

**Causa:** Tu usuario no está en la tabla `admin_users`

**Solución:** Contactar a super admin para agregar permisos

### Error: "Usuario no encontrado"

**Causa:** ID de usuario incorrecto

**Solución:** Verificar el ID en la tabla `users`

### Error: "El monto debe ser mayor a 0"

**Causa:** Intentaste añadir 0 o número negativo

**Solución:** Ingresar un monto válido > 0

---

## 📊 Reportes Útiles

### Ver Todos los Embajadores

```sql
SELECT 
  u.name,
  u.email,
  al.total_valid_purchases,
  al.current_level,
  CASE al.current_level
    WHEN 1 THEN 'Bronce 🥉'
    WHEN 2 THEN 'Plata 🥈'
    WHEN 3 THEN 'Oro 🥇'
    WHEN 4 THEN 'Diamante 💎'
    WHEN 5 THEN 'Élite Global 🟪'
    WHEN 6 THEN 'Legendario 🟦'
    ELSE 'Sin Nivel'
  END as level_name
FROM users u
INNER JOIN ambassador_levels al ON al.user_id = u.id
WHERE al.current_level > 0
ORDER BY al.total_valid_purchases DESC;
```

### Ver Pagos de Admin

```sql
SELECT 
  p.order_id,
  u.name as user_name,
  p.price_amount as usdt_amount,
  p.mxi_amount,
  p.created_at,
  (SELECT name FROM users WHERE id = u.referred_by) as referrer_name
FROM payments p
INNER JOIN users u ON u.id = p.user_id
WHERE p.order_id LIKE 'ADMIN-%'
ORDER BY p.created_at DESC;
```

---

## ✅ Checklist de Verificación

Antes de procesar un retiro de bono de embajador, verificar:

- [ ] Usuario tiene KYC aprobado
- [ ] Usuario tiene al menos 1 compra personal
- [ ] Usuario ha alcanzado el nivel completamente
- [ ] Los bonos no han sido retirados previamente
- [ ] La dirección USDT TRC20 es válida (empieza con T, 34 caracteres)

---

## 🎉 Resumen

**Todo está automatizado:**

1. Añades saldo con comisión → Sistema crea pago → Actualiza embajador
2. Apruebas validación manual → Sistema actualiza embajador
3. Usuario ve actualización en tiempo real
4. No necesitas hacer nada más

**Si algo no funciona:**

1. Usa `get_ambassador_calculation_details()` para debug
2. Usa `admin_recalculate_ambassador_level()` para forzar recálculo
3. Verifica que el pago cumpla los requisitos (>= 50 USDT, nivel 1)

---

**Última Actualización:** 4 de Diciembre, 2024
**Estado:** ✅ FUNCIONANDO CORRECTAMENTE
