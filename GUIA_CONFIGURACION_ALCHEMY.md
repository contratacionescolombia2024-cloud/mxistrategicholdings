
# 🔑 Guía Rápida: Configurar Clave API de Alchemy

## ✅ Tu Clave API

Tu clave API de Alchemy es: **`-lEOTdd5GorChO7dTiJD9`**

## 📝 Pasos para Configurar (5 minutos)

### Paso 1: Acceder a Supabase

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️ en el menú lateral)
4. Haz clic en **Edge Functions**

### Paso 2: Agregar la Clave de Alchemy

1. Haz clic en **"Manage secrets"**
2. Haz clic en **"Add new secret"**
3. Completa:
   - **Name:** `ALCHEMY_API_KEY`
   - **Value:** `-lEOTdd5GorChO7dTiJD9`
4. Haz clic en **"Save"**

### Paso 3: Agregar RPC para BNB Chain

1. Haz clic en **"Add new secret"** nuevamente
2. Completa:
   - **Name:** `BNB_RPC_URL`
   - **Value:** `https://bsc-dataseed.binance.org/`
3. Haz clic en **"Save"**

### Paso 4: Verificar

1. Espera 1-2 minutos para que los cambios se propaguen
2. Abre tu aplicación
3. Ve a la sección de **Depósitos/Pagos**
4. Haz clic en **"Probar Configuración del Servidor"**
5. Deberías ver: ✅ **"All networks are properly configured"**

## 🎯 ¿Qué Hace Esto?

Con esta configuración:

- ✅ **Ethereum (ERC20)** funcionará automáticamente usando Alchemy
- ✅ **Polygon (Matic)** funcionará automáticamente usando Alchemy  
- ✅ **BNB Chain (BEP20)** funcionará usando el RPC público de Binance

## 🔍 Verificar que Funciona

Después de configurar, prueba hacer un pago:

1. Selecciona una red (Ethereum, BNB Chain o Polygon)
2. Envía USDT a la dirección mostrada
3. Copia el hash de la transacción
4. Pégalo en la app y haz clic en "Verificar"
5. Deberías ver: ✅ **"Pago confirmado"**

## ❌ Solución de Problemas

### Error: "Cannot read properties of undefined"

**Solución:** Los secrets no se han propagado todavía. Espera 2-3 minutos y vuelve a intentar.

### Error: "RPC URL not configured"

**Solución:** 
1. Verifica que agregaste ambos secrets: `ALCHEMY_API_KEY` y `BNB_RPC_URL`
2. Verifica que no haya espacios extra al copiar/pegar
3. Espera 2 minutos después de guardar

### Error: "Chain ID mismatch"

**Solución:** La clave de Alchemy es incorrecta. Verifica que copiaste: `-lEOTdd5GorChO7dTiJD9`

## 📊 Estado de las Redes

Después de configurar correctamente:

| Red | Estado | Método |
|-----|--------|--------|
| Ethereum | ✅ Listo | Alchemy API |
| Polygon | ✅ Listo | Alchemy API |
| BNB Chain | ✅ Listo | RPC Público |

## 🔐 Seguridad

- ✅ Las claves se almacenan de forma segura en Supabase
- ✅ No se exponen en el código del cliente
- ✅ Solo las Edge Functions tienen acceso
- ✅ Nunca se envían al navegador

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues teniendo problemas:

1. Verifica los logs en: Supabase Dashboard → Edge Functions → Logs
2. Usa el botón "Probar Configuración" para diagnóstico
3. Asegúrate de que los secrets estén guardados correctamente
4. Espera 2-3 minutos después de agregar los secrets

## ✨ Resumen

**Solo necesitas agregar 2 secrets:**

1. `ALCHEMY_API_KEY` = `-lEOTdd5GorChO7dTiJD9`
2. `BNB_RPC_URL` = `https://bsc-dataseed.binance.org/`

**¡Y listo!** Todas las redes funcionarán automáticamente. 🎉
