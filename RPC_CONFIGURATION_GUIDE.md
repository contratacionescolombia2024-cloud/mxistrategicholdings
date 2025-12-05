
# 🔧 Guía de Configuración de RPC URLs para Verificación de Transacciones

## 📋 Resumen del Problema

El error **"RPC URL no configurado para Ethereum (ERC20)"** ocurre porque las variables de entorno necesarias para conectarse a las redes blockchain no están configuradas en Supabase Edge Functions.

## ✅ Solución Inmediata

### Paso 1: Acceder a Supabase Dashboard

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: **"pool liquidez"**
3. En el menú lateral, haz clic en **"Edge Functions"**
4. Haz clic en **"Manage secrets"** o ve a **Settings → Edge Functions**

### Paso 2: Configurar las Variables de Entorno

Necesitas agregar **3 variables de entorno** (secrets):

#### 1. ETH_RPC_URL (Ethereum Mainnet)

**Opciones recomendadas:**

**Opción A: Alchemy (Recomendado - Gratis hasta 300M requests/mes)**
```
Nombre: ETH_RPC_URL
Valor: https://eth-mainnet.g.alchemy.com/v2/TU_CLAVE_ALCHEMY
```

Cómo obtener tu clave de Alchemy:
1. Ve a https://www.alchemy.com/
2. Crea una cuenta gratuita
3. Crea una nueva app para **Ethereum Mainnet**
4. Copia la URL HTTPS (se verá como: `https://eth-mainnet.g.alchemy.com/v2/abc123...`)

**Opción B: Infura (Alternativa)**
```
Nombre: ETH_RPC_URL
Valor: https://mainnet.infura.io/v3/TU_CLAVE_INFURA
```

Cómo obtener tu clave de Infura:
1. Ve a https://infura.io/
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia el endpoint HTTPS de Ethereum Mainnet

**Opción C: RPC Público (No recomendado para producción)**
```
Nombre: ETH_RPC_URL
Valor: https://eth.llamarpc.com
```

Otras opciones públicas:
- `https://rpc.ankr.com/eth`
- `https://ethereum.publicnode.com`

⚠️ **Nota:** Los RPCs públicos pueden ser lentos o inestables. Se recomienda usar Alchemy o Infura.

#### 2. BNB_RPC_URL (BNB Chain / BSC)

**RPCs Públicos Oficiales de Binance:**
```
Nombre: BNB_RPC_URL
Valor: https://bsc-dataseed.binance.org/
```

Alternativas:
- `https://bsc-dataseed1.binance.org/`
- `https://bsc-dataseed2.binance.org/`
- `https://bsc-dataseed3.binance.org/`
- `https://bsc-dataseed4.binance.org/`

#### 3. POLYGON_RPC_URL (Polygon Mainnet)

**RPCs Públicos:**
```
Nombre: POLYGON_RPC_URL
Valor: https://polygon-rpc.com/
```

Alternativas:
- `https://rpc-mainnet.matic.network`
- `https://rpc.ankr.com/polygon`
- `https://polygon-mainnet.public.blastapi.io`

### Paso 3: Guardar y Verificar

1. Después de agregar las 3 variables, haz clic en **"Save"**
2. Las Edge Functions tendrán acceso automático a estas variables
3. No necesitas redesplegar las funciones manualmente

### Paso 4: Probar la Configuración

En la app, hay un botón naranja que dice **"Probar Configuración del Servidor"**. Presiónalo para verificar que todas las variables estén configuradas correctamente.

El botón mostrará:
- ✅ **Configuración Correcta** si todas las variables están configuradas
- ⚠️ **Configuración Incompleta** si falta alguna variable, con instrucciones detalladas

## 🔍 Verificación Manual

También puedes verificar la configuración llamando directamente a la Edge Function de prueba:

```bash
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-rpc-config
```

Respuesta esperada cuando todo está configurado:
```json
{
  "ok": true,
  "message": "All RPC URLs are configured correctly",
  "config": {
    "ETH_RPC_URL": {
      "configured": true,
      "value": "https://eth-mainnet.g.alchemy...",
      "status": "✅ Configured"
    },
    "BNB_RPC_URL": {
      "configured": true,
      "value": "https://bsc-dataseed.binance...",
      "status": "✅ Configured"
    },
    "POLYGON_RPC_URL": {
      "configured": true,
      "value": "https://polygon-rpc.com/...",
      "status": "✅ Configured"
    }
  }
}
```

