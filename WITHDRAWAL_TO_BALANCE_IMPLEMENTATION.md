
# Implementación de Retiro a Balance MXI

## Resumen de Cambios

Se ha implementado la funcionalidad de "Retirar a Balance MXI" para comisiones de referidos y ganancias de torneos, permitiendo a los usuarios transferir estos fondos a su balance principal de MXI.

## Características Implementadas

### 1. Retiro de Comisiones a Balance MXI

**Ubicación:** `app/(tabs)/(home)/referrals.tsx`

**Funcionalidad:**
- Botón "Retirar a Balance MXI" visible cuando el usuario tiene al menos 50 MXI en comisiones
- Formulario para ingresar el monto a retirar
- Validación de requisitos en tiempo real
- Transferencia de `mxi_from_unified_commissions` a `mxi_purchased_directly`

**Requisitos:**
- Mínimo 50 MXI disponibles en comisiones
- 5 referidos activos que hayan comprado el mínimo de MXI
- El monto a retirar debe ser al menos 50 MXI

### 2. Retiro de Ganancias de Torneos a Balance MXI

**Ubicación:** `app/(tabs)/(home)/challenge-history.tsx`

**Funcionalidad:**
- Tarjeta de resumen de ganancias de torneos
- Botón "Retirar a Balance MXI" visible cuando el usuario tiene al menos 50 MXI en ganancias
- Formulario para ingresar el monto a retirar
- Validación de requisitos en tiempo real
- Transferencia de `mxi_from_challenges` a `mxi_purchased_directly`

**Requisitos:**
- Mínimo 50 MXI disponibles en ganancias de torneos
- 5 referidos activos que hayan comprado el mínimo de MXI
- El monto a retirar debe ser al menos 50 MXI

### 3. Funciones de Base de Datos

**Migración:** `add_withdraw_to_balance_functions`

Se crearon dos funciones PostgreSQL:

#### `withdraw_commission_to_mxi_balance(p_user_id UUID, p_amount NUMERIC)`
- Valida que el usuario tenga suficiente saldo en comisiones
- Verifica que tenga al menos 5 referidos activos
- Valida el monto mínimo de 50 MXI
- Transfiere el monto de `mxi_from_unified_commissions` a `mxi_purchased_directly`
- Retorna JSON con el resultado de la operación

#### `withdraw_challenge_to_mxi_balance(p_user_id UUID, p_amount NUMERIC)`
- Valida que el usuario tenga suficiente saldo en ganancias de torneos
- Verifica que tenga al menos 5 referidos activos
- Valida el monto mínimo de 50 MXI
- Transfiere el monto de `mxi_from_challenges` a `mxi_purchased_directly`
- Retorna JSON con el resultado de la operación

### 4. Límites de Compra de MXI

**Ubicación:** `app/(tabs)/(home)/purchase-mxi.tsx`

**Límites Establecidos:**
- **Mínimo:** 20 USDT por transacción
- **Máximo:** 500,000 USDT por transacción

**Validaciones:**
- Verificación del monto mínimo antes de crear la orden
- Verificación del monto máximo antes de crear la orden
- Mensajes de error claros para el usuario
- Notas informativas en la interfaz

## Flujo de Usuario

### Retiro de Comisiones

1. Usuario navega a la pantalla de Referidos
2. Si tiene al menos 50 MXI en comisiones, ve el botón "Retirar a Balance"
3. Hace clic en el botón y se muestra el formulario
4. Ingresa el monto a retirar (mínimo 50 MXI)
5. El sistema valida:
   - Que tenga al menos 5 referidos activos
   - Que el monto sea al menos 50 MXI
   - Que tenga suficiente saldo disponible
6. Confirma la operación
7. El sistema transfiere el monto a su balance principal
8. Recibe confirmación del retiro exitoso

### Retiro de Ganancias de Torneos

1. Usuario navega a la pantalla de Historial de Retos
2. Ve una tarjeta de resumen con sus ganancias totales y disponibles
3. Si tiene al menos 50 MXI en ganancias, ve el botón "Retirar a Balance"
4. Hace clic en el botón y se muestra el formulario
5. Ingresa el monto a retirar (mínimo 50 MXI)
6. El sistema valida:
   - Que tenga al menos 5 referidos activos
   - Que el monto sea al menos 50 MXI
   - Que tenga suficiente saldo disponible
7. Confirma la operación
8. El sistema transfiere el monto a su balance principal
9. Recibe confirmación del retiro exitoso

## Interfaz de Usuario

### Componentes Visuales

**Indicadores de Requisitos:**
- ✅ Checkmark verde cuando se cumple el requisito
- ❌ X roja cuando no se cumple el requisito
- Contador de referidos activos (X/5)
- Indicador de saldo disponible

**Formulario de Retiro:**
- Campo de entrada para el monto
- Botones de Cancelar y Confirmar
- Indicador de carga durante el proceso
- Mensajes de error claros y específicos

**Tarjetas de Información:**
- Resumen de saldo disponible
- Requisitos para retirar
- Descripción de la funcionalidad

## Seguridad

- Las funciones de base de datos usan `SECURITY DEFINER` para ejecutarse con privilegios elevados
- Validación de todos los parámetros en el servidor
- Verificación de propiedad del usuario antes de realizar operaciones
- Transacciones atómicas para garantizar consistencia de datos

## Beneficios para el Usuario

1. **Mayor Flexibilidad:** Los usuarios pueden convertir sus comisiones y ganancias en MXI utilizable
2. **Acceso a Funciones:** El MXI transferido puede usarse para compras y otras funciones de la app
3. **Transparencia:** Visualización clara de saldos y requisitos
4. **Control:** Los usuarios deciden cuándo y cuánto transferir

## Notas Técnicas

- Los retiros se procesan instantáneamente
- No hay comisiones por transferir a balance
- El MXI transferido mantiene todas las propiedades del MXI comprado directamente
- Los límites de compra (20-500,000 USDT) se aplican solo a nuevas compras, no a retiros internos

## Próximos Pasos

- Monitorear el uso de la funcionalidad
- Recopilar feedback de usuarios
- Considerar ajustes a los límites según sea necesario
- Implementar métricas de seguimiento para analizar patrones de uso
