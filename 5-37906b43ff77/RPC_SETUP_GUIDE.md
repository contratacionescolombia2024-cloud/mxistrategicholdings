
# 🔧 RPC Configuration Setup Guide

## Problem

The error `Cannot read properties of undefined (reading 'ETH_RPC_URL')` occurs because the blockchain RPC URL environment variables are not configured in your Supabase Edge Functions.

## What are RPC URLs?

RPC (Remote Procedure Call) URLs are endpoints that allow your application to communicate with blockchain networks. Each blockchain network (Ethereum, BNB Chain, Polygon) requires its own RPC endpoint to:

- Read transaction data
- Verify payments
- Check confirmations
- Validate smart contract interactions

## Required Environment Variables

You need to configure **three** environment variables in Supabase:

1. **ETH_RPC_URL** - For Ethereum network
2. **BNB_RPC_URL** - For BNB Chain network
3. **POLYGON_RPC_URL** - For Polygon network

---

## 📋 Step-by-Step Setup

### Step 1: Choose Your RPC Providers

#### Option A: Free Public RPCs (Quick Start)

**Ethereum:**
```
https://eth.llamarpc.com
```

**BNB Chain:**
```
https://bsc-dataseed.binance.org/
```

**Polygon:**
```
https://polygon-rpc.com/
```

⚠️ **Note:** Public RPCs may have rate limits and lower reliability. Good for testing.

#### Option B: Professional RPCs (Recommended for Production)

**Infura (Recommended)**
1. Go to https://infura.io
2. Sign up for a free account
3. Create a new project
4. Get your API key
5. Your URLs will be:
   - Ethereum: `https://mainnet.infura.io/v3/YOUR_API_KEY`
   - Polygon: `https://polygon-mainnet.infura.io/v3/YOUR_API_KEY`

**Alchemy (Alternative)**
1. Go to https://alchemy.com
2. Sign up for a free account
3. Create a new app
4. Get your API key
5. Your URLs will be:
   - Ethereum: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
   - Polygon: `https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

**BNB Chain:**
- Use Binance's free public RPC: `https://bsc-dataseed.binance.org/`

---

### Step 2: Configure in Supabase

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn

2. **Navigate to Edge Functions Settings**
   - Click on **Settings** (left sidebar)
   - Click on **Edge Functions**
   - Or go directly to: https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/settings/functions

3. **Add Secrets**
   - Click on **"Manage secrets"** or **"Add secret"** button
   - Add each of the three secrets:

   **Secret 1:**
   ```
   Name: ETH_RPC_URL
   Value: https://eth.llamarpc.com
   (or your Infura/Alchemy URL)
   ```

   **Secret 2:**
   ```
   Name: BNB_RPC_URL
   Value: https://bsc-dataseed.binance.org/
   ```

   **Secret 3:**
   ```
   Name: POLYGON_RPC_URL
   Value: https://polygon-rpc.com/
   ```

4. **Save Each Secret**
   - Click **"Add secret"** or **"Save"** for each one

---

### Step 3: Verify Configuration

After adding the secrets, test the configuration:

1. **Open your app**
2. **Go to the payment verification page**
3. **Click the "Test Configuration" button** (if available)
4. **Or try verifying a transaction**

The system will now be able to connect to the blockchain networks.

---

## 🔍 Testing Your Setup

### Quick Test

You can test if the RPC URLs are working by calling the test endpoint:

```bash
curl https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-rpc-config
```

Expected response when configured:
```json
{
  "ok": true,
  "message": "All RPC URLs are configured correctly",
  "config": {
    "ETH_RPC_URL": {
      "configured": true,
      "status": "✅ Configured"
    },
    "BNB_RPC_URL": {
      "configured": true,
      "status": "✅ Configured"
    },
    "POLYGON_RPC_URL": {
      "configured": true,
      "status": "✅ Configured"
    }
  }
}
```

---

## 🚨 Troubleshooting

### Error: "RPC URL not configured"

**Solution:** Make sure you've added all three environment variables in Supabase Edge Functions settings.

### Error: "RPC connection failed"

**Possible causes:**
1. Invalid RPC URL
2. RPC provider is down
3. Rate limit exceeded (if using free public RPC)

**Solution:** 
- Verify the URL is correct
- Try a different RPC provider
- Use a professional provider (Infura/Alchemy) for better reliability

### Error: "Wrong network"

**Cause:** The RPC URL is pointing to a different network than expected.

**Solution:** 
- Verify you're using the correct RPC URL for each network
- Ethereum RPCs should connect to Chain ID 1
- BNB Chain RPCs should connect to Chain ID 56
- Polygon RPCs should connect to Chain ID 137

---

## 📊 RPC Provider Comparison

| Provider | Free Tier | Reliability | Rate Limits | Setup Difficulty |
|----------|-----------|-------------|-------------|------------------|
| **Infura** | ✅ Yes | ⭐⭐⭐⭐⭐ | 100k req/day | Easy (requires signup) |
| **Alchemy** | ✅ Yes | ⭐⭐⭐⭐⭐ | 300M compute units/month | Easy (requires signup) |
| **LlamaRPC** | ✅ Yes | ⭐⭐⭐ | Unknown | Very Easy (no signup) |
| **Binance Public** | ✅ Yes | ⭐⭐⭐⭐ | Unknown | Very Easy (no signup) |
| **Polygon Public** | ✅ Yes | ⭐⭐⭐ | Unknown | Very Easy (no signup) |

---

## 🎯 Recommended Configuration

### For Development/Testing:
```
ETH_RPC_URL=https://eth.llamarpc.com
BNB_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
```

### For Production:
```
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
BNB_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY
```

---

## 🔐 Security Notes

- **Never commit RPC URLs with API keys to version control**
- **Keep your API keys secret**
- **Use environment variables for all sensitive data**
- **Rotate API keys periodically**
- **Monitor your RPC usage to detect abuse**

---

## 📞 Support

If you continue to experience issues after following this guide:

1. Check the Supabase Edge Function logs
2. Verify all three secrets are saved correctly
3. Try redeploying the Edge Functions
4. Contact the system administrator

---

## ✅ Checklist

Before marking this as complete, ensure:

- [ ] All three RPC URLs are configured in Supabase
- [ ] Test endpoint returns "ok": true
- [ ] Transaction verification works for all three networks
- [ ] No errors in Edge Function logs
- [ ] RPC providers are responding correctly

---

## 🔄 Next Steps

After configuration:

1. Test payment verification on each network
2. Monitor RPC usage and performance
3. Consider upgrading to paid RPC plans if needed
4. Set up monitoring/alerts for RPC failures
5. Document your RPC provider credentials securely

---

**Last Updated:** 2025-01-23
**Status:** Configuration Required
**Priority:** High - Required for payment verification
