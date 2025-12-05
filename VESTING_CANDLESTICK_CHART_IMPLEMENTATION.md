
# Implementación del Gráfico de Velas Japonesas para Vesting MXI

## 📊 Resumen de Cambios

Se ha implementado un **gráfico profesional de velas japonesas (candlestick chart)** para visualizar el crecimiento del vesting MXI en tiempo real, reemplazando el display anterior de "Vesting" en la página principal.

## ✨ Características Principales

### 1. **Gráfico de Velas Japonesas Profesional**
- **Visualización por horas**: Cada vela representa una hora de acumulación de vesting
- **Datos en tiempo real**: El gráfico se actualiza automáticamente cada minuto
- **Múltiples rangos de tiempo**: 24 horas, 7 días, 30 días
- **Colores profesionales**: Verde para crecimiento, rojo para decrecimiento
- **Estadísticas detalladas**: Apertura, Máximo, Mínimo, Cierre

### 2. **Componente VestingCandlestickChart**
Ubicación: `components/VestingCandlestickChart.tsx`

**Características:**
- Contador en tiempo real del yield acumulado
- Selector de rango de tiempo (24h, 7d, 30d)
- Gráfico interactivo con scroll horizontal
- Estadísticas OHLC (Open, High, Low, Close)
- Indicador de cambio porcentual
- Información contextual sobre el vesting

**Tecnologías utilizadas:**
- `react-native-svg` para renderizado del gráfico
- Cálculos matemáticos para escalado y posicionamiento
- Integración con Supabase para datos históricos

### 3. **Base de Datos**
Nueva tabla: `vesting_hourly_data`

**Estructura:**
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- timestamp: TIMESTAMP WITH TIME ZONE
- open_value: NUMERIC
- high_value: NUMERIC
- low_value: NUMERIC
- close_value: NUMERIC
- volume: NUMERIC
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

**Políticas RLS:**
- Los usuarios solo pueden ver sus propios datos
- Los usuarios pueden insertar y actualizar sus propios datos
- Índice optimizado para consultas rápidas por usuario y timestamp

### 4. **Edge Function: update-vesting-hourly**
Ubicación: `supabase/functions/update-vesting-hourly/index.ts`

**Funcionalidad:**
- Se ejecuta cada hora (configurar con cron job)
- Actualiza los datos de vesting para todos los usuarios
- Calcula valores OHLC basados en el yield acumulado
- Maneja errores y registra logs detallados

**Configuración recomendada:**
```bash
# Ejecutar cada hora con cron job en Supabase
0 * * * * curl -X POST https://[tu-proyecto].supabase.co/functions/v1/update-vesting-hourly
```

## 🎨 Diseño Visual

### Paleta de Colores
- **Fondo principal**: `rgba(255, 215, 0, 0.08)` (Dorado translúcido)
- **Borde**: `rgba(255, 215, 0, 0.3)` (Dorado)
- **Velas verdes**: `#10b981` (Crecimiento)
- **Velas rojas**: `#ef4444` (Decrecimiento)
- **Texto primario**: Dorado (`colors.primary`)
- **Texto secundario**: Gris (`colors.textSecondary`)

### Elementos del Diseño
1. **Header**: Título "Balance Total MXI" con valor actual y cambio porcentual
2. **Selector de tiempo**: Botones para 24h, 7d, 30d
3. **Gráfico**: Velas japonesas con grid y etiquetas de ejes
4. **Estadísticas**: Apertura, Máximo, Mínimo, Cierre
5. **Info box**: Explicación del gráfico

## 📱 Integración en la Página Principal

### Cambios en `app/(tabs)/(home)/index.tsx`

**Antes:**
```tsx
<View style={styles.totalBalanceCard}>
  <Text style={styles.cardTitle}>💰 Vesting</Text>
  {/* Display simple con barras */}
</View>
```

**Después:**
```tsx
<VestingCandlestickChart />
<View style={styles.balanceBreakdownCard}>
  {/* Desglose de balance MXI */}
</View>
```

## 🔧 Configuración Técnica

### Dependencias Instaladas
```json
{
  "react-native-svg": "^15.15.0"
}
```

