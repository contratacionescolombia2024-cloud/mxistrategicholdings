
# 🎯 Tarjeta Rápida: Configurar Alchemy

## Tu Clave API
```
-lEOTdd5GorChO7dTiJD9
```

## Pasos (2 minutos)

### 1️⃣ Ir a Supabase
```
https://app.supabase.com
→ Tu Proyecto
→ Settings ⚙️
→ Edge Functions
→ Manage secrets
```

### 2️⃣ Agregar Secrets

**Secret 1:**
```
Name:  ALCHEMY_API_KEY
Value: -lEOTdd5GorChO7dTiJD9
```

**Secret 2:**
```
Name:  BNB_RPC_URL
Value: https://bsc-dataseed.binance.org/
```

### 3️⃣ Guardar y Esperar
- Hacer clic en "Save"
- Esperar 2 minutos ⏱️

### 4️⃣ Verificar
- Abrir la app
- Ir a Depósitos
- Clic en "Probar Configuración"
- Ver: ✅ "All networks configured"

## ✅ Resultado

| Red | Estado |
|-----|--------|
| Ethereum | ✅ Listo (Alchemy) |
| Polygon | ✅ Listo (Alchemy) |
| BNB Chain | ✅ Listo (RPC Público) |

## 🆘 Problemas?

**Error: "Cannot read properties"**
→ Espera 2 minutos más

**Error: "RPC not configured"**
→ Verifica que agregaste ambos secrets

**Error: "Chain ID mismatch"**
→ Verifica la clave: `-lEOTdd5GorChO7dTiJD9`

## 📞 Ayuda

Ver logs en:
```
Supabase Dashboard
→ Edge Functions
→ Logs
```

---

**¡Solo 2 secrets y listo!** 🎉
