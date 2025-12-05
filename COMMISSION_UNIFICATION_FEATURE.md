
# Commission Unification Feature

## Overview
This feature allows users to convert their USDT referral commissions directly into MXI tokens at the current market price, adding them to their main MXI balance without withdrawing to an external wallet.

## Key Features

### 1. Unify Commission to MXI Balance
- **Location**: Referrals screen (`app/(tabs)/(home)/referrals.tsx`)
- **Functionality**: Converts USDT commissions to MXI at current market price
- **Requirements**: No special requirements - available to all users with commission balance
- **Process**:
  1. User enters amount of USDT commissions to convert
  2. System calculates equivalent MXI amount based on current price
  3. User confirms the conversion
  4. USDT commissions are marked as "withdrawn"
  5. MXI is added to user's main balance

### 2. Vesting Percentage Calculation
The vesting percentage is calculated based on **only** the following MXI sources:
- ✅ MXI purchased directly with USDT contributions
- ✅ MXI earned from referral commissions (tracked in `mxi_purchased_directly`)
- ❌ MXI unified from commission balance (tracked separately in `mxi_from_unified_commissions`)

This ensures that users cannot artificially inflate their vesting percentage by converting commissions to MXI.

## Database Schema Changes

### New Fields in `users` Table
```sql
-- Tracks MXI purchased directly or earned from referral commissions
-- This amount counts towards vesting percentage calculation
mxi_purchased_directly NUMERIC DEFAULT 0

-- Tracks MXI added from unified commissions
-- This amount does NOT count towards vesting percentage
mxi_from_unified_commissions NUMERIC DEFAULT 0
```

## Database Functions

### `unify_commission_to_mxi(p_user_id, p_amount)`
Converts USDT commission balance to MXI tokens.

**Parameters:**
- `p_user_id`: User's UUID
- `p_amount`: Amount of USDT to convert

**Returns:**
```json
{
  "success": true,
  "usdt_amount": 100.00,
  "mxi_amount": 333.33,
  "current_price": 0.30
}
```

**Process:**
1. Validates user has sufficient commission balance
2. Gets current MXI price from metrics table
3. Calculates MXI amount: `usdt_amount / current_price`
4. Marks commissions as "withdrawn"
5. Updates user's `mxi_balance` and `mxi_from_unified_commissions`

### Updated `process_referral_commissions()`
Now tracks commission MXI in `mxi_purchased_directly` to ensure it counts towards vesting.

### Updated Yield Calculation Functions
Yield rate is now calculated based on `mxi_purchased_directly` instead of total `mxi_balance`:
- `update_yield_rate_on_contribution()`: Recalculates yield when new contributions are made
- `update_yield_rate_on_commission()`: Recalculates yield when commissions are earned

## User Interface

### Referrals Screen Layout
The withdrawal section now has two options:

#### Option 1: Unify to MXI (💎)
- Input field for USDT amount to convert
- Shows real-time MXI conversion amount
- "Unificar a MXI" button
- Warning: "⚠️ No aumenta el % de vesting"

#### Option 2: Withdraw USDT (💵)
- Input field for USDT amount to withdraw
- Input field for wallet address
- "Retirar USDT" button
- Requires: KYC approved + 5 active referrals + 10 days

### Confirmation Dialog
When unifying commissions, users see:
```
💎 Unificar Comisiones a MXI

¿Deseas convertir 100.00 USDT de tus comisiones a 333.33 MXI?

Precio actual: 0.30 USDT por MXI

⚠️ IMPORTANTE: El MXI unificado desde comisiones NO aumentará 
tu porcentaje de vesting. Solo el MXI comprado directamente y 
las comisiones de referidos cuentan para el vesting.

El MXI unificado se agregará a tu balance principal y estará 
disponible según las reglas de retiro.
```

## Vesting Calculation Example

### Scenario:
- User purchases 1000 MXI directly: `mxi_purchased_directly = 1000`
- User earns 200 MXI from referral commissions: `mxi_purchased_directly = 1200`
- User unifies 300 USDT commissions → 1000 MXI: `mxi_from_unified_commissions = 1000`
- Total MXI balance: `mxi_balance = 2200`

### Vesting Calculation:
- **Vesting base**: 1200 MXI (only `mxi_purchased_directly`)
- **Vesting rate**: 0.005% per hour on USDT value of 1200 MXI
- **Unified MXI**: 1000 MXI (does NOT increase vesting rate)

## Benefits

### For Users:
1. **Flexibility**: Choose between USDT withdrawal or MXI accumulation
2. **No KYC Required**: Unify commissions without KYC approval
3. **Instant**: No waiting period for unification
4. **Market Price**: Get MXI at current market rate

### For Platform:
1. **Reduced Withdrawals**: Less USDT leaving the platform
2. **Increased MXI Holding**: More users holding MXI tokens
3. **Fair Vesting**: Prevents gaming the vesting system
4. **Transparency**: Clear distinction between purchase types

## Security Considerations

1. **Commission Validation**: System validates available commission balance before unification
2. **Price Accuracy**: Uses real-time price from metrics table
3. **Atomic Operations**: Database function ensures all updates happen together
4. **Audit Trail**: All unifications are tracked via commission status changes

## Testing Checklist

- [ ] Verify commission balance is correctly deducted
- [ ] Verify MXI is added to main balance
- [ ] Verify `mxi_from_unified_commissions` is updated
- [ ] Verify `mxi_purchased_directly` is NOT updated
- [ ] Verify vesting rate remains unchanged after unification
- [ ] Verify vesting rate increases with direct purchases
- [ ] Verify vesting rate increases with referral commissions
- [ ] Test with various USDT amounts
- [ ] Test with insufficient commission balance
- [ ] Test price calculation accuracy

## Future Enhancements

1. **Conversion History**: Track all unification transactions
2. **Batch Unification**: Allow users to unify all available commissions at once
3. **Price Alerts**: Notify users of favorable conversion rates
4. **Conversion Limits**: Optional daily/weekly limits for risk management
