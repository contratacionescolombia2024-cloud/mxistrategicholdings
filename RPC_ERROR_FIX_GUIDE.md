
# 🔧 Guía de Solución: Error de RPC URL

## 🚨 Error Actual

```
[0:08:09] Probando configuración del servidor...
[0:08:11] ❌ Error probando configuración: Cannot read properties of undefined (reading 'ETH_RPC_URL')
```

## 📋 Causa del Problema

El error ocurre porque las **variables de entorno (secrets)** necesarias para conectarse a las redes blockchain **no están configuradas** en Supabase Edge Functions.

Las variables requeridas son:
- `ETH_RPC_URL` - Para validar transacciones en Ethereum
- `BNB_RPC_URL` - Para validar transacciones en BNB Chain
- `POLYGON_RPC_URL` - Para validar transacciones en Polygon

## ✅ Solución Paso a Paso

### Paso 1: Acceder a Supabase Dashboard

1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **"pool liquidez"** (ID: `aeyfnjuatbtcauiumbhn`)

### Paso 2: Navegar a Edge Functions Secrets

1. En el menú lateral izquierdo, haz clic en **"Edge Functions"**
2. Haz clic en el botón **"Manage secrets"** (o ve a **Settings → Edge Functions**)
3. Verás una lista de secrets configurados (si hay alguno)

### Paso 3: Agregar las Variables de Entorno

Necesitas agregar **3 secrets**. Para cada uno:

#### Secret 1: ETH_RPC_URL (Ethereum)

**Nombre del Secret:**
```
ETH_RPC_URL
```

**Valor Recomendado (Opción 1 - RPC Público):**
```
https://eth.llamarpc.com
```

**Valor Recomendado (Opción 2 - Alchemy, más confiable):**
```
https://eth-mainnet.g.alchemy.com/v2/TU_CLAVE_AQUI
```

Para obtener una clave de Alchemy:
1. Ve a https://www.alchemy.com/
2. Crea una cuenta gratuita
3. Crea una nueva app para **Ethereum Mainnet**
4. Copia la URL HTTPS completa

**Otras opciones públicas:**
- `https://rpc.ankr.com/eth`
- `https://ethereum.publicnode.com`

#### Secret 2: BNB_RPC_URL (BNB Chain)

**Nombre del Secret:**
```
BNB_RPC_URL
```

**Valor Recomendado (RPC Oficial de Binance):**
```
https://bsc-dataseed.binance.org/
```

**Alternativas:**
- `https://bsc-dataseed1.binance.org/`
- `https://bsc-dataseed2.binance.org/`
- `https://rpc.ankr.com/bsc`

#### Secret 3: POLYGON_RPC_URL (Polygon)

**Nombre del Secret:**
```
POLYGON_RPC_URL
```

**Valor Recomendado (RPC Público):**
```
https://polygon-rpc.com/
```

**Alternativas:**
- `https://rpc-mainnet.matic.network`
- `https://rpc.ankr.com/polygon`
- `https://polygon-mainnet.public.blastapi.io`

### Paso 4: Guardar los Secrets

1. Después de agregar cada secret, haz clic en **"Add secret"** o **"Save"**
2. Repite el proceso para los 3 secrets
3. Verifica que los 3 secrets aparezcan en la lista

### Paso 5: Verificar la Configuración

1. Abre la app MXI Liquidity Pool
2. Ve a la pantalla **"Depositar USDT"**
3. Presiona el botón naranja **"Probar Configuración del Servidor"**
4. Deberías ver un mensaje de éxito:

```
✅ Configuración Correcta
ETH: ✅ Configured
BNB: ✅ Configured
Polygon: ✅ Configured
```

## 🎯 Configuración Rápida (Copiar y Pegar)

Si quieres empezar rápido con RPCs públicos:

### En Supabase Dashboard → Edge Functions → Manage secrets:

**Secret 1:**
- Name: `ETH_RPC_URL`
- Value: `https://eth.llamarpc.com`

