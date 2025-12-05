
# ⚡ Solución Rápida: Error de RPC URL

## 🚨 Error Actual
```
RPC URL no configurado para Ethereum (ERC20)
```

## ✅ Solución en 3 Pasos

### 1️⃣ Ve a Supabase Dashboard
```
https://supabase.com/dashboard
→ Proyecto: "pool liquidez"
→ Edge Functions
→ Manage secrets
```

### 2️⃣ Agrega estas 3 variables

```bash
# Ethereum (usa Alchemy - gratis)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/TU_CLAVE

# BNB Chain (usa RPC oficial de Binance)
BNB_RPC_URL=https://bsc-dataseed.binance.org/

# Polygon (usa RPC público)
POLYGON_RPC_URL=https://polygon-rpc.com/
```

### 3️⃣ Obtén tu clave de Alchemy (para Ethereum)

1. Ve a https://www.alchemy.com/
2. Crea cuenta gratis
3. Crea app para "Ethereum Mainnet"
4. Copia la URL HTTPS

## 🎯 Configuración Mínima Funcional

Si quieres empezar rápido con RPCs públicos (no recomendado para producción):

```bash
ETH_RPC_URL=https://eth.llamarpc.com
BNB_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
```

## ✅ Verificar que Funciona

En la app, presiona el botón naranja:
```
"Probar Configuración del Servidor"
```

Debe mostrar:
```
✅ Configuración Correcta
ETH: ✅ Configured
BNB: ✅ Configured
Polygon: ✅ Configured
```

## 📞 ¿Necesitas Ayuda?

Lee la guía completa en: `RPC_CONFIGURATION_GUIDE.md`
