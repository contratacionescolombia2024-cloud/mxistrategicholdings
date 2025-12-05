
# Mejoras al Gráfico y Sistema de Retiros MXI

## Resumen de Cambios

Se han implementado mejoras significativas al gráfico de balance MXI y al sistema de retiros, según las especificaciones solicitadas.

---

## 1. Mejoras al Gráfico de Balance Total MXI

### Cambios Implementados:

#### ✅ Línea Inicia desde 0
- El gráfico ahora siempre inicia desde 0 en el eje Y
- La primera línea conecta desde el punto (0, 0) hasta el primer punto de datos
- Esto proporciona una visualización clara del crecimiento desde el inicio

#### ✅ Interconexión de Puntos
- Todos los puntos del gráfico están interconectados con líneas suaves
- Se utiliza curvas Bézier cuadráticas para transiciones suaves entre puntos
- No hay espacios vacíos entre los datos

#### ✅ Total MXI Calculado de Todas las Fuentes
El total de MXI ahora incluye la suma de:
- **MXI Comprados**: Adquiridos mediante compras con USDT
- **MXI Comisiones**: Obtenidos de comisiones de referidos unificadas
- **MXI Torneos**: Ganados en torneos y desafíos
- **MXI Vesting**: Generado por rendimiento (3% mensual solo de MXI comprados)

```typescript
totalBalance = mxiPurchased + mxiCommissions + mxiTournaments + mxiVesting
```

#### ✅ Escala Vertical Dinámica (2x Total MXI)
- La escala del eje Y es siempre **2 veces el total de MXI**
- Esto previene que el gráfico quede pegado en la parte superior
- Proporciona un balance visual óptimo
- Se adapta automáticamente cuando el usuario:
  - Compra más MXI
  - Gana MXI en torneos
  - Acumula vesting
  - Retira o pierde MXI

```typescript
const maxY = currentTotal * 2;  // Escala 2x para balance visual
const minY = 0;                 // Siempre inicia desde 0
```

#### ✅ Actualización en Tiempo Real
- El gráfico se actualiza automáticamente según el timeframe seleccionado
- Intervalos de actualización:
  - 5min/15min: cada 5 segundos
  - 1h: cada 10 segundos
  - 24h: cada 1 minuto
  - 7d: cada 5 minutos

### Características Visuales:

1. **Área Rellena con Gradiente**: Muestra el área bajo la curva con gradiente verde
2. **Línea Principal con Brillo**: Línea verde brillante con efecto de resplandor amarillo
3. **Puntos de Datos Destacados**: Círculos con brillo en puntos clave
4. **Leyenda de Colores**: Identifica cada fuente de MXI
5. **Desglose Detallado**: Tarjetas con barras de progreso para cada categoría

---

## 2. Nueva Página de Retiros Completa

### Ubicación:
`app/(tabs)/(home)/retiros.tsx`

### Características:

#### ✅ Cuatro Tipos de Retiro Separados:

1. **🛒 Retirar MXI Comprados**
   - MXI adquiridos mediante compras con USDT
   - **Bloqueado hasta el lanzamiento oficial de MXI**
   - Requiere: 5 referidos activos + KYC aprobado

2. **💵 Retirar Comisiones (USDT)**
   - Comisiones en USDT de referidos
   - **Disponible inmediatamente** (con requisitos cumplidos)
   - Requiere: 5 referidos activos + KYC aprobado

3. **🔒 Retirar MXI Vesting**
   - MXI generado por rendimiento (3% mensual)
   - **Bloqueado hasta el lanzamiento oficial de MXI**
   - Requiere: 5 referidos activos + KYC aprobado

4. **🏆 Retirar MXI Torneos**
   - MXI ganado en torneos y desafíos
   - **Disponible después del lanzamiento**
   - Requiere: 5 referidos activos + KYC aprobado

### Interfaz de Usuario:

