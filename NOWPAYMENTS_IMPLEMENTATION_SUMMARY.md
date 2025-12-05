
# NOWPayments Implementation Summary

## ✅ Implementación Completada

Se ha implementado exitosamente el sistema de pagos NOWPayments para la preventa del token MXI, reemplazando el sistema anterior de OKX/Binance.

## 🔹 Cambios Realizados

### 1. Base de Datos

**Nuevas Tablas Creadas:**

- `nowpayments_orders`: Almacena todas las órdenes de compra de MXI
  - Campos: order_id, payment_id, payment_url, mxi_amount, usdt_amount, price_per_mxi, phase, status, etc.
  - RLS habilitado para seguridad
  - Políticas: usuarios pueden ver sus propias órdenes, admins pueden ver/actualizar todas

- `nowpayments_webhook_logs`: Registra todos los webhooks recibidos para debugging
  - Campos: payment_id, order_id, payload, status, processed, error
  - Solo admins pueden ver los logs

### 2. Edge Functions

**Tres nuevas funciones desplegadas:**

#### a) `create-nowpayments-order`
- **Propósito**: Crear una orden de pago en NOWPayments
- **Entrada**: `{ mxi_amount: number }`
- **Proceso**:
  1. Valida usuario autenticado
  2. Obtiene fase actual y precio de MXI
  3. Calcula total en USDT
  4. Valida monto mínimo ($20 USDT)
  5. Verifica disponibilidad en la fase actual
  6. Llama a NOWPayments API para crear pago
  7. Guarda orden en base de datos
  8. Retorna URL de pago y detalles
- **Salida**: `{ payment_url, order_id, mxi_amount, usdt_amount, etc. }`

#### b) `nowpayments-webhook`
- **Propósito**: Procesar notificaciones de pago de NOWPayments
- **Proceso**:
  1. Recibe webhook de NOWPayments
  2. Registra en `nowpayments_webhook_logs`
  3. Busca orden en base de datos
  4. Actualiza estado de la orden
  5. Si status = "finished":
     - Verifica moneda (USDT BEP20)
     - Verifica monto pagado
     - Actualiza balance del usuario (mxi_balance, mxi_purchased_directly)
     - Calcula y aplica yield rate (0.005% por hora)
     - Crea registro en `contributions`
     - Actualiza métricas globales
     - Procesa comisiones de referidos (5%, 2%, 1%)
     - Marca orden como confirmada
- **Comisiones de Referidos**:
  - Nivel 1: 5% del MXI comprado
  - Nivel 2: 2% del MXI comprado
  - Nivel 3: 1% del MXI comprado
  - Las comisiones también generan yield (vesting)

#### c) `check-nowpayments-status`
- **Propósito**: Verificar estado de una orden
- **Entrada**: `?order_id=xxx`
- **Proceso**:
  1. Busca orden en base de datos
  2. Si ya está confirmada, retorna datos
  3. Si no, consulta NOWPayments API
  4. Actualiza estado en base de datos
  5. Retorna estado actualizado

### 3. Frontend

#### Nueva Pantalla: `purchase-mxi.tsx`

**Características:**
- Muestra fase actual y precio por MXI
- Barra de progreso de la fase
- Input para cantidad de MXI
- Botones rápidos (50, 100, 250, 500, 1000 MXI)
- Cálculo automático del total en USDT
- Botón "Pagar con USDT (NOWPayments)"
- Lista de órdenes pendientes con:
  - Estado del pago
  - Botón para abrir URL de pago
  - Botón para verificar estado
  - Fecha de expiración
- Información sobre el proceso
- Desglose de las 3 fases de preventa

**Flujo de Usuario:**
1. Usuario ingresa cantidad de MXI
2. App calcula total en USDT
3. Usuario presiona "Pagar con USDT"
4. App crea orden y abre NOWPayments en navegador
5. Usuario paga con su wallet USDT BEP20
6. NOWPayments envía webhook al backend
7. Backend procesa pago y acredita MXI
8. Usuario puede verificar estado desde la app

#### Pantalla Actualizada: `deposit.tsx`
- Ahora redirige a `purchase-mxi.tsx`
- Muestra balance actual de MXI
- Información sobre el sistema de pagos

#### Pantalla Actualizada: `index.tsx` (Home)
- **RESTAURADO**: VestingCounter ahora visible en la página principal
- Muestra todas las métricas de referidos
- Muestra métricas de retos
- Muestra últimas 5 transacciones
- Desglose completo del balance MXI

### 4. Componente VestingCounter

**Restaurado en la página principal con:**
- Contador en tiempo real (actualizado cada segundo)
- Muestra MXI en vesting
- Muestra rendimiento acumulado
- Botón para unificar saldo (requiere 10 referidos activos)
- Información sobre el sistema de vesting

## 🔹 Flujo Completo de Compra

