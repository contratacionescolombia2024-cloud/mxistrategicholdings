
# ⚡ Quick Fix: RPC URL Configuration

## The Problem
```
Error: Cannot read properties of undefined (reading 'ETH_RPC_URL')
```

## The Solution (5 Minutes)

### 1️⃣ Go to Supabase Dashboard
https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/settings/functions

### 2️⃣ Click "Manage secrets"

### 3️⃣ Add These Three Secrets

**Copy and paste these exactly:**

```
Name: ETH_RPC_URL
Value: https://eth.llamarpc.com
```

```
Name: BNB_RPC_URL
Value: https://bsc-dataseed.binance.org/
```

```
Name: POLYGON_RPC_URL
Value: https://polygon-rpc.com/
```

### 4️⃣ Save and Test

That's it! Your payment verification should now work.

---

## Better RPC URLs (Optional - For Production)

If you want more reliable RPCs:

1. Sign up at https://infura.io (free)
2. Create a project
3. Get your API key
4. Replace the URLs with:

```
ETH_RPC_URL: https://mainnet.infura.io/v3/YOUR_API_KEY
BNB_RPC_URL: https://bsc-dataseed.binance.org/
POLYGON_RPC_URL: https://polygon-mainnet.infura.io/v3/YOUR_API_KEY
```

---

## Verify It's Working

Run this in your terminal:
```bash
curl https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-rpc-config
```

Should return:
```json
{
  "ok": true,
  "message": "All RPC URLs are configured correctly"
}
```

---

**That's it! Problem solved. 🎉**