#### Resumen de Saldos
```
┌─────────────────────────────────────┐
│  💰 Resumen de Saldos               │
├─────────────────────────────────────┤
│  🛒 MXI Comprados      │  💵 Comis. │
│  1,234.56 MXI          │  $567.89   │
│  🔒 Bloqueado          │  ✅ Disp.  │
├─────────────────────────────────────┤
│  🔒 MXI Vesting        │  🏆 Torneos│
│  0.123456 MXI          │  89.12 MXI │
│  🔒 Bloqueado          │  ✅ Disp.  │
└─────────────────────────────────────┘
```

#### Selector de Tipo de Retiro
- Tarjetas visuales para cada tipo
- Indicadores de bloqueo para tipos no disponibles
- Resaltado del tipo seleccionado

#### Formulario de Retiro
- Campo de cantidad con botón "MÁXIMO"
- Campo de dirección de billetera TRC20
- Validación en tiempo real
- Botón de confirmación

### Lógica de Disponibilidad:

```typescript
// MXI Comprados y Vesting
if (!poolStatus?.isLaunched) {
  // Bloqueado hasta lanzamiento
  Alert.alert('Retiro No Disponible', 
    'Disponible después del lanzamiento oficial');
}

// Comisiones USDT
if (canWithdrawCommission && balanceAvailable > 0) {
  // Disponible inmediatamente
}

// MXI Torneos
if (poolStatus?.isLaunched && canWithdrawMXI) {
  // Disponible después del lanzamiento
}
```

---

## 3. Acciones Rápidas en Home

Se agregó una sección de "Acciones Rápidas" en la página principal con acceso directo a:

- 💳 **Comprar MXI**: Acceso rápido a la página de pagos
- 💰 **Retiros**: Acceso directo a la nueva página de retiros
- 👥 **Referidos**: Ver y gestionar referidos
- 📈 **Vesting**: Ver detalles de vesting

---

## 4. Base de Datos

### Tabla `withdrawals`
Ya existente, se utiliza para registrar todas las solicitudes de retiro:

```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount NUMERIC,
  currency TEXT CHECK (currency IN ('USDT', 'MXI')),
  wallet_address TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Campos de Usuario Relevantes:
- `mxi_purchased_directly`: MXI comprados con USDT
- `mxi_from_unified_commissions`: MXI de comisiones
- `mxi_from_challenges`: MXI de torneos
- `mxi_vesting_locked`: MXI de vesting
- `commissions.available`: Comisiones USDT disponibles

---

## 5. Flujo de Retiro

### Paso 1: Verificación de Requisitos
```typescript
✓ KYC aprobado
✓ 5 referidos activos
✓ Lanzamiento de MXI (para MXI comprados y vesting)
```

### Paso 2: Selección de Tipo
```typescript
Usuario selecciona:
- MXI Comprados
- Comisiones USDT
- MXI Vesting
- MXI Torneos
```

### Paso 3: Ingreso de Datos
```typescript
- Cantidad (con validación de saldo disponible)
- Dirección de billetera TRC20
```

### Paso 4: Confirmación
```typescript
Alert.alert('Solicitud Enviada',
  'Tu solicitud será procesada en 24-48 horas');
```

### Paso 5: Procesamiento Admin
```typescript
Admin revisa y aprueba/rechaza en:
app/(tabs)/(admin)/withdrawal-approvals.tsx
```

---

## 6. Validaciones Implementadas

### Validaciones de Cantidad:
- ✅ Cantidad mayor a 0
- ✅ No exceder saldo disponible
- ✅ Formato numérico válido

### Validaciones de Elegibilidad:
- ✅ KYC aprobado
- ✅ Mínimo 5 referidos activos
- ✅ Lanzamiento de MXI (para tipos bloqueados)

### Validaciones de Dirección:
- ✅ Campo no vacío
- ✅ Formato de dirección válido

---

## 7. Mensajes de Usuario

### Retiro Exitoso:
```
✅ Solicitud Enviada
Tu solicitud de retiro de X MXI/USDT ha sido enviada 
exitosamente. Será procesada en 24-48 horas.
```

### Retiro Bloqueado:
```
🔒 Retiro No Disponible
Los retiros de MXI Comprados/Vesting estarán disponibles 
después del lanzamiento oficial de MXI.

