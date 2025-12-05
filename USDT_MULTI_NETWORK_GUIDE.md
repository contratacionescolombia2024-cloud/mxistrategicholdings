
# USDT Multi-Network Payment System Guide

## Overview

The MXI Liquidity Pool app now supports USDT payments on **three blockchain networks**:

1. **Ethereum (ERC20)** - The original Ethereum network
2. **BNB Chain (BEP20)** - Binance Smart Chain
3. **Polygon (Matic)** - Polygon network

Users can send USDT from any of these networks to the same recipient address, and the system will automatically verify and credit MXI tokens to their account.

---

## Supported Networks

### 1. Ethereum (ERC20)
- **Network Name**: Ethereum Mainnet
- **Chain ID**: 1
- **USDT Contract**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Decimals**: 6
- **RPC URL**: Configured via `ETH_RPC_URL` environment variable
- **Color**: Blue (#627EEA)

### 2. BNB Chain (BEP20)
- **Network Name**: BNB Smart Chain
- **Chain ID**: 56
- **USDT Contract**: `0x55d398326f99059fF775485246999027B3197955`
- **Decimals**: 18
- **RPC URL**: `https://bsc-dataseed1.binance.org` (default) or `BNB_RPC_URL` env var
- **Color**: Yellow (#F3BA2F)

### 3. Polygon (Matic)
- **Network Name**: Polygon Mainnet
- **Chain ID**: 137
- **USDT Contract**: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- **Decimals**: 6
- **RPC URL**: `https://polygon-rpc.com` (default) or `POLYGON_RPC_URL` env var
- **Color**: Purple (#8247E5)

---

## Recipient Address

**All networks use the same recipient address:**

```
0x68F0d7c607617DA0b1a0dC7b72885E11ddFec623
```

This address can receive USDT on Ethereum, BNB Chain, and Polygon networks.

---

## Payment Flow

### User Steps:

1. **Select Network**: Choose which blockchain network to use (Ethereum, BNB Chain, or Polygon)
2. **Send USDT**: Transfer USDT from any wallet to the recipient address on the selected network
3. **Copy Transaction Hash**: After the transaction is confirmed, copy the transaction hash (txHash)
4. **Verify Payment**: Paste the txHash in the app and click "Verificar Pago"
5. **Receive MXI**: Once verified (3+ confirmations), MXI tokens are automatically credited

### Backend Verification Process:

1. **Network Validation**: Verify the selected network is supported
2. **Transaction Lookup**: Query the blockchain for the transaction receipt
3. **Status Check**: Ensure the transaction was successful (status = 1)
4. **Confirmations**: Verify at least 3 block confirmations
5. **Event Scanning**: Scan transaction logs for USDT Transfer event
6. **Recipient Validation**: Confirm the transfer was sent to the correct address
7. **Amount Validation**: Check that the amount meets the minimum (20 USDT)
8. **MXI Calculation**: Calculate MXI amount (USDT × 2.5)
9. **Database Update**: Record payment and update user balance
10. **Idempotency**: Prevent duplicate processing of the same transaction

---

## Configuration

### Environment Variables

The following environment variables should be configured in Supabase Edge Functions:

```bash
# Required
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (defaults provided)
BNB_RPC_URL=https://bsc-dataseed1.binance.org
POLYGON_RPC_URL=https://polygon-rpc.com
```

### RPC Providers

For production use, consider using dedicated RPC providers:

**Ethereum:**
- Infura: https://infura.io
- Alchemy: https://alchemy.com
- QuickNode: https://quicknode.com

**BNB Chain:**
- Binance: https://bsc-dataseed1.binance.org (free)
- Ankr: https://rpc.ankr.com/bsc
- NodeReal: https://nodereal.io

**Polygon:**
- Polygon: https://polygon-rpc.com (free)
- Alchemy: https://alchemy.com
- Infura: https://infura.io

---

## API Reference

### POST /functions/v1/verificar-tx

Verifies a USDT payment transaction on any supported network.

**Request Body:**
```json
{
  "txHash": "0x...",
  "userId": "uuid",
  "network": "ethereum" | "bnb" | "polygon"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "usdt": 50.0,
  "mxi": 125.0,
  "txHash": "0x...",
  "network": "Ethereum (ERC20)",
  "message": "Pago confirmado en Ethereum (ERC20). Se acreditaron 125.00 MXI a tu cuenta."
}
```

**Error Responses:**

- **Transaction Not Found (404):**
```json
{
  "ok": false,
  "error": "tx_not_found",
  "message": "Transacción no encontrada en la blockchain"
}
```

- **Insufficient Confirmations (202):**
```json
{
  "ok": false,
  "estado": "pocas_confirmaciones",
  "message": "La transacción tiene 1 confirmaciones. Se requieren 3. Por favor intenta más tarde.",
  "confirmations": 1,
  "required": 3
}
```

- **Insufficient Amount (400):**
```json
{
  "ok": false,
  "error": "monto_insuficiente",
  "message": "El monto mínimo es 20 USDT. Recibido: 15.5 USDT",
  "usdt": 15.5,
  "minimum": 20
}
```

- **Already Processed (200):**
```json
{
  "ok": false,
  "estado": "ya_procesado",
  "message": "Esta transacción ya ha sido procesada",
  "usdt": 50.0,
  "mxi": 125.0,
  "txHash": "0x...",
  "network": "ethereum"
}
```

- **Invalid Network (400):**
```json
{
  "ok": false,
  "error": "invalid_network",
  "message": "Red no soportada. Redes válidas: ethereum, bnb, polygon"
}
```

---

## Database Schema

### payments Table

The `payments` table stores all USDT payment transactions:

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  tx_hash TEXT UNIQUE,
  usdt NUMERIC,
  mxi NUMERIC,
  estado TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  pay_currency TEXT, -- 'usdterc20', 'usdtbep20', or 'usdtmatic'
  order_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**pay_currency values:**
- `usdterc20` - Ethereum network
- `usdtbep20` - BNB Chain network
- `usdtmatic` - Polygon network

---

## UI Components

### Network Selection

Users can select their network using a visual card-based interface:

- **Ethereum**: Blue card with "Ξ" icon
- **BNB Chain**: Yellow card with "B" icon
- **Polygon**: Purple card with "P" icon

### Payment History

The payment history screen displays:
- Network badge with color-coded icon
- Transaction amount (USDT → MXI)
- Transaction status
- Transaction hash (copyable)
- Transaction date

---

## Security Considerations

1. **No Private Keys**: The system never asks for or handles private keys
2. **On-Chain Verification**: All transactions are verified directly on the blockchain
3. **Idempotency**: Duplicate transactions are prevented
4. **Minimum Amount**: 20 USDT minimum prevents spam
5. **Confirmations**: 3 block confirmations required for security
6. **Address Validation**: Only transfers to the correct recipient address are accepted

---

## Testing

### Test Networks (Optional)

For testing, you can use testnets:

- **Ethereum Sepolia**: https://sepolia.etherscan.io
- **BNB Testnet**: https://testnet.bscscan.com
- **Polygon Mumbai**: https://mumbai.polygonscan.com

Update the RPC URLs and USDT contract addresses accordingly for testnet testing.

---

## Troubleshooting

### Common Issues:

1. **"Transaction not found"**
   - Verify the transaction hash is correct
   - Ensure you selected the correct network
   - Wait for the transaction to be mined

2. **"Insufficient confirmations"**
   - Wait a few minutes for more block confirmations
   - Try again after 3+ blocks have been mined

3. **"No transfer found"**
   - Verify you sent USDT (not ETH, BNB, or MATIC)
   - Ensure you sent to the correct recipient address
   - Check that you used the correct network

4. **"Amount insufficient"**
   - Minimum payment is 20 USDT
   - Account for network fees when sending

---

## Support

For issues or questions:
- Check the transaction on the blockchain explorer
- Verify network selection matches your transaction
- Contact support with your transaction hash

**Blockchain Explorers:**
- Ethereum: https://etherscan.io
- BNB Chain: https://bscscan.com
- Polygon: https://polygonscan.com

---

## Summary

The multi-network USDT payment system provides:

✅ **Three network options** (Ethereum, BNB Chain, Polygon)  
✅ **Same recipient address** across all networks  
✅ **Automatic verification** via transaction hash  
✅ **Instant MXI crediting** after confirmation  
✅ **Secure on-chain validation**  
✅ **User-friendly network selection**  
✅ **Comprehensive error handling**  

Users can now choose the most convenient and cost-effective network for their USDT payments!
