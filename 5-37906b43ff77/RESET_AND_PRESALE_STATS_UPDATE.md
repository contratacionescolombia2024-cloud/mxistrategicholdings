
# Reset System and Presale Statistics Update

## Summary of Changes

This update implements the requested changes to the "Reiniciar Todo" (Reset All) functionality and the "Estadísticas de Preventa" (Presale Statistics) card in the admin panel.

## 1. Reset Functionality Updates

### What Gets Reset to 0:
- ✅ All MXI balances (`mxi_balance`)
- ✅ All USDT contributions (`usdt_contributed`)
- ✅ All MXI purchased directly (`mxi_purchased_directly`)
- ✅ All MXI from commissions (`mxi_from_unified_commissions`)
- ✅ All MXI from challenges (`mxi_from_challenges`)
- ✅ All MXI in vesting (`mxi_vesting_locked`)
- ✅ All active referrals counters (`active_referrals`)
- ✅ All yield generation data (`yield_rate_per_minute`, `accumulated_yield`)
- ✅ All commissions records (deleted)
- ✅ All contributions records (deleted)
- ✅ All withdrawals records (deleted)
- ✅ All challenge history (deleted)
- ✅ All lottery tickets (deleted)
- ✅ All game sessions and results (deleted)
- ✅ All NOWPayments orders (deleted)
- ✅ All MXI withdrawal schedules (deleted)

### Presale Metrics Reset:
- ✅ `total_tokens_sold` → 0
- ✅ `phase_1_tokens_sold` → 0
- ✅ `phase_2_tokens_sold` → 0
- ✅ `phase_3_tokens_sold` → 0
- ✅ `total_usdt_contributed` → 0
- ✅ `total_mxi_distributed` → 0
- ✅ `current_phase` → 1
- ✅ `current_price_usdt` → 0.40
- ✅ `total_members` → 56527 (initial value)

### What Gets PRESERVED:
- ✅ **Referral relationships** (`referrals` table NOT deleted)
- ✅ **Referrer assignments** (`referred_by` field NOT reset)
- ✅ User accounts and authentication
- ✅ KYC verifications
- ✅ Admin users

## 2. Presale Statistics Card Updates

### Removed:
- ❌ "Referidos Activos" counter (as requested)

### Added - Vesting Metrics Section:
1. **MXI Bloqueado** - Total MXI locked in vesting
2. **MXI Liberado** - Total MXI released from vesting
3. **MXI Pendiente** - Total MXI pending release
4. **Participantes Vesting** - Number of users with vesting
5. **Promedio Vesting/Usuario** - Average vesting per user
6. **Yield Total Generado** - Total yield generated
7. **Generadores Activos** - Active yield generators
8. **% Liberado** - Percentage of vesting released

### Enhanced Presale Card Features:
- Shows real MXI sold (calculated from actual user purchases)
- Displays current phase and price
- Shows progress percentage with 4 decimal precision
- Displays total USDT raised
- Shows presale end date and time
- Progress bar visualization

### Phase Details Cards:
Each phase (1, 2, 3) now shows:
- Phase number and active status badge
- Price per MXI in that phase
- Start and end dates
- MXI sold in that phase
- Phase goal (8,333,333 MXI per phase)
- Progress bar with percentage (4 decimal precision)
- Visual highlighting for the active phase

### Summary Card:
Comprehensive overview including:
- Total USDT raised
- Total MXI sold (real data)
- Presale progress percentage
- Commissions paid
- Current phase and price
- MXI in vesting
- Yield generated

## 3. Database Migration

### Migration: `update_admin_reset_function_preserve_referrals`

Updated the `admin_reset_all_users` function to:
- Reset all user balances and counters to 0
- Delete all transactional data
- **Preserve referral relationships** (referrals table and referred_by field)
- Reset metrics to initial state with all counters at 0
- Return success message confirming referral preservation

## 4. User Interface Updates

### Admin Dashboard Modal:
- Clear warning about what will be deleted
- Green checkmark showing referrals will be preserved
- Confirmation input requiring "RESETEAR" text
- Disabled state while processing
- Success/error alerts with detailed messages

### Metrics Dashboard:
- New vesting metrics section with 8 key indicators
- Enhanced presale statistics with phase breakdowns
- Real-time data from actual user purchases
- Improved visual hierarchy and organization
- Better date formatting (Spanish locale)
- More precise percentage calculations (4 decimals)

## 5. Technical Implementation

### Files Modified:
1. **Database Migration**: Created new migration to update reset function
2. **components/AdminMetricsDashboard.tsx**: 
   - Added vesting metrics section
   - Removed "referidos activos" counter
   - Enhanced presale statistics card
   - Added phase detail cards with dates
3. **app/(tabs)/(admin)/index.tsx**:
   - Updated reset modal with clearer warnings
   - Added preservation notice for referrals
   - Improved confirmation flow

### Key Features:
- All MXI calculations use real data from users table
- Phase dates calculated dynamically based on presale end date
- Current phase determined by comparing current date with phase dates
- Vesting data pulled from both users and mxi_withdrawal_schedule tables
- Yield metrics show active generators and total accumulated

## 6. Testing Recommendations

Before using in production:
1. Test reset function in development environment
2. Verify referral relationships are preserved after reset
3. Confirm all counters return to 0
4. Check that metrics dashboard shows accurate data
5. Verify phase calculations are correct
6. Test with different user scenarios

## 7. Usage Instructions

### To Reset the System:
1. Go to Admin Dashboard
2. Scroll to "ZONA DE PELIGRO" section
3. Click "Reiniciar Todo" button
4. Read all warnings carefully
5. Note that referrals WILL BE PRESERVED
6. Type "RESETEAR" in the confirmation field
7. Click "Confirmar Reset"
8. Wait for success confirmation

### To View Enhanced Metrics:
1. Go to Admin Dashboard
2. Scroll to "Métricas de la Aplicación" section
3. View new vesting metrics section
4. Check enhanced presale statistics
5. Review phase details with dates
6. Pull down to refresh data

## 8. Important Notes

- ⚠️ The reset action is IRREVERSIBLE
- ✅ Referral relationships are ALWAYS preserved
- 📊 All metrics now show REAL data from the database
- 🔄 The system automatically calculates phase dates
- 💰 MXI sold is calculated from actual user purchases
- 🔒 Vesting metrics provide comprehensive tracking
- 📅 Phase dates are divided equally across presale period

## 9. Future Enhancements

Potential improvements for future versions:
- Add export functionality for metrics
- Implement scheduled resets
- Add rollback capability
- Create backup before reset
- Add more granular reset options
- Implement audit logging for resets