**Secret 2:**
- Name: `BNB_RPC_URL`
- Value: `https://bsc-dataseed.binance.org/`

**Secret 3:**
- Name: `POLYGON_RPC_URL`
- Value: `https://polygon-rpc.com/`

## 📊 Comparación de Proveedores

| Proveedor | Confiabilidad | Velocidad | Límite Gratis | Recomendación |
|-----------|---------------|-----------|---------------|---------------|
| **Alchemy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 300M req/mes | Mejor para producción |
| **Infura** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 100K req/día | Buena alternativa |
| **Binance RPC** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Ilimitado | Oficial para BSC |
| **RPCs Públicos** | ⭐⭐⭐ | ⭐⭐⭐ | Variable | Solo para pruebas |

## 🐛 Solución de Problemas

### Error: "Cannot read properties of undefined"
**Causa:** Los secrets no están configurados en Supabase  
**Solución:** Sigue los pasos anteriores para configurar los 3 secrets

### Error: "RPC connection failed"
**Causa:** La URL del RPC es incorrecta o el servicio está caído  
**Solución:** 
1. Verifica que la URL no tenga espacios al inicio o final
2. Prueba con una URL alternativa
3. Verifica que la URL comience con `https://`

### Error: "Wrong network"
**Causa:** El RPC está conectado a una red diferente (testnet vs mainnet)  
**Solución:** Asegúrate de usar URLs de **mainnet**, no testnet

### Los secrets no se guardan
**Causa:** Puede haber un problema de permisos o sesión  
**Solución:**
1. Cierra sesión y vuelve a iniciar sesión en Supabase
2. Verifica que tengas permisos de administrador en el proyecto
3. Intenta desde un navegador diferente

## ⚠️ Notas Importantes

1. **Seguridad:** Las claves de API (como las de Alchemy o Infura) son sensibles. No las compartas públicamente.

2. **Límites de Rate:** Los servicios gratuitos tienen límites de requests. Para producción, considera usar servicios pagos.

3. **Mainnet vs Testnet:** Asegúrate de usar URLs de **mainnet** para producción, no testnet.

4. **Redundancia:** Considera tener múltiples proveedores configurados como respaldo.

5. **No se requiere redespliegue:** Una vez que configures los secrets, las Edge Functions tendrán acceso automático. No necesitas redesplegar nada.

## 🔗 Enlaces Útiles

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Alchemy:** https://www.alchemy.com/
- **Infura:** https://infura.io/
- **Binance RPC Docs:** https://docs.bnbchain.org/docs/rpc
- **Polygon RPC Docs:** https://wiki.polygon.technology/docs/pos/reference/rpc-endpoints/

## ✅ Checklist de Configuración

- [ ] Acceder a Supabase Dashboard
- [ ] Ir a Edge Functions → Manage secrets
- [ ] Agregar `ETH_RPC_URL` con valor válido
- [ ] Agregar `BNB_RPC_URL` con valor válido
- [ ] Agregar `POLYGON_RPC_URL` con valor válido
- [ ] Guardar todos los secrets
- [ ] Probar configuración con el botón en la app
- [ ] Verificar que muestre "✅ Configuración Correcta"
- [ ] Probar verificación de transacción

## 🎉 Resultado Esperado

Una vez configurado correctamente:

1. ✅ El botón "Probar Configuración del Servidor" mostrará éxito
2. ✅ Los usuarios podrán verificar transacciones en las 3 redes
3. ✅ Las transacciones válidas acreditarán MXI automáticamente
4. ✅ Los errores serán claros y específicos

## 📞 Soporte Adicional

Si después de seguir esta guía sigues teniendo problemas:

1. Verifica los logs en Supabase Dashboard → Edge Functions → Logs
2. Usa el "Log de Depuración" en la parte inferior de la pantalla de la app
3. Asegúrate de que las URLs no tengan espacios o caracteres extra
4. Verifica que las claves de API sean válidas y activas

---

**Última actualización:** 2025-01-25  
**Versión:** 2.0  
**Estado:** Actualizado con mejor manejo de errores
