
# Guía Rápida: Sistema de Embajadores MXI

## Para Administradores

### ¿Qué Pagos Cuentan para Bonos de Embajador?

Ahora **TODOS** los siguientes tipos de pagos cuentan para los bonos de embajador:

#### 1. ✅ Pagos Automáticos
- Pagos procesados automáticamente por NowPayments
- Status: `finished` o `confirmed`
- **Acción requerida**: Ninguna, se cuentan automáticamente

#### 2. ✅ Validaciones Manuales Aprobadas
- Pagos que el usuario solicitó verificar manualmente
- Aprobados por un administrador en "Solicitudes de Verificación Manual"
- **Acción requerida**: Aprobar la solicitud en el panel de admin

#### 3. ✅ Pagos Asignados por Administrador
- Pagos creados directamente por el admin usando "Acreditar Pago Manual"
- Identificados por order_id que comienza con `ADMIN-`
- **Acción requerida**: Marcar "Generar comisiones para referidores" al crear el pago

### Cómo Acreditar un Pago Manual que Cuente para Bonos

1. Ir a **Panel de Admin** → **Acreditar Pago Manual**
2. Seleccionar el usuario
3. Ingresar el monto en USDT (mínimo 50 USDT)
4. **IMPORTANTE**: ✅ Marcar "Generar comisiones para referidores"
5. Hacer clic en "Acreditar Pago"

El sistema automáticamente:
- Creará el pago con order_id `ADMIN-XXXXX`
- Actualizará el nivel de embajador del referidor
- Generará las comisiones correspondientes

### Cómo Aprobar una Verificación Manual

1. Ir a **Panel de Admin** → **Solicitudes de Verificación Manual**
2. Revisar la evidencia del pago (captura de pantalla, tx_hash)
3. Hacer clic en **"Aprobar"**

El sistema automáticamente:
- Marcará el pago como válido
- Actualizará el nivel de embajador del referidor
- Generará las comisiones correspondientes

### Verificar Bonos de un Usuario

#### Opción 1: Consulta SQL Simple
```sql
-- Ver el total de compras válidas de referidos nivel 1
SELECT calculate_valid_purchases_level1('USER-UUID-AQUI');
```

#### Opción 2: Desglose Detallado
```sql
-- Ver desglose por tipo de pago
SELECT * FROM get_ambassador_purchase_breakdown('USER-UUID-AQUI');
```

Resultado ejemplo:
```
payment_type      | count | total_amount
------------------+-------+-------------
automatic         |     5 |       500.00
manual_approved   |     2 |       150.00
admin_assigned    |     3 |       300.00
```

#### Opción 3: Ver Nivel Completo
```sql
-- Ver toda la información de embajador
SELECT * FROM update_ambassador_level('USER-UUID-AQUI');
```

### Niveles de Embajador

| Nivel | Nombre | Requisito | Bono | Emoji |
|-------|--------|-----------|------|-------|
| 1 | Bronce | 300 USDT | +10 USDT | 🥉 |
| 2 | Plata | 1,000 USDT | +30 USDT | 🥈 |
| 3 | Oro | 2,500 USDT | +100 USDT | 🥇 |
| 4 | Diamante | 10,000 USDT | +600 USDT | 💎 |
| 5 | Élite Global | 25,000 USDT | +2,000 USDT | 🟪 |
| 6 | Embajador Legendario MXI | 50,000 USDT | +5,000 USDT | 🟦 |

**Nota**: Los bonos son **acumulativos**. Un usuario que alcanza nivel 3 puede retirar 10 + 30 + 100 = 140 USDT en total.

### Aprobar Retiros de Bonos

1. Ir a **Panel de Admin** → **Retiros de Bonos de Embajador**
2. Revisar la solicitud:
   - Usuario cumple requisitos (KYC, compra personal, nivel alcanzado)
   - Dirección USDT TRC20 es válida
   - Monto corresponde a los bonos no retirados
3. Procesar el pago manualmente a la dirección TRC20
4. Hacer clic en **"Aprobar"** en el panel

El sistema automáticamente:
- Marcará los bonos como retirados
- Actualizará el total de bonos retirados
- Enviará notificación al usuario

### Requisitos para que un Usuario Retire Bonos

El usuario debe cumplir **TODOS** estos requisitos:

1. ✅ **Nivel Alcanzado**: Haber alcanzado al menos el nivel 1 (Bronce)
2. ✅ **KYC Aprobado**: Tener verificación KYC aprobada
3. ✅ **Compra Personal**: Haber realizado al menos 1 compra personal de MXI
4. ✅ **Bonos Disponibles**: Tener bonos no retirados

**Método de Retiro**: Solo USDT TRC20

### Solución de Problemas Comunes

