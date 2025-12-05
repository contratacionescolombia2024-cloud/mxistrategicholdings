
# Flujo de Pagos para Bonos de Embajadores MXI

## Diagrama de Flujo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO REALIZA COMPRA                        │
│                    (Referido Nivel 1)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   ¿Monto >= 50 USDT?              │
         │   ¿Moneda = USD?                  │
         └───────────┬───────────────────────┘
                     │
         ┌───────────┴───────────┐
         │ NO                    │ SÍ
         ▼                       ▼
    ┌────────┐         ┌─────────────────────┐
    │ IGNORAR│         │  PAGO VÁLIDO        │
    └────────┘         │  Continuar proceso  │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────────┐   ┌──────────────────────┐
        │   PAGO AUTOMÁTICO     │   │  PAGO MANUAL         │
        │   (NowPayments)       │   │  (Usuario/Admin)     │
        └───────────┬───────────┘   └──────────┬───────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────────┐   ┌──────────────────────┐
        │ Status: finished      │   │ ¿Tipo de pago?       │
        │    o confirmed        │   └──────────┬───────────┘
        └───────────┬───────────┘              │
                    │              ┌────────────┴────────────┐
                    │              │                         │
                    │              ▼                         ▼
                    │   ┌──────────────────┐    ┌──────────────────┐
                    │   │ Verificación     │    │ Admin Asigna     │
                    │   │ Manual           │    │ Pago             │
                    │   └────────┬─────────┘    └────────┬─────────┘
                    │            │                       │
                    │            ▼                       ▼
                    │   ┌──────────────────┐    ┌──────────────────┐
                    │   │ Admin Aprueba    │    │ order_id =       │
                    │   │ Solicitud        │    │ 'ADMIN-XXXXX'    │
                    │   └────────┬─────────┘    │ + Comisión ✓     │
                    │            │               └────────┬─────────┘
                    │            │                        │
                    └────────────┴────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  TRIGGER AUTOMÁTICO        │
                    │  - Recalcular nivel        │
                    │  - Actualizar bonos        │
                    │  - Notificar en tiempo real│
                    └────────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  ACTUALIZACIÓN EMBAJADOR   │
                    │  - Total compras válidas   │
                    │  - Nivel actual            │
                    │  - Bonos disponibles       │
                    └────────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  USUARIO VE ACTUALIZACIÓN  │
                    │  - En tiempo real          │
                    │  - Sin recargar página     │
                    └────────────────────────────┘
```

## Tipos de Pagos Detallados

### 1. Pago Automático (NowPayments)

```
Usuario → Hace Pago → NowPayments Procesa → Webhook → Status: finished
                                                              │
                                                              ▼
                                                    Trigger Automático
                                                              │
                                                              ▼
                                              Actualiza Nivel Embajador
```

**Características**:
- ✅ Totalmente automático
- ✅ Verificado por blockchain
- ✅ No requiere intervención del admin
- ✅ Cuenta inmediatamente para bonos

**Identificación en BD**:
```sql
status IN ('finished', 'confirmed')
AND price_currency = 'usd'
AND price_amount >= 50
```

### 2. Verificación Manual Aprobada

```
Usuario → Hace Pago Externo → Sube Evidencia → Admin Revisa → Aprueba
                                                                   │
                                                                   ▼
                                                         Trigger Automático
                                                                   │
                                                                   ▼
                                                   Actualiza Nivel Embajador
```

**Características**:
- ⚠️ Requiere aprobación del admin
- ✅ Flexible para pagos fuera del sistema
- ✅ Cuenta para bonos una vez aprobado
- 📸 Requiere evidencia (captura, tx_hash)

**Identificación en BD**:
```sql
EXISTS (
  SELECT 1 FROM manual_verification_requests mvr
  WHERE mvr.payment_id = p.id
  AND mvr.status = 'approved'
)
AND price_currency = 'usd'
AND price_amount >= 50
```

### 3. Pago Asignado por Admin

```
Admin → Panel Admin → Acreditar Pago Manual → Marca "Generar Comisiones"
                                                              │
                                                              ▼
                                                    Crea Pago con ADMIN-
                                                              │
                                                              ▼
                                                    Trigger Automático
                                                              │
                                                              ▼
                                              Actualiza Nivel Embajador
```

**Características**:
- 👨‍💼 Creado directamente por admin
- ✅ Útil para casos especiales
- ✅ Genera comisiones si se marca la opción
- ✅ Cuenta inmediatamente para bonos

**Identificación en BD**:
```sql
order_id LIKE 'ADMIN-%'
AND price_currency = 'usd'
AND price_amount >= 50
```

## Flujo de Retiro de Bonos

```
┌─────────────────────────────────────────────────────────────────┐
│                 USUARIO ALCANZA NIVEL                            │
│                 (ej: Nivel 1 - Bronce)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Bonos Disponibles > 0           │
         │   (ej: 10 USDT)                   │
         └───────────┬───────────────────────┘
                     │
                     ▼
         ┌───────────────────────────────────┐
         │   BOTÓN VISIBLE                   │
         │   "Solicitar Retiro de Bono"      │
         └───────────┬───────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────────┐      ┌──────────────┐
    │ Cumple     │      │ NO Cumple    │
    │ Requisitos │      │ Requisitos   │
    └──────┬─────┘      └──────┬───────┘
           │                   │
           │                   ▼
           │          ┌──────────────────┐
           │          │ Botón Deshabilitado│
           │          │ + Mensaje Advertencia│
           │          └──────────────────┘
           │
           ▼
    ┌────────────────────┐
    │ Usuario Hace Clic  │
    └──────────┬─────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Ingresa Dirección TRC20│
    └──────────┬─────────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Confirma Retiro        │
    └──────────┬─────────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Solicitud Creada       │
    │ Status: pending        │
    └──────────┬─────────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Admin Revisa           │
    │ - Verifica requisitos  │
    │ - Verifica dirección   │
    └──────────┬─────────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Admin Procesa Pago     │
    │ (Manualmente a TRC20)  │
    └──────────┬─────────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Admin Aprueba en Panel │
    └──────────┬─────────────┘
               │
               ▼
    ┌────────────────────────┐
    │ Sistema Actualiza:     │
    │ - Marca bonos retirados│
    │ - Actualiza total      │
    │ - Notifica usuario     │
    └────────────────────────┘
