
# Estado Actual del Proyecto MXI Liquidity Pool

**Fecha de Documentación**: Enero 2025
**Versión**: 1.0.3
**Plataforma**: Nativeli

## Resumen del Proyecto

Aplicación de Pool de Liquidez para Maxcoin (MXI) desarrollada en React Native + Expo 54, con backend en Supabase.

## Funcionalidades Implementadas

### 1. Sistema de Autenticación
- ✅ Registro de usuarios con email y contraseña
- ✅ Login con verificación de email
- ✅ Gestión de sesiones con Supabase Auth
- ✅ Campos: nombre, identificación, dirección, email, contraseña

### 2. Sistema de Pagos
- ✅ Integración con NOWPayments
- ✅ Pagos en USDT (múltiples redes: ERC20, TRC20, BEP20)
- ✅ Rango de inversión: $50 - $100,000 USD
- ✅ Conversión automática a MXI (5 MXI por cada $50 USDT)
- ✅ Verificación manual de pagos por administradores
- ✅ Historial de transacciones

### 3. Sistema de Referidos
- ✅ Código de referido único por usuario
- ✅ Comisiones multinivel:
  - Nivel 1: 3%
  - Nivel 2: 2%
  - Nivel 3: 1%
- ✅ Requisitos para retiro:
  - Mínimo 5 referidos de primer nivel activos
  - Ciclo de 10 días completado
- ✅ Dashboard de métricas de referidos
- ✅ Visualización de comisiones acumuladas

### 4. Sistema de Vesting
- ✅ Contador de MXI con precio en tiempo real
- ✅ Gráfico de velas (candlestick) para visualización
- ✅ Actualización horaria automática
- ✅ Separación entre balance disponible y en vesting
- ✅ Sistema de liberación gradual de tokens

### 5. Contador de Pool
- ✅ Contador universal de participantes
- ✅ Inicio en 56,527 personas
- ✅ Meta: 250,000 personas
- ✅ Actualización en tiempo real
- ✅ Fecha límite: 15 de enero 2026, 12:00 UTC

### 6. Panel de Administración
- ✅ Gestión de usuarios
- ✅ Aprobación de pagos manuales
- ✅ Verificación de KYC
- ✅ Gestión de retiros
- ✅ Métricas y analytics
- ✅ Sistema de mensajes
- ✅ Gestión de balances de usuarios
- ✅ Distribución de premios

### 7. Sistema de Retiros
- ✅ Retiro de comisiones de referidos
- ✅ Retiro de MXI (con restricciones de vesting)
- ✅ Validación de requisitos
- ✅ Aprobación por administradores

### 8. Interfaz de Usuario
- ✅ Diseño moderno y responsivo
- ✅ Soporte para modo claro y oscuro
- ✅ Navegación con tabs nativos
- ✅ Animaciones suaves
- ✅ Soporte multiidioma (español/inglés)

## Estructura de Base de Datos (Supabase)

### Tablas Principales:
- `profiles` - Perfiles de usuario
- `transactions` - Transacciones de pago
- `referrals` - Sistema de referidos
- `withdrawals` - Solicitudes de retiro
- `kyc_verifications` - Verificaciones KYC
- `admin_messages` - Mensajes del sistema
- `vesting_schedules` - Programación de vesting
- `pool_stats` - Estadísticas del pool

### Edge Functions:
- `create-payment-intent` - Crear intención de pago
- `nowpayments-webhook` - Webhook de NOWPayments
- `auto-verify-payments` - Verificación automática
- `manual-verify-payment` - Verificación manual
- `update-vesting-hourly` - Actualización de vesting
- `check-nowpayments-status` - Verificar estado de pago

## Configuración Requerida

### Variables de Entorno (Supabase):
- `NOWPAYMENTS_API_KEY` - API key de NOWPayments
- `NOWPAYMENTS_IPN_SECRET` - Secret para webhooks
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_ANON_KEY` - Clave anónima de Supabase

### Configuración de NOWPayments:
- Sandbox/Production mode
- IPN Callback URL configurado
- Monedas soportadas: USDT (ERC20, TRC20, BEP20)

## Problemas Conocidos Resueltos

1. ✅ Error BUILD_TIMESTAMP - Resuelto eliminando sistema de versiones complejo
2. ✅ Pagos no reflejados - Resuelto con sistema de verificación manual
3. ✅ Comisiones de referidos - Unificadas en una sola tabla
4. ✅ Vesting calculation - Corregido cálculo de liberación
5. ✅ Cache web - Implementado sistema de cache busting

## Dependencias Principales

```json
{
  "expo": "~54.0.1",
  "react": "19.1.0",
  "react-native": "0.81.4",
  "@supabase/supabase-js": "^2.81.0",
  "expo-router": "^6.0.0",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

## Próximos Pasos Sugeridos

1. **Sincronización con GitHub**:
   - Contactar soporte de Nativeli para configurar Git
   - O recrear repositorio y vincularlo nuevamente

2. **Testing**:
   - Probar flujo completo de pago
   - Verificar sistema de referidos
   - Validar cálculos de vesting

3. **Optimizaciones**:
   - Mejorar rendimiento de gráficos
   - Optimizar consultas a base de datos
   - Implementar caché más agresivo

## Notas Importantes

- **Proyecto ID Supabase**: aeyfnjuatbtcauiumbhn
- **Plataforma**: Nativeli (no local)
- **Versión actual**: 1.0.3
- **Última actualización**: Enero 2025

## Contacto y Soporte

Para sincronización con GitHub, contactar:
- Soporte de Nativeli
- Documentación: https://natively.dev

---

**IMPORTANTE**: Este documento refleja el estado actual del proyecto en Nativeli. 
Para sincronizar con GitHub, se requiere usar las herramientas de Git de Nativeli 
o recrear el repositorio y vincularlo nuevamente.
