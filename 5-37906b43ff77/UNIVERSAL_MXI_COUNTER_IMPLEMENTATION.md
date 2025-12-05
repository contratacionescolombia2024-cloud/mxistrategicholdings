
# Universal MXI Counter Implementation

## Overview
This document describes the implementation of the Universal MXI Counter for the admin dashboard, which provides real-time tracking of MXI token distribution across different sources.

## Features Implemented

### 1. **Database Schema**
Created a new table `presale_allocation` to store configurable presale allocation settings:
- `total_presale_allocation`: Total MXI tokens allocated for presale (default: 25,000,000)
- `phase_1_allocation`: MXI tokens allocated for Phase 1 (default: 8,333,333)
- `phase_2_allocation`: MXI tokens allocated for Phase 2 (default: 8,333,333)
- `phase_3_allocation`: MXI tokens allocated for Phase 3 (default: 8,333,334)
- Row Level Security (RLS) policies for admin-only access

### 2. **Universal MXI Counter Component**
Created `components/UniversalMXICounter.tsx` with the following features:

#### **Total Presale Allocation Display**
- Shows total MXI allocated for presale
- Progress bar showing percentage sold
- Editable by admin users

#### **Phase Distribution**
Displays for each phase (1, 2, 3):
- Total allocated tokens
- Tokens sold
- Tokens remaining
- Progress bar with phase-specific colors
- Phase prices (Phase 1: $0.40, Phase 2: $0.60, Phase 3: $0.80)

#### **MXI Distribution by Source**
Four key metrics displayed in a grid:

1. **MXI Entregados (Delivered)**
   - Total MXI tokens in user balances
   - Source: `users.mxi_balance`

2. **Producidos en Vesting (Vesting Produced)**
   - Real-time vesting/yield production
   - Source: `users.mxi_vesting_locked`
   - Updates automatically

3. **Por Comisiones (From Commissions)**
   - MXI from unified referral commissions
   - Source: `users.mxi_from_unified_commissions`

4. **Por Retos (From Challenges)**
   - MXI won from challenges/lottery
   - Source: `users.mxi_from_challenges`

### 3. **Real-time Updates**
The counter subscribes to database changes and updates automatically when:
- User balances change
- Metrics are updated
- Presale allocation is modified

### 4. **Admin Functionality**
Admins can:
- View all distribution metrics
- Edit total presale allocation
- Automatic redistribution across 3 phases when allocation changes
- Confirmation modal with warnings before saving

### 5. **Integration with Admin Dashboard**
The Universal MXI Counter is prominently displayed at the top of the admin dashboard (`app/(tabs)/(admin)/index.tsx`), providing immediate visibility of key metrics.

## Data Sources

### User MXI Distribution
```sql
SELECT 
  SUM(mxi_purchased_directly) as total_purchased,
  SUM(mxi_from_unified_commissions) as total_from_commissions,
  SUM(mxi_from_challenges) as total_from_challenges,
  SUM(mxi_vesting_locked) as total_vesting,
  SUM(mxi_balance) as total_mxi_balance
FROM users;
```

### Phase Metrics
```sql
SELECT 
  phase_1_tokens_sold,
  phase_2_tokens_sold,
  phase_3_tokens_sold,
  total_tokens_sold,
  current_phase,
  current_price_usdt
FROM metrics;
```

### Presale Allocation
```sql
SELECT 
  total_presale_allocation,
  phase_1_allocation,
  phase_2_allocation,
  phase_3_allocation
FROM presale_allocation
ORDER BY created_at DESC
LIMIT 1;
```

## Usage

### For Admins
1. Navigate to Admin Dashboard
2. View the Universal MXI Counter at the top
3. Click the edit button (pencil icon) to modify presale allocation
4. Enter new total allocation
5. Confirm changes (phases will be automatically redistributed equally)

### Calculations
- **Phase Remaining** = Phase Allocation - Phase Sold
- **Total Remaining** = Sum of all phase remainings
- **Percentage Sold** = (Tokens Sold / Total Allocation) × 100

## Security
- Only admin users can view the counter
- Only admin users can edit presale allocation
- RLS policies enforce access control
- All changes are logged with admin user ID and timestamp

## Real-time Features
The counter updates automatically when:
- New purchases are made
- Vesting/yield is generated
- Commissions are earned
- Challenge rewards are distributed
- Admin modifies allocation settings

## Visual Design
- Clean, card-based layout
- Color-coded metrics:
  - Primary blue: Delivered MXI
  - Green: Vesting production
  - Orange: Commissions
  - Red: Challenges
- Progress bars for visual representation
- Responsive grid layout for mobile devices

## Future Enhancements
Potential improvements:
- Historical tracking of allocation changes
- Export functionality for reports
- Detailed breakdown by user
- Predictive analytics for phase completion
- Alerts when phases are near completion