```

## Requisitos para Retiro (Checklist)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUISITOS PARA RETIRO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☐  Nivel Alcanzado                                             │
│      └─ Mínimo: Nivel 1 (Bronce) = 300 USDT en compras válidas │
│                                                                  │
│  ☐  KYC Aprobado                                                │
│      └─ Status: 'approved' en kyc_verifications                 │
│                                                                  │
│  ☐  Compra Personal                                             │
│      └─ mxi_purchased_directly > 0                              │
│                                                                  │
│  ☐  Bonos Disponibles                                           │
│      └─ Bonos no retirados del nivel alcanzado                  │
│                                                                  │
│  ☐  Dirección TRC20 Válida                                      │
│      └─ Comienza con 'T' y tiene 34 caracteres                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cálculo de Bonos Acumulativos

```
Nivel 1 (Bronce)              →  +10 USDT
Nivel 2 (Plata)               →  +30 USDT  (Total: 40 USDT)
Nivel 3 (Oro)                 →  +100 USDT (Total: 140 USDT)
Nivel 4 (Diamante)            →  +600 USDT (Total: 740 USDT)
Nivel 5 (Élite Global)        →  +2000 USDT (Total: 2740 USDT)
Nivel 6 (Embajador Legendario)→  +5000 USDT (Total: 7740 USDT)
```

**Ejemplo**:
- Usuario alcanza Nivel 3 (Oro)
- Bonos disponibles: 10 + 30 + 100 = **140 USDT**
- Usuario retira los 140 USDT
- Usuario sigue creciendo y alcanza Nivel 4 (Diamante)
- Nuevos bonos disponibles: **600 USDT** (solo el bono del nivel 4)
- Total retirado hasta ahora: 140 USDT
- Total disponible para retirar: 600 USDT

## Actualizaciones en Tiempo Real

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTO TRIGGER                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ Pago Confirmado  │          │ Verificación     │
│ (finished)       │          │ Aprobada         │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Trigger Ejecuta:      │
            │ - update_ambassador_  │
            │   level()             │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Función Calcula:      │
            │ - Total compras       │
            │ - Nivel actual        │
            │ - Bonos disponibles   │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Actualiza BD:         │
            │ - ambassador_levels   │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Notificación:         │
            │ - pg_notify()         │
            │ - Realtime broadcast  │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Frontend Recibe:      │
            │ - useRealtime hook    │
            │ - Actualiza UI        │
            └───────────────────────┘
```

## Optimizaciones de Rendimiento

### Índices Creados

```sql
-- Para búsquedas rápidas de pagos válidos
idx_payments_user_status_amount
  └─ Filtra: price_currency = 'usd' AND price_amount >= 50

-- Para pagos asignados por admin
idx_payments_order_id_pattern
  └─ Filtra: order_id LIKE 'ADMIN-%'

-- Para verificaciones manuales aprobadas
idx_manual_verification_payment_status
  └─ Filtra: status = 'approved'
```

### Tiempo de Respuesta Esperado

```
Sin Índices:     ~8-12 segundos  ❌
Con Índices:     ~1-3 segundos   ✅
Con Timeout:     Máximo 15s      ⚠️
Con Reintentos:  2 intentos      🔄
```

## Casos de Uso Comunes

### Caso 1: Usuario con Referidos Activos

```
Usuario A refiere a Usuario B
Usuario B hace compra de 100 USDT (automática)
  └─ Status: finished
  └─ Cuenta para Usuario A: +100 USDT
Usuario A: 100 USDT acumulados
  └─ No alcanza Nivel 1 (necesita 300 USDT)
  └─ Bonos disponibles: 0 USDT
  └─ Botón NO visible

Usuario B hace otra compra de 200 USDT
  └─ Status: finished
  └─ Cuenta para Usuario A: +200 USDT
Usuario A: 300 USDT acumulados
  └─ ¡Alcanza Nivel 1 (Bronce)!
  └─ Bonos disponibles: 10 USDT
  └─ Botón VISIBLE
```

### Caso 2: Admin Acredita Pago Manual

```
Admin acredita 500 USDT a Usuario C
  └─ Marca "Generar comisiones"
  └─ order_id: ADMIN-12345
Usuario C es referido de Usuario D
  └─ Cuenta para Usuario D: +500 USDT
Usuario D: 500 USDT acumulados
  └─ Alcanza Nivel 1 (Bronce)
  └─ Bonos disponibles: 10 USDT
  └─ Botón VISIBLE
```

### Caso 3: Verificación Manual Aprobada

```
Usuario E hace pago externo de 150 USDT
  └─ Sube evidencia (captura + tx_hash)
  └─ Status inicial: waiting
Admin revisa y aprueba
  └─ manual_verification_requests.status = 'approved'
Usuario E es referido de Usuario F
  └─ Cuenta para Usuario F: +150 USDT
Usuario F: 150 USDT acumulados
  └─ No alcanza Nivel 1 (necesita 300 USDT)
  └─ Bonos disponibles: 0 USDT
  └─ Botón NO visible
```

---

**Nota**: Este documento es una guía visual. Para detalles técnicos completos, consultar `EMBAJADORES_MXI_FIX_SUMMARY.md`.