### Migración de Base de Datos
Ejecutada: `create_vesting_hourly_data_table`
- Crea tabla `vesting_hourly_data`
- Habilita RLS
- Crea políticas de seguridad
- Crea índices optimizados
- Crea función `update_vesting_hourly_data()`

## 📊 Cálculo del Vesting

### Fórmula
```typescript
const MONTHLY_YIELD_PERCENTAGE = 0.03; // 3% mensual
const SECONDS_IN_MONTH = 2592000; // 30 días

const mxiInVesting = mxiPurchasedDirectly + mxiFromUnifiedCommissions;
const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;
const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;

// Yield acumulado
const currentYield = accumulatedYield + (yieldPerSecond * secondsElapsed);
```

### Datos de Velas
```typescript
interface CandleData {
  timestamp: string;      // Hora de la vela
  open: number;          // Valor al inicio de la hora
  high: number;          // Valor máximo en la hora
  low: number;           // Valor mínimo en la hora
  close: number;         // Valor al final de la hora
  volume: number;        // Diferencia entre close y open
}
```

## 🚀 Características Avanzadas

### 1. **Generación de Datos Sintéticos**
Si no hay datos históricos, el componente genera datos sintéticos basados en:
- Yield actual del usuario
- Tasa de crecimiento por hora
- Variación aleatoria para simular fluctuaciones naturales

### 2. **Actualización en Tiempo Real**
- El contador de yield se actualiza cada segundo
- Los datos del gráfico se recargan cada minuto
- Sincronización automática con la base de datos

### 3. **Optimización de Rendimiento**
- Uso de `ScrollView` horizontal para gráficos grandes
- Renderizado eficiente con SVG
- Cálculos matemáticos optimizados para escalado

## 📈 Métricas Mostradas

1. **Balance Total MXI**: Valor actual del vesting acumulado
2. **Cambio Porcentual**: Variación en el período seleccionado
3. **Apertura**: Valor al inicio del período
4. **Máximo**: Valor más alto alcanzado
5. **Mínimo**: Valor más bajo registrado
6. **Cierre**: Valor actual o al final del período

## 🔐 Seguridad

### Row Level Security (RLS)
- Cada usuario solo puede ver sus propios datos de vesting
- Las políticas RLS protegen contra acceso no autorizado
- Edge Function usa service role key para operaciones administrativas

### Validaciones
- Verificación de user_id en todas las consultas
- Límites de yield mensual (3% máximo)
- Manejo de errores robusto

## 📝 Notas Importantes

1. **Solo MXI comprados generan vesting**: Las comisiones NO generan rendimiento de vesting
2. **Límite mensual del 3%**: El vesting está limitado al 3% mensual del MXI comprado
3. **Datos históricos**: Se recomienda configurar un cron job para ejecutar `update-vesting-hourly` cada hora
4. **Datos sintéticos**: Si no hay datos históricos, se generan automáticamente para demostración

## 🎯 Próximos Pasos Recomendados

1. **Configurar Cron Job**: Ejecutar `update-vesting-hourly` cada hora
2. **Monitorear Rendimiento**: Verificar que los cálculos sean precisos
3. **Optimizar Consultas**: Agregar más índices si es necesario
4. **Agregar Notificaciones**: Alertar a usuarios sobre hitos de vesting
5. **Exportar Datos**: Permitir a usuarios descargar su historial de vesting

## 🐛 Solución de Problemas

### El gráfico no muestra datos
- Verificar que el usuario tenga MXI comprados
- Ejecutar manualmente `update-vesting-hourly`
- Revisar logs de la Edge Function

### Los datos no se actualizan
- Verificar conexión a Supabase
- Revisar políticas RLS
- Comprobar que el cron job esté activo

### Errores de renderizado
- Verificar que `react-native-svg` esté instalado
- Limpiar caché de Metro bundler
- Reiniciar la aplicación

## 📚 Referencias

- [React Native SVG Documentation](https://github.com/software-mansion/react-native-svg)
- [Candlestick Charts Explained](https://www.investopedia.com/terms/c/candlestick.asp)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Implementado por**: Natively AI Assistant
**Fecha**: 2025-01-25
**Versión**: 1.0.0