Tiempo restante: X días
```

### No Elegible:
```
❌ No Elegible
Necesitas al menos 5 referidos activos y KYC aprobado 
para retirar.
```

---

## 8. Información Importante para Usuarios

### Disponibilidad de Retiros:

| Tipo | Disponibilidad | Requisitos |
|------|---------------|------------|
| Comisiones USDT | ✅ Inmediato | 5 referidos + KYC |
| MXI Torneos | ⏳ Post-lanzamiento | 5 referidos + KYC |
| MXI Comprados | 🔒 Post-lanzamiento | 5 referidos + KYC |
| MXI Vesting | 🔒 Post-lanzamiento | 5 referidos + KYC |

### Tiempos de Procesamiento:
- **Solicitud → Revisión**: Inmediato
- **Revisión → Aprobación**: 24-48 horas
- **Aprobación → Transferencia**: 24-48 horas

---

## 9. Archivos Modificados

### Nuevos Archivos:
- `app/(tabs)/(home)/retiros.tsx` - Nueva página de retiros completa

### Archivos Modificados:
- `components/TotalMXIBalanceChart.tsx` - Mejoras al gráfico
- `app/(tabs)/(home)/index.tsx` - Agregado acciones rápidas

### Archivos Existentes (Sin Cambios):
- `app/(tabs)/(home)/withdrawal.tsx` - Página antigua (puede mantenerse o eliminarse)
- `app/(tabs)/(home)/withdrawals.tsx` - Historial de retiros
- `app/(tabs)/(home)/withdraw-mxi.tsx` - Retiro de MXI (puede mantenerse o eliminarse)

---

## 10. Próximos Pasos Recomendados

### Para el Usuario:
1. Verificar KYC si no está aprobado
2. Invitar referidos para alcanzar 5 activos
3. Esperar el lanzamiento de MXI para retiros bloqueados

### Para el Admin:
1. Revisar solicitudes de retiro en el panel admin
2. Aprobar/rechazar según políticas
3. Procesar transferencias a billeteras

### Para el Desarrollador:
1. Considerar eliminar páginas antiguas de retiro si ya no se usan
2. Agregar notificaciones push para cambios de estado
3. Implementar historial detallado con filtros

---

## 11. Notas Técnicas

### Cálculo de Total MXI:
```typescript
const totalMXI = 
  mxiPurchased +      // Comprados
  mxiCommissions +    // Comisiones
  mxiTournaments +    // Torneos
  mxiVesting;         // Vesting (solo de comprados)
```

### Escala del Gráfico:
```typescript
const maxY = totalMXI * 2;  // 2x para balance
const minY = 0;             // Siempre desde 0
```

### Actualización en Tiempo Real:
```typescript
// Vesting se actualiza cada segundo
setInterval(() => {
  const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;
  const newVesting = currentVesting + yieldPerSecond;
  setCurrentVesting(newVesting);
}, 1000);
```

---

## 12. Soporte y Documentación

### Para Usuarios:
- Ver `app/(tabs)/(home)/retiros.tsx` para interfaz completa
- Revisar requisitos en la sección "Requisitos de Retiro"
- Contactar soporte si hay problemas

### Para Desarrolladores:
- Código fuente en archivos mencionados
- Comentarios inline en el código
- Este documento como referencia

---

## Conclusión

Se han implementado exitosamente todas las mejoras solicitadas:

✅ Gráfico inicia desde 0 e interconecta todos los puntos
✅ Total MXI calculado de todas las fuentes (compras, comisiones, torneos, vesting)
✅ Escala vertical dinámica (2x total MXI) para balance visual
✅ Actualización en tiempo real del balance
✅ Página de retiros completa con 4 tipos separados
✅ Retiros de MXI comprados y vesting bloqueados hasta lanzamiento
✅ Validaciones y requisitos implementados
✅ Interfaz de usuario intuitiva y clara

El sistema está listo para uso en producción.