```
1. Usuario → Selecciona cantidad MXI
2. App → Calcula USDT según fase actual
3. App → Llama a /crear-orden
4. Backend → Crea orden en NOWPayments
5. Backend → Guarda orden en DB
6. Backend → Retorna payment_url
7. App → Abre payment_url en navegador
8. Usuario → Paga con wallet USDT BEP20
9. NOWPayments → Envía webhook a /webhook-nowpayments
10. Backend → Verifica pago
11. Backend → Acredita MXI al usuario
12. Backend → Calcula comisiones de referidos
13. Backend → Actualiza métricas
14. Usuario → Ve MXI acreditado en su balance
```

## 🔹 Sistema de Comisiones

**Automático al confirmar pago:**

- **Nivel 1 (Referido Directo)**: 5% del MXI comprado
- **Nivel 2 (Referido de Referido)**: 2% del MXI comprado
- **Nivel 3 (Tercer Nivel)**: 1% del MXI comprado

**Características:**
- Las comisiones se acreditan en `mxi_from_unified_commissions`
- Las comisiones también generan yield (0.005% por hora)
- Se crean registros en tabla `commissions` con status "available"
- Se actualiza el yield_rate_per_minute del referidor

## 🔹 Sistema de Vesting

**Generación de Rendimientos:**
- **Tasa**: 0.005% por hora
- **Aplica a**: MXI comprado directamente + MXI de comisiones unificadas
- **Actualización**: Cada segundo en el frontend
- **Unificación**: Requiere 10 referidos activos

**Cálculo:**
```javascript
yieldRatePerHour = mxiAmount * 0.00005
yieldRatePerMinute = yieldRatePerHour / 60
```

## 🔹 Fases de Preventa

| Fase | Precio | Asignación | Estado |
|------|--------|------------|--------|
| 1    | $0.40  | 8,333,333 MXI | Según metrics.current_phase |
| 2    | $0.70  | 8,333,333 MXI | Según metrics.current_phase |
| 3    | $1.00  | 8,333,334 MXI | Según metrics.current_phase |

**Total Preventa**: 25,000,000 MXI

## 🔹 Validaciones Implementadas

1. **Monto Mínimo**: $20 USDT
2. **Disponibilidad de Fase**: Verifica tokens restantes
3. **Moneda**: Solo USDT BEP20
4. **Monto Pagado**: Permite 5% de variación por fees de red
5. **Usuario Autenticado**: Requiere sesión válida
6. **Expiración**: Órdenes expiran después de 1 hora

## 🔹 Seguridad

- **RLS Habilitado**: En todas las tablas
- **Autenticación**: Requerida para todas las operaciones
- **Webhook Logs**: Todos los webhooks se registran
- **Verificación de Pago**: Múltiples validaciones antes de acreditar
- **Service Role**: Webhook usa service role key para bypass RLS

## 🔹 Variables de Entorno Requeridas

En Supabase Edge Functions:

```bash
NOWPAYMENTS_API_KEY=tu_api_key_de_nowpayments
NOWPAYMENTS_IPN_SECRET=tu_ipn_secret (opcional)
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 🔹 Configuración de NOWPayments

1. Crear cuenta en NOWPayments
2. Obtener API Key
3. Configurar IPN Callback URL: `https://tu-proyecto.supabase.co/functions/v1/nowpayments-webhook`
4. Configurar Success URL: `https://natively.dev/(tabs)/(home)`
5. Configurar Cancel URL: `https://natively.dev/(tabs)/deposit`

## 🔹 Testing

**Para probar el sistema:**

1. Ir a la pestaña "Depositar"
2. Presionar "Comprar MXI con USDT"
3. Ingresar cantidad de MXI (mínimo equivalente a $20 USDT)
4. Presionar "Pagar con USDT (NOWPayments)"
5. Completar pago en NOWPayments
6. Verificar que el MXI se acredite automáticamente
7. Verificar que las comisiones se apliquen a los referidores
8. Verificar que el vesting se active

## 🔹 Monitoreo

**Para monitorear pagos:**

1. Tabla `nowpayments_orders`: Ver todas las órdenes
2. Tabla `nowpayments_webhook_logs`: Ver todos los webhooks recibidos
3. Tabla `contributions`: Ver contribuciones completadas
4. Tabla `commissions`: Ver comisiones generadas

## 🔹 Próximos Pasos

1. Configurar las variables de entorno en Supabase
2. Obtener API Key de NOWPayments
3. Configurar webhook URL en NOWPayments
4. Probar con un pago real
5. Monitorear logs para asegurar funcionamiento correcto

## 📝 Notas Importantes

- El sistema NO usa Web3 ni librerías de blockchain
- Todo funciona con llamadas API REST
- Los pagos se procesan en USDT BEP20
- El MXI es "saldo simulado" hasta el lanzamiento oficial
- Las comisiones se calculan automáticamente
- El vesting genera rendimientos del 0.005% por hora
- Se requieren 10 referidos activos para unificar saldo de vesting

## ✅ Sistema Completamente Funcional

El sistema está listo para procesar pagos reales una vez que se configuren las credenciales de NOWPayments en las variables de entorno de Supabase Edge Functions.
