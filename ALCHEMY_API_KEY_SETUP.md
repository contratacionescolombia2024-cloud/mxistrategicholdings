
# 🔑 Configuración de Alchemy API Key

## Resumen Rápido

Has proporcionado tu clave API de Alchemy: `-lEOTdd5GorChO7dTiJD9`

Para configurarla en tu aplicación, sigue estos pasos:

## 📋 Pasos para Configurar

### 1. Acceder a Supabase Dashboard

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: `aeyfnjuatbtcauiumbhn`
3. Ve a **Settings** (Configuración) en el menú lateral
4. Selecciona **Edge Functions**

### 2. Agregar la Clave API como Secret

1. Haz clic en **"Manage secrets"** o **"Add new secret"**
2. Agrega el siguiente secret:
   - **Nombre:** `ALCHEMY_API_KEY`
   - **Valor:** `-lEOTdd5GorChO7dTiJD9`
3. Haz clic en **"Save"** o **"Add secret"**

### 3. Configurar BNB Chain (Opcional pero Recomendado)

Alchemy no soporta BNB Chain, así que necesitas agregar un RPC público:

1. En la misma sección de secrets, agrega:
   - **Nombre:** `BNB_RPC_URL`
   - **Valor:** `https://bsc-dataseed.binance.org/`
2. Guarda el secret

### 4. Verificar la Configuración

Después de agregar los secrets, puedes verificar que todo esté configurado correctamente:

1. Ve a la aplicación
2. Navega a la sección de pagos
3. Haz clic en el botón **"Probar Configuración del Servidor"**
4. Deberías ver un mensaje de éxito indicando que todas las redes están configuradas

## 🌐 Redes Soportadas

Con tu clave API de Alchemy configurada, tendrás acceso a:

### ✅ Ethereum (ERC20)
- **Método:** Alchemy API
- **URL construida automáticamente:** `https://eth-mainnet.g.alchemy.com/v2/-lEOTdd5GorChO7dTiJD9`
- **Contrato USDT:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`

### ✅ Polygon (Matic)
- **Método:** Alchemy API
- **URL construida automáticamente:** `https://polygon-mainnet.g.alchemy.com/v2/-lEOTdd5GorChO7dTiJD9`
- **Contrato USDT:** `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`

### ⚠️ BNB Chain (BEP20)
- **Método:** RPC Público (Alchemy no soporta BNB)
- **Requiere configurar:** `BNB_RPC_URL`
- **Valor recomendado:** `https://bsc-dataseed.binance.org/`
- **Contrato USDT:** `0x55d398326f99059fF775485246999027B3197955`

## 🔄 Cómo Funciona

El sistema ahora tiene dos métodos para obtener URLs de RPC:

1. **Método Directo:** Si existe una variable específica (ej: `ETH_RPC_URL`), la usa directamente
2. **Método Alchemy (Fallback):** Si no existe la variable específica pero existe `ALCHEMY_API_KEY`, construye la URL automáticamente para redes soportadas

### Ejemplo de Prioridad

Para Ethereum:
```
1. Busca ETH_RPC_URL → Si existe, usa esa URL
2. Si no existe, busca ALCHEMY_API_KEY → Construye URL de Alchemy
3. Si ninguna existe → Error de configuración
```

## 🚀 Ventajas de Usar Alchemy

- **Confiabilidad:** 99.9% de uptime
- **Velocidad:** Respuestas rápidas y optimizadas
- **Límites Generosos:** 300M compute units/mes en plan gratuito
- **Soporte Multi-Red:** Ethereum y Polygon con una sola clave
- **Monitoreo:** Dashboard para ver uso y estadísticas

## 🔧 Configuración Alternativa (Opcional)

Si prefieres usar URLs de RPC específicas en lugar de Alchemy, puedes configurar:

```
ETH_RPC_URL=https://eth.llamarpc.com
BNB_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
```

Estas tendrán prioridad sobre la clave de Alchemy.

## ✅ Checklist de Configuración

- [ ] Agregar `ALCHEMY_API_KEY` en Supabase Edge Functions secrets
- [ ] Agregar `BNB_RPC_URL` en Supabase Edge Functions secrets
- [ ] Verificar configuración usando el botón de prueba en la app
- [ ] Probar un pago en Ethereum para verificar que funciona
- [ ] Probar un pago en Polygon para verificar que funciona
- [ ] Probar un pago en BNB Chain para verificar que funciona

## 🆘 Solución de Problemas

### Error: "Cannot read properties of undefined (reading 'ETH_RPC_URL')"

**Causa:** Los secrets no están configurados en Supabase.

**Solución:**
1. Ve a Supabase Dashboard → Settings → Edge Functions
2. Agrega `ALCHEMY_API_KEY` con tu clave
3. Espera 1-2 minutos para que se propague
4. Intenta de nuevo

### Error: "RPC URL not configured"

**Causa:** Falta configurar el RPC para una red específica.

**Solución:**
- Para Ethereum/Polygon: Agrega `ALCHEMY_API_KEY`
- Para BNB Chain: Agrega `BNB_RPC_URL`

### Error: "Chain ID mismatch"

**Causa:** La URL de RPC está conectada a una red diferente.

**Solución:**
1. Verifica que la URL de RPC sea correcta para la red
2. Para Alchemy, asegúrate de que la clave sea válida
3. Revisa los logs en Supabase para más detalles

## 📞 Soporte

Si tienes problemas después de seguir estos pasos:

1. Verifica los logs en Supabase Dashboard → Edge Functions → Logs
2. Usa el botón "Probar Configuración" en la app para diagnóstico
3. Revisa que los secrets estén guardados correctamente
4. Espera 1-2 minutos después de agregar secrets para que se propaguen

## 🔐 Seguridad

- ✅ Las claves API se almacenan de forma segura en Supabase
- ✅ No se exponen en el código del cliente
- ✅ Solo las Edge Functions tienen acceso a las claves
- ✅ Las claves nunca se envían al navegador del usuario

## 📚 Recursos Adicionales

- [Documentación de Alchemy](https://docs.alchemy.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Guía de RPC Configuration](./RPC_CONFIGURATION_GUIDE.md)
- [Guía de Pagos Multi-Red](./GUIA_RAPIDA_PAGOS_MULTI_RED.md)