#### Problema: "El usuario dice que hizo una compra pero no cuenta para bonos"

**Verificar**:
1. ¿El pago es de un referido **directo** (nivel 1)?
   ```sql
   SELECT * FROM referrals WHERE referred_id = 'USER-UUID' AND level = 1;
   ```

2. ¿El pago es de al menos 50 USDT?
   ```sql
   SELECT * FROM payments WHERE user_id = 'USER-UUID' AND price_amount >= 50;
   ```

3. ¿El pago está en status correcto?
   ```sql
   SELECT status, order_id FROM payments WHERE user_id = 'USER-UUID';
   ```
   - Debe ser: `finished`, `confirmed`, o tener verificación manual aprobada, o order_id con `ADMIN-`

4. ¿El pago es en USD?
   ```sql
   SELECT price_currency FROM payments WHERE user_id = 'USER-UUID';
   ```
   - Debe ser: `usd`

#### Problema: "El botón de retiro no aparece"

**Solución**: El botón SIEMPRE debe aparecer si hay bonos disponibles. Si no aparece:

1. Verificar que el usuario tiene bonos:
   ```sql
   SELECT * FROM ambassador_levels WHERE user_id = 'USER-UUID';
   ```

2. Pedir al usuario que:
   - Cierre y abra la app
   - Haga clic en el botón de refrescar (🔄)
   - Verifique su conexión a internet

3. Revisar logs del navegador/app (buscar '[Embajadores MXI]')

#### Problema: "La página tarda mucho en cargar"

**Solución**: 

1. Verificar que los índices existen:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename IN ('payments', 'manual_verification_requests', 'referrals');
   ```

2. Si faltan índices, ejecutar:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_payments_user_status_amount 
   ON payments(user_id, status, price_amount) 
   WHERE price_currency = 'usd' AND price_amount >= 50;

   CREATE INDEX IF NOT EXISTS idx_payments_order_id_pattern 
   ON payments(order_id) 
   WHERE order_id LIKE 'ADMIN-%';

   CREATE INDEX IF NOT EXISTS idx_manual_verification_payment_status 
   ON manual_verification_requests(payment_id, status) 
   WHERE status = 'approved';
   ```

3. La página ahora tiene:
   - Timeout de 15 segundos
   - Sistema de reintentos automáticos
   - Si sigue fallando, revisar logs de Supabase

### Comandos Útiles para Debugging

```sql
-- Ver todos los pagos válidos de un usuario
SELECT 
  p.order_id,
  p.price_amount,
  p.status,
  p.created_at,
  CASE 
    WHEN p.status IN ('finished', 'confirmed') THEN 'Automático'
    WHEN mvr.status = 'approved' THEN 'Manual Aprobado'
    WHEN p.order_id LIKE 'ADMIN-%' THEN 'Admin Asignado'
    ELSE 'No Válido'
  END as tipo_pago
FROM referrals r
INNER JOIN payments p ON p.user_id = r.referred_id
LEFT JOIN manual_verification_requests mvr ON mvr.payment_id = p.id
WHERE r.referrer_id = 'USER-UUID'
  AND r.level = 1
  AND p.price_amount >= 50
  AND p.price_currency = 'usd'
ORDER BY p.created_at DESC;

-- Ver el estado actual de embajador
SELECT 
  al.*,
  u.name,
  u.email
FROM ambassador_levels al
INNER JOIN users u ON u.id = al.user_id
WHERE al.user_id = 'USER-UUID';

-- Ver solicitudes de retiro pendientes
SELECT 
  abw.*,
  u.name,
  u.email,
  al.current_level
FROM ambassador_bonus_withdrawals abw
INNER JOIN users u ON u.id = abw.user_id
INNER JOIN ambassador_levels al ON al.user_id = abw.user_id
WHERE abw.status = 'pending'
ORDER BY abw.created_at DESC;
```

### Checklist de Verificación Diaria

- [ ] Revisar solicitudes de verificación manual pendientes
- [ ] Aprobar/rechazar retiros de bonos pendientes
- [ ] Verificar que no hay errores en los logs
- [ ] Confirmar que las actualizaciones en tiempo real funcionan
- [ ] Revisar métricas de rendimiento (tiempo de carga < 15s)

### Contacto de Soporte

Si hay problemas técnicos que no puedes resolver:

1. Revisar este documento primero
2. Revisar `EMBAJADORES_MXI_FIX_SUMMARY.md` para detalles técnicos
3. Ejecutar las consultas de debugging
4. Documentar el problema con:
   - UUID del usuario afectado
   - Capturas de pantalla
   - Logs relevantes
   - Consultas SQL ejecutadas y sus resultados

---

**Última Actualización**: 2025-01-XX
**Versión del Sistema**: 1.0
