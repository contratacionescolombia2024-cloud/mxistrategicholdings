
# Guía del Usuario: Gestión de Transacciones Pendientes

## ¿Qué son las Transacciones Pendientes?

Las transacciones pendientes son órdenes de compra de MXI que aún no se han completado. Pueden estar en diferentes estados:

- **Pendiente** - La orden se está creando
- **Esperando Pago** - La orden está lista, esperando que completes el pago
- **Confirmando** - El pago se recibió y se está confirmando en la blockchain
- **Completado** - El pago se confirmó y tu MXI fue acreditado
- **Fallido** - Hubo un error en el proceso
- **Expirado** - La ventana de pago expiró (1 hora)
- **Cancelado** - Cancelaste la transacción

## Cómo Ver tus Transacciones

1. Ve a la pantalla de **Comprar MXI**
2. Toca el ícono de reloj (⏰) en la esquina superior derecha
3. Verás el **Historial de Transacciones** con todas tus órdenes

## Filtros Disponibles

- **Todas** - Muestra todas las transacciones
- **Pendientes** - Solo transacciones en proceso
- **Exitosas** - Solo transacciones completadas
- **Fallidas** - Solo transacciones con errores

## Acciones Disponibles

### Para Transacciones Pendientes:

#### 1. **Botón "Pagar"** 🔗
- Abre la página de pago de NowPayments
- Completa el pago con USDT BEP20
- La transacción se actualizará automáticamente cuando se confirme

#### 2. **Botón "Verificar"** 🔄
- Verifica el estado actual de tu pago
- Actualiza la información desde NowPayments
- Te muestra si el pago fue confirmado o si hay algún problema

#### 3. **Botón "Cancelar"** ❌
- Cancela una transacción que ya no deseas completar
- Útil para limpiar transacciones antiguas o fallidas
- No afecta tu saldo de MXI

## Problemas Comunes y Soluciones

### Problema 1: "La transacción quedó en pendiente"

**Solución:**
1. Toca el botón **"Verificar"** para actualizar el estado
2. Si tiene URL de pago, toca **"Pagar"** para completar el pago
3. Si no tiene URL de pago, significa que la creación falló:
   - Toca **"Cancelar"** para eliminarla
   - Crea una nueva orden

### Problema 2: "No se abre la página de pago"

**Solución:**
1. Verifica tu conexión a internet
2. Intenta nuevamente tocando **"Pagar"**
3. Si persiste, copia la URL manualmente desde los detalles
4. Como último recurso, cancela y crea una nueva orden

### Problema 3: "El pago expiró"

**Solución:**
1. Las órdenes expiran después de 1 hora
2. Cancela la orden expirada
3. Crea una nueva orden de compra
4. Completa el pago dentro de 1 hora

### Problema 4: "Pagué pero no veo mi MXI"

**Solución:**
1. Toca **"Verificar"** para actualizar el estado
2. Espera 5-10 minutos para confirmaciones de blockchain
3. Si después de 30 minutos no se acredita:
   - Revisa los detalles del error
   - Contacta a soporte con tu Order ID

## Información Importante

### Tiempos de Procesamiento:
- **Creación de orden:** Instantáneo
- **Confirmación de pago:** 5-30 minutos (depende de la blockchain)
- **Acreditación de MXI:** Automático después de la confirmación

### Límites:
- **Mínimo:** $20 USDT
- **Máximo:** $500,000 USDT por transacción
- **Expiración:** 1 hora desde la creación

### Moneda Aceptada:
- Solo **USDT BEP20** (Binance Smart Chain)
- Otras monedas serán rechazadas

## Estadísticas en el Historial

En la parte superior del historial verás:

- **Total** - Número total de transacciones
- **Pendientes** - Transacciones en proceso (amarillo)
- **Exitosas** - Transacciones completadas (verde)
- **Fallidas** - Transacciones con error (rojo)

## Detalles Técnicos

Si eres desarrollador o necesitas información técnica:

1. Toca **"Ver detalles técnicos"** en una transacción fallida
2. Verás el error completo en formato JSON
3. Útil para reportar problemas a soporte

## Contactar Soporte

Si necesitas ayuda:

1. Ve a **Soporte** en el menú principal
2. Incluye tu **Order ID** (ejemplo: MXI-1763924158570-c084e1d6)
3. Describe el problema
4. Adjunta capturas de pantalla si es posible

## Consejos

✅ **Completa los pagos rápidamente** - Las órdenes expiran en 1 hora

✅ **Verifica antes de cancelar** - Usa "Verificar" para asegurarte de que el pago no se procesó

✅ **Guarda tu Order ID** - Útil para rastrear pagos y contactar soporte

✅ **Revisa el historial regularmente** - Mantén limpio tu historial cancelando órdenes antiguas

❌ **No crees múltiples órdenes** - Cancela las antiguas antes de crear nuevas

❌ **No uses otras monedas** - Solo USDT BEP20 es aceptado

❌ **No esperes más de 1 hora** - Completa el pago antes de que expire
