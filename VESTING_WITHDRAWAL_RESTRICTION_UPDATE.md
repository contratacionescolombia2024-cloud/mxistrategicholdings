
# Actualización: Restricción de Retiro de Saldo de Vesting

## Resumen de Cambios

Se han implementado las siguientes modificaciones para restringir el retiro y unificación del saldo de vesting hasta el lanzamiento oficial de la moneda MXI:

## 1. Eliminación del Botón "Unificar Saldo"

### Archivo: `components/VestingCounter.tsx`

**Cambios realizados:**
- ✅ **Eliminado completamente** el botón "Unificar Saldo de Vesting"
- ✅ **Eliminada** la función `handleUnifyBalance` que permitía unificar el saldo
- ✅ **Actualizado** el mensaje informativo para indicar que el saldo no se puede retirar hasta el lanzamiento
- ✅ **Mantenido** el contador en tiempo real del rendimiento del 3% mensual
- ✅ **Mantenida** toda la visualización de métricas y estadísticas de vesting

**Mensaje actualizado:**
```
"El saldo de vesting genera un rendimiento del 3% mensual. Este saldo no se puede 
retirar hasta que se lance la moneda oficialmente. Una vez lanzada, podrás retirar 
tu saldo de vesting cumpliendo los requisitos de retiro."
```

## 2. Actualización de la Pantalla de Vesting

### Archivo: `app/(tabs)/(home)/vesting.tsx`

**Cambios realizados:**
- ✅ **Agregada** verificación del estado de lanzamiento de la moneda
- ✅ **Agregada** tarjeta de advertencia cuando la moneda no está lanzada
- ✅ **Mostrado** contador de días hasta el lanzamiento
- ✅ **Agregado** indicador visual del estado de retiro (Habilitado/Bloqueado)
- ✅ **Agregado** botón de "Retirar MXI" que solo aparece después del lanzamiento

**Características nuevas:**
- Tarjeta de advertencia con ícono de alerta
- Contador de días hasta el lanzamiento
- Estado visual claro del bloqueo de retiros
- Botón de acción que solo se muestra post-lanzamiento

## 3. Restricción en Pantalla de Retiro de MXI

### Archivo: `app/(tabs)/(home)/withdraw-mxi.tsx`

**Cambios realizados:**
- ✅ **Agregada** validación en `handleWithdraw` para verificar si la moneda está lanzada
- ✅ **Actualizado** el requisito de "Pool Launch Date" a "Lanzamiento de Moneda"
- ✅ **Agregada** advertencia visual cuando la moneda no está lanzada
- ✅ **Ocultado** el formulario de retiro hasta que la moneda esté lanzada
- ✅ **Actualizada** la información de advertencia en español

**Validación implementada:**
```typescript
if (!poolStatus?.is_mxi_launched) {
  Alert.alert(
    'Retiro No Disponible',
    `El saldo de vesting no se puede retirar hasta que se lance la moneda oficialmente.
    
Tiempo restante: ${poolStatus?.days_until_launch || 0} días`,
    [{ text: 'Entendido' }]
  );
  return;
}
```

## 4. Flujo de Usuario Actualizado

### Antes del Lanzamiento:
1. ✅ El usuario puede ver su saldo de vesting
2. ✅ El usuario puede ver el rendimiento acumulándose en tiempo real
3. ✅ El usuario ve claramente que el retiro está bloqueado
4. ✅ El usuario ve cuántos días faltan para el lanzamiento
5. ❌ El usuario NO puede unificar el saldo
6. ❌ El usuario NO puede retirar el saldo de vesting

### Después del Lanzamiento:
1. ✅ El usuario puede ver su saldo de vesting
2. ✅ El usuario puede ver el rendimiento acumulado
3. ✅ El usuario ve que el retiro está habilitado
4. ✅ El usuario puede retirar su saldo cumpliendo requisitos:
   - 5 referidos activos
   - KYC aprobado
   - Moneda lanzada oficialmente

## 5. Requisitos para Retiro de Vesting (Post-Lanzamiento)

Para poder retirar el saldo de vesting una vez lanzada la moneda, el usuario debe cumplir:

1. **5 Referidos Activos** ✓
2. **KYC Aprobado** ✓
3. **Moneda Lanzada** ✓ (NUEVO REQUISITO)

## 6. Mensajes de Usuario

### Mensajes Informativos:
- "El saldo de vesting no se puede unificar ni retirar hasta que se lance la moneda oficialmente"
- "Bloqueado hasta el lanzamiento oficial (X días)"
- "Una vez lanzada, podrás retirar tu saldo cumpliendo los requisitos de retiro"

### Mensajes de Error:
- "Retiro No Disponible: El saldo de vesting no se puede retirar hasta que se lance la moneda oficialmente. Tiempo restante: X días"

## 7. Impacto en la Base de Datos

**No se requieren cambios en la base de datos.** 

La funcionalidad utiliza:
- Tabla `mxi_withdrawal_schedule` (existente)
- Tabla `metrics` con campo `mxi_launch_date` (existente)
- Función `get_pool_status()` (existente)

## 8. Verificación de Implementación

### Checklist de Pruebas:
- [ ] El botón "Unificar Saldo" ya no aparece en VestingCounter
- [ ] El contador de vesting sigue funcionando en tiempo real
- [ ] La pantalla de vesting muestra advertencia de bloqueo
- [ ] El contador de días hasta lanzamiento es visible
- [ ] El formulario de retiro está oculto antes del lanzamiento
- [ ] Al intentar retirar antes del lanzamiento, aparece alerta
- [ ] Después del lanzamiento, el botón de retiro aparece
- [ ] Los requisitos de retiro se muestran correctamente

## 9. Archivos Modificados

1. `components/VestingCounter.tsx` - Eliminado botón de unificación
2. `app/(tabs)/(home)/vesting.tsx` - Agregadas restricciones y advertencias
3. `app/(tabs)/(home)/withdraw-mxi.tsx` - Agregada validación de lanzamiento

## 10. Notas Importantes

- ⚠️ El saldo de vesting continúa generando rendimiento del 3% mensual
- ⚠️ El contador en tiempo real sigue funcionando normalmente
- ⚠️ Los usuarios pueden ver toda la información de su vesting
- ⚠️ La restricción es solo para retiro y unificación
- ⚠️ Una vez lanzada la moneda, todo funciona normalmente

## Fecha de Implementación
Enero 2025

## Estado
✅ **COMPLETADO** - Todas las restricciones implementadas correctamente
