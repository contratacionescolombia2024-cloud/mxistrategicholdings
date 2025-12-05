
# Guía de Configuración de Secrets Multi-Red para Supabase

## 📋 Resumen

Este sistema valida pagos en USDT en **tres redes blockchain diferentes**:
- **Ethereum (ERC20)**
- **BNB Chain (BEP20)**
- **Polygon (Matic)**

Cada red requiere su **propio RPC URL** configurado como secret en Supabase.

---

## 🔑 Secrets Requeridos

Debes configurar **3 secrets** en Supabase Edge Functions:

### 1. ETH_RPC_URL
**Red:** Ethereum Mainnet  
**Propósito:** Validar transacciones USDT ERC20  
**Ejemplo de valor:**
```
https://eth-mainnet.g.alchemy.com/v2/TU_API_KEY
```

**Proveedores recomendados:**
- Alchemy: https://www.alchemy.com/
- Infura: https://www.infura.io/
- QuickNode: https://www.quicknode.com/

### 2. BNB_RPC_URL
**Red:** BNB Smart Chain (BSC)  
**Propósito:** Validar transacciones USDT BEP20  
**Ejemplo de valor:**
```
https://bsc-dataseed1.binance.org
```

**Proveedores recomendados:**
- Binance Public RPC: `https://bsc-dataseed1.binance.org`
- Ankr: `https://rpc.ankr.com/bsc`
- QuickNode: https://www.quicknode.com/

### 3. POLYGON_RPC_URL
**Red:** Polygon Mainnet  
**Propósito:** Validar transacciones USDT en Polygon  
**Ejemplo de valor:**
```
https://polygon-mainnet.g.alchemy.com/v2/TU_API_KEY
```

**Proveedores recomendados:**
- Alchemy: https://www.alchemy.com/
- Infura: https://www.infura.io/
- Polygon Public RPC: `https://polygon-rpc.com`

---

## 🛠️ Cómo Configurar los Secrets en Supabase

### Opción 1: Desde el Dashboard de Supabase

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Navega a **Project Settings** → **Edge Functions**
3. En la sección **Secrets**, haz clic en **Add Secret**
4. Agrega cada secret:

   **Secret 1:**
   - Name: `ETH_RPC_URL`
   - Value: Tu URL de RPC de Ethereum

   **Secret 2:**
   - Name: `BNB_RPC_URL`
   - Value: Tu URL de RPC de BNB Chain

   **Secret 3:**
   - Name: `POLYGON_RPC_URL`
   - Value: Tu URL de RPC de Polygon

5. Haz clic en **Save** para cada secret

### Opción 2: Usando Supabase CLI

```bash
# Configurar ETH_RPC_URL
supabase secrets set ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/TU_API_KEY

# Configurar BNB_RPC_URL
supabase secrets set BNB_RPC_URL=https://bsc-dataseed1.binance.org

# Configurar POLYGON_RPC_URL
supabase secrets set POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/TU_API_KEY
```

### Verificar los Secrets

```bash
# Listar todos los secrets configurados
supabase secrets list
```

---

## 🔍 Validación por Red

### Ethereum (ERC20)
- **Chain ID:** 1
- **Contrato USDT:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Decimales:** 6
- **Secret requerido:** `ETH_RPC_URL`

### BNB Chain (BEP20)
- **Chain ID:** 56
- **Contrato USDT:** `0x55d398326f99059fF775485246999027B3197955`
- **Decimales:** 18
- **Secret requerido:** `BNB_RPC_URL`