## 📊 Comparación de Proveedores RPC

| Proveedor | Ethereum | BNB Chain | Polygon | Límite Gratis | Recomendación |
|-----------|----------|-----------|---------|---------------|---------------|
| **Alchemy** | ✅ | ❌ | ✅ | 300M req/mes | ⭐⭐⭐⭐⭐ Mejor opción |
| **Infura** | ✅ | ❌ | ✅ | 100K req/día | ⭐⭐⭐⭐ Buena alternativa |
| **Binance** | ❌ | ✅ | ❌ | Ilimitado | ⭐⭐⭐⭐⭐ Oficial para BSC |
| **Público** | ✅ | ✅ | ✅ | Variable | ⭐⭐ Solo para pruebas |

## 🎯 Configuración Recomendada

Para producción, recomendamos:

```
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/TU_CLAVE_ALCHEMY
BNB_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
```

## 🐛 Solución de Problemas

### Error: "RPC URL no configurado"
- **Causa:** La variable de entorno no está configurada en Supabase
- **Solución:** Sigue los pasos anteriores para configurar las variables

### Error: "RPC connection failed"
- **Causa:** La URL del RPC es incorrecta o el servicio está caído
- **Solución:** Verifica que la URL sea correcta y prueba con una alternativa

### Error: "Wrong network"
- **Causa:** El RPC está conectado a una red diferente (testnet vs mainnet)
- **Solución:** Asegúrate de usar URLs de **mainnet**, no testnet

### Error: "Transaction not found"
- **Causa:** La transacción no existe en esa red o aún no tiene confirmaciones
- **Solución:** 
  1. Verifica que el hash sea correcto
  2. Asegúrate de que la transacción esté en la red correcta
  3. Espera a que tenga al menos 1 confirmación

## 📝 Notas Importantes

1. **Seguridad:** Las claves de API (como las de Alchemy o Infura) son sensibles. No las compartas públicamente.

2. **Límites de Rate:** Los servicios gratuitos tienen límites de requests. Monitorea tu uso.

3. **Redundancia:** Considera tener múltiples proveedores configurados como respaldo.

4. **Mainnet vs Testnet:** Asegúrate de usar URLs de **mainnet** para producción.

5. **Actualizaciones:** Las URLs públicas pueden cambiar. Mantén esta configuración actualizada.

## 🔗 Enlaces Útiles

- **Alchemy:** https://www.alchemy.com/
- **Infura:** https://infura.io/
- **Binance RPC:** https://docs.bnbchain.org/docs/rpc
- **Polygon RPC:** https://wiki.polygon.technology/docs/pos/reference/rpc-endpoints/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

## ✅ Checklist de Configuración

- [ ] Crear cuenta en Alchemy o Infura (para Ethereum)
- [ ] Obtener clave de API de Alchemy/Infura
- [ ] Acceder a Supabase Dashboard
- [ ] Ir a Edge Functions → Manage secrets
- [ ] Agregar ETH_RPC_URL
- [ ] Agregar BNB_RPC_URL
- [ ] Agregar POLYGON_RPC_URL
- [ ] Guardar cambios
- [ ] Probar configuración con el botón en la app
- [ ] Verificar que las transacciones se puedan validar

## 🎉 Resultado Esperado

Una vez configurado correctamente:

1. Los usuarios podrán verificar transacciones en las 3 redes
2. El botón "Verificar en [Red]" funcionará correctamente
3. Las transacciones válidas acreditarán MXI automáticamente
4. Los errores serán claros y específicos

## 📞 Soporte

Si después de seguir esta guía sigues teniendo problemas:

1. Usa el botón "Probar Configuración del Servidor" para diagnóstico
2. Revisa el "Log de Depuración" en la parte inferior de la pantalla
3. Verifica que las URLs no tengan espacios o caracteres extra
4. Asegúrate de que las claves de API sean válidas y activas

---

**Última actualización:** 2025-01-25
**Versión:** 1.0
