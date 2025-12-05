
# 📊 Guía Rápida: Gráfico de Velas Japonesas de Vesting

## 🎯 ¿Qué es?

Un **gráfico profesional de velas japonesas** que muestra el crecimiento del vesting MXI en tiempo real, similar a los gráficos de trading de criptomonedas.

## 🔑 Características Clave

### ✅ Lo que hace:
- ✨ Muestra el crecimiento del vesting por hora
- 📈 Actualización en tiempo real cada segundo
- 🕐 Rangos de tiempo: 24h, 7d, 30d
- 📊 Estadísticas OHLC (Apertura, Máximo, Mínimo, Cierre)
- 🎨 Diseño profesional tipo trading

### ❌ Lo que NO hace:
- No muestra el balance total de MXI (hay una tarjeta separada para eso)
- No incluye comisiones (solo MXI comprados generan vesting)
- No es un gráfico de precio (es de acumulación de yield)

## 📍 Ubicación

**Página Principal** (`app/(tabs)/(home)/index.tsx`)
- Aparece después del "Launch Countdown"
- Antes de la tarjeta de "Desglose de Balance MXI"

## 🎨 Cómo se ve

```
┌─────────────────────────────────────────┐
│ Balance Total MXI                       │
│ Gráfico de Crecimiento por Vesting     │
│                                         │
│ 0.123456 MXI                    ↑ 2.5% │
│                                         │
│ [24h] [7d] [30d]                       │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │     📊 Gráfico de Velas          │  │
│ │                                   │  │
│ │  ▌ ▌  ▌ ▌ ▌  ▌ ▌ ▌ ▌ ▌ ▌ ▌     │  │
│ │  ▌ ▌  ▌ ▌ ▌  ▌ ▌ ▌ ▌ ▌ ▌ ▌     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Apertura | Máximo | Mínimo | Cierre   │
│ 0.120000 | 0.125000 | 0.119000 | 0.123456 │
│                                         │
│ ℹ️ Gráfico de velas japonesas...      │
└─────────────────────────────────────────┘
```

## 🔧 Componentes Técnicos

### 1. Componente Principal
**Archivo**: `components/VestingCandlestickChart.tsx`
- Renderiza el gráfico SVG
- Maneja la lógica de tiempo real
- Gestiona los rangos de tiempo

### 2. Base de Datos
**Tabla**: `vesting_hourly_data`
- Almacena datos históricos por hora
- Un registro por usuario por hora
- Campos: open, high, low, close, volume

### 3. Edge Function
**Función**: `update-vesting-hourly`
- Actualiza datos cada hora
- Calcula valores OHLC
- Procesa todos los usuarios con vesting

## 📊 Interpretación del Gráfico

### Velas Verdes 🟢
- **Significado**: El vesting creció en esa hora
- **Cuerpo**: Diferencia entre apertura y cierre
- **Mecha superior**: Máximo alcanzado
- **Mecha inferior**: Mínimo alcanzado

### Velas Rojas 🔴
- **Significado**: El vesting decreció en esa hora (raro, pero posible si hay ajustes)
- **Interpretación**: Similar a las verdes pero invertida

### Estadísticas OHLC
- **Open (Apertura)**: Valor al inicio del período
- **High (Máximo)**: Valor más alto alcanzado
- **Low (Mínimo)**: Valor más bajo registrado
- **Close (Cierre)**: Valor al final del período

## 🚀 Configuración Inicial

### Paso 1: Verificar Instalación
```bash
# Verificar que react-native-svg esté instalado
npm list react-native-svg
```

### Paso 2: Ejecutar Migración
La migración `create_vesting_hourly_data_table` ya fue ejecutada.

### Paso 3: Configurar Cron Job (Recomendado)
```bash
# En Supabase Dashboard > Edge Functions > Cron Jobs
# Agregar:
0 * * * * update-vesting-hourly
```

### Paso 4: Probar Manualmente
```bash
# Ejecutar la función manualmente
curl -X POST https://[tu-proyecto].supabase.co/functions/v1/update-vesting-hourly \
  -H "Authorization: Bearer [tu-anon-key]"
```

## 💡 Tips de Uso

### Para Usuarios
1. **Selecciona el rango de tiempo** que quieres ver (24h, 7d, 30d)
2. **Desliza horizontalmente** para ver más datos
3. **Observa las estadísticas** en la parte inferior
4. **El contador en tiempo real** muestra tu yield actual

### Para Desarrolladores
1. **Datos sintéticos**: Si no hay datos históricos, se generan automáticamente
2. **Actualización automática**: El gráfico se recarga cada minuto
3. **Optimización**: Usa índices en la base de datos para consultas rápidas
4. **Logs**: Revisa los logs de la Edge Function para debugging

## 🐛 Problemas Comunes

### "Generando datos del gráfico..."
**Causa**: No hay datos históricos
**Solución**: Espera unos segundos, se generarán datos sintéticos

### El gráfico no se actualiza
**Causa**: Problema de conexión o cron job no configurado
**Solución**: 
1. Verifica conexión a internet
2. Ejecuta manualmente `update-vesting-hourly`
3. Configura el cron job

### Valores incorrectos
**Causa**: Cálculos desincronizados
**Solución**:
1. Refresca la página
2. Verifica que `accumulated_yield` esté actualizado en la tabla `users`

## 📈 Fórmulas Importantes

### Yield por Segundo
```typescript
const yieldPerSecond = (mxiInVesting * 0.03) / 2592000;
```

### Yield Acumulado
```typescript
const currentYield = accumulatedYield + (yieldPerSecond * secondsElapsed);
```

### Cambio Porcentual
```typescript
const changePercent = ((close - open) / open) * 100;
```

## 🎯 Mejores Prácticas

1. **Ejecuta el cron job cada hora** para datos precisos
2. **Monitorea los logs** de la Edge Function
3. **Optimiza consultas** con índices apropiados
4. **Mantén sincronizado** el `accumulated_yield` en la tabla `users`
5. **Prueba en diferentes rangos de tiempo** para verificar consistencia

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de la Edge Function
2. Verifica las políticas RLS
3. Comprueba que el usuario tenga MXI comprados
4. Ejecuta manualmente la función de actualización

---

**Última actualización**: 2025-01-25
**Versión**: 1.0.0