### Polygon (Matic)
- **Chain ID:** 137
- **Contrato USDT:** `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- **Decimales:** 6
- **Secret requerido:** `POLYGON_RPC_URL`

---

## ⚠️ Importante

1. **Cada red valida solo sus propias transacciones:**
   - Los pagos en Ethereum solo se validan con `ETH_RPC_URL`
   - Los pagos en BNB Chain solo se validan con `BNB_RPC_URL`
   - Los pagos en Polygon solo se validan con `POLYGON_RPC_URL`

2. **No mezclar redes:**
   - Si un usuario selecciona "Ethereum" pero envía desde BNB Chain, la validación fallará
   - El sistema verifica el Chain ID para asegurar que el RPC esté conectado a la red correcta

3. **Confirmaciones requeridas:**
   - Todas las redes requieren **3 confirmaciones** antes de acreditar MXI

4. **Dirección receptora:**
   - La misma dirección se usa en todas las redes: `0x68F0d7c607617DA0b1a0dC7b72885E11ddFec623`

---

## 🧪 Cómo Probar

### 1. Verificar que los secrets estén configurados

Intenta hacer una verificación de pago. Si falta un secret, verás un error como:

```json
{
  "ok": false,
  "error": "rpc_not_configured",
  "message": "RPC URL no configurado para Ethereum (ERC20). Variable requerida: ETH_RPC_URL"
}
```

### 2. Probar cada red

1. **Ethereum:**
   - Selecciona "Ethereum (ERC20)" en la app
   - Envía USDT ERC20 a la dirección receptora
   - Copia el txHash y verifica

2. **BNB Chain:**
   - Selecciona "BNB Chain (BEP20)" en la app
   - Envía USDT BEP20 a la dirección receptora
   - Copia el txHash y verifica

3. **Polygon:**
   - Selecciona "Polygon (Matic)" en la app
   - Envía USDT en Polygon a la dirección receptora
   - Copia el txHash y verifica

---

## 🚨 Solución de Problemas

### Error: "RPC URL no configurado"
**Causa:** El secret no está configurado en Supabase  
**Solución:** Configura el secret correspondiente (ETH_RPC_URL, BNB_RPC_URL, o POLYGON_RPC_URL)

### Error: "Chain ID mismatch"
**Causa:** El RPC URL está conectado a una red diferente  
**Solución:** Verifica que el RPC URL sea correcto para la red seleccionada

### Error: "Transacción no encontrada"
**Causa:** El txHash no existe en la red seleccionada  
**Solución:** Verifica que:
- El txHash sea correcto
- La red seleccionada coincida con la red donde se hizo la transacción
- La transacción tenga al menos 1 confirmación

### Error: "No se encontró una transferencia USDT válida"
**Causa:** La transacción no es una transferencia USDT o no es a la dirección correcta  
**Solución:** Verifica que:
- La transacción sea una transferencia del contrato USDT correcto
- La dirección receptora sea `0x68F0d7c607617DA0b1a0dC7b72885E11ddFec623`

---

## 📊 Resumen de Configuración

| Red | Secret Name | Contrato USDT | Decimales | Chain ID |
|-----|-------------|---------------|-----------|----------|
| Ethereum | `ETH_RPC_URL` | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6 | 1 |
| BNB Chain | `BNB_RPC_URL` | `0x55d398326f99059fF775485246999027B3197955` | 18 | 56 |
| Polygon | `POLYGON_RPC_URL` | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 | 137 |

---

## ✅ Checklist de Configuración

- [ ] Crear cuenta en proveedor de RPC (Alchemy, Infura, etc.)
- [ ] Obtener API key para Ethereum
- [ ] Obtener API key para BNB Chain (o usar RPC público)
- [ ] Obtener API key para Polygon
- [ ] Configurar `ETH_RPC_URL` en Supabase
- [ ] Configurar `BNB_RPC_URL` en Supabase
- [ ] Configurar `POLYGON_RPC_URL` en Supabase
- [ ] Verificar secrets con `supabase secrets list`
- [ ] Redesplegar Edge Function `verificar-tx`
- [ ] Probar pago en Ethereum
- [ ] Probar pago en BNB Chain
- [ ] Probar pago en Polygon

---

## 🔗 Enlaces Útiles

- **Alchemy:** https://www.alchemy.com/
- **Infura:** https://www.infura.io/
- **QuickNode:** https://www.quicknode.com/
- **Supabase Docs - Edge Functions:** https://supabase.com/docs/guides/functions
- **Supabase Docs - Secrets:** https://supabase.com/docs/guides/functions/secrets

---

## 📝 Notas Adicionales

- Los RPC públicos pueden tener límites de rate (solicitudes por segundo)
- Para producción, se recomienda usar servicios pagos como Alchemy o Infura
- Los secrets son específicos por proyecto de Supabase
- Cambiar un secret requiere redesplegar las Edge Functions
