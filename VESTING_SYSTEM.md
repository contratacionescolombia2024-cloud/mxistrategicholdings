
# MXI Vesting/Mining System

## Overview
The Maxcoin (MXI) platform includes an automatic vesting/mining system that generates passive yield for all active contributors. This system rewards users for their investment with a continuous stream of MXI tokens.

## How It Works

### Yield Generation
- **Rate**: 0.005% per hour of your total USDT investment
- **Calculation**: 
  - Per hour: `investment × 0.00005`
  - Per minute: `investment × 0.00000083333`
  - Per day: `investment × 0.0012` (0.12% daily)
- **Automatic**: Yield accumulates automatically every second once you make a contribution
- **Real-time tracking**: View your accumulated yield in real-time on the home screen

### Example Calculations

| Investment | Hourly Yield | Daily Yield | Monthly Yield (30 days) |
|-----------|--------------|-------------|------------------------|
| $100 USDT | 0.005 MXI | 0.12 MXI | 3.6 MXI |
| $1,000 USDT | 0.05 MXI | 1.2 MXI | 36 MXI |
| $10,000 USDT | 0.5 MXI | 12 MXI | 360 MXI |
| $100,000 USDT | 5 MXI | 120 MXI | 3,600 MXI |

## Withdrawal Requirements

To claim your mined MXI and transfer it to your balance, you must meet the **same requirements as referral commission withdrawals**:

1. **5 Active Referrals**: You need at least 5 level 1 referrals who have made their initial contribution
2. **10-Day Membership**: You must have been a member for at least 10 days since registration
3. **KYC Verification**: Your identity must be verified and approved through the KYC process

### Why These Requirements?

These requirements ensure:
- Fair distribution of rewards
- Prevention of abuse and fraud
- Compliance with regulatory standards
- Sustainable growth of the platform

## How to Claim Your Yield

1. **Check Your Accumulated Yield**: View your current yield on the home screen in the "MXI Mining Active" card
2. **Meet Requirements**: Ensure you have 5 active referrals, 10 days membership, and KYC approval
3. **Click "Claim Yield"**: Press the claim button in the yield display card
4. **Instant Transfer**: Your mined MXI is immediately added to your MXI balance

## Reinvestment Option

You can reinvest your accumulated yield to increase your mining rate:

1. Navigate to the "Buy MXI" screen
2. Scroll to the "Reinvest Mined MXI" section
3. Click "Reinvest Yield" to convert your mined MXI back into your investment
4. Your mining rate will automatically increase based on the new total investment

**Note**: Minimum reinvestment is equivalent to $20 USDT at current MXI price.

## Technical Implementation

### Database Structure
- `yield_rate_per_minute`: Stores the user's yield rate (calculated automatically)
- `last_yield_update`: Timestamp of last yield calculation
- `accumulated_yield`: Total MXI mined but not yet claimed

### Automatic Updates
- Yield rate is automatically calculated when you make a contribution
- The system uses database triggers to ensure accurate calculations
- Real-time display updates every second in the app

### Security
- All yield calculations are performed server-side
- Withdrawal eligibility is verified before allowing claims
- KYC verification ensures compliance and security

## Important Notes

- Yield accumulates continuously, even when you're not using the app
- You can accumulate yield indefinitely before claiming
- Claiming yield does not reset your mining rate
- Your mining rate increases with each additional contribution
- The 0.005% hourly rate applies to your total investment amount

## Support

If you have questions about the vesting system:
1. Visit the Support section in the app
2. Select "General" or "Transaction" category
3. Submit your question with details

---

**Last Updated**: January 2025
**Version**: 1.0
