
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get push token for push notifications (optional)
      if (Platform.OS !== 'web') {
        try {
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          this.expoPushToken = token;
          console.log('Expo Push Token:', token);
        } catch (error) {
          console.log('Error getting push token:', error);
        }
      }

      // Set up notification listeners
      this.setupListeners();

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigate to specific screen
        console.log('Navigate to:', data.screen);
      }
    });
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(config: NotificationConfig) {
    try {
      // For web, use browser Alert API
      if (Platform.OS === 'web') {
        // Use a custom alert that works on web
        this.showWebNotification(config);
        return;
      }

      // For native platforms, use expo-notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Show notification on web using Alert
   */
  private showWebNotification(config: NotificationConfig) {
    // For web, we'll use a simple alert
    // In a production app, you might want to use a toast library or custom modal
    if (typeof window !== 'undefined') {
      // Use browser notification API if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(config.title, {
          body: config.body,
          icon: '/icon.png', // Add your app icon path
        });
      } else {
        // Fallback to alert
        Alert.alert(config.title, config.body);
      }
    }
  }

  /**
   * Request web notification permissions
   */
  async requestWebNotificationPermission() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }

  /**
   * Notify about balance change
   */
  async notifyBalanceChange(oldBalance: number, newBalance: number, source: string) {
    const change = newBalance - oldBalance;
    const changeText = change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    
    await this.sendLocalNotification({
      title: '💰 Balance Updated',
      body: `Your MXI balance changed by ${changeText} MXI from ${source}`,
      data: {
        type: 'balance_change',
        oldBalance,
        newBalance,
        source,
      },
    });
  }

  /**
   * Notify about new message
   */
  async notifyNewMessage(from: string, preview: string) {
    await this.sendLocalNotification({
      title: `📨 New Message from ${from}`,
      body: preview,
      data: {
        type: 'new_message',
        from,
      },
    });
  }

  /**
   * Notify about payment confirmation
   */
  async notifyPaymentConfirmed(amount: number, mxiAmount: number) {
    await this.sendLocalNotification({
      title: '✅ Payment Confirmed',
      body: `Your payment of ${amount} USDT has been confirmed. You received ${mxiAmount.toFixed(2)} MXI.`,
      data: {
        type: 'payment_confirmed',
        amount,
        mxiAmount,
      },
    });
  }

  /**
   * Notify about withdrawal approval
   */
  async notifyWithdrawalApproved(amount: number, currency: string) {
    await this.sendLocalNotification({
      title: '✅ Withdrawal Approved',
      body: `Your withdrawal of ${amount} ${currency} has been approved and is being processed.`,
      data: {
        type: 'withdrawal_approved',
        amount,
        currency,
      },
    });
  }

  /**
   * Notify about KYC status change
   */
  async notifyKYCStatusChange(status: string) {
    const statusEmoji = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
    const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
    
    await this.sendLocalNotification({
      title: `${statusEmoji} KYC ${statusText}`,
      body: `Your KYC verification status has been updated to: ${statusText}`,
      data: {
        type: 'kyc_status',
        status,
      },
    });
  }

  /**
   * Notify about referral commission
   */
  async notifyReferralCommission(amount: number, level: number, referralName: string) {
    await this.sendLocalNotification({
      title: '💵 New Commission Earned',
      body: `You earned ${amount.toFixed(2)} MXI commission from ${referralName} (Level ${level})`,
      data: {
        type: 'referral_commission',
        amount,
        level,
      },
    });
  }

  /**
   * Notify about vesting milestone
   */
  async notifyVestingMilestone(totalVested: number) {
    await this.sendLocalNotification({
      title: '🔒 Vesting Milestone',
      body: `You've accumulated ${totalVested.toFixed(2)} MXI through vesting!`,
      data: {
        type: 'vesting_milestone',
        totalVested,
      },
    });
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Subscribe to real-time balance changes
   */
  subscribeToBalanceChanges(userId: string, onBalanceChange: (oldBalance: number, newBalance: number) => void) {
    const channel = supabase
      .channel(`balance-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          const oldBalance = payload.old?.mxi_balance || 0;
          const newBalance = payload.new?.mxi_balance || 0;
          
          if (oldBalance !== newBalance) {
            onBalanceChange(oldBalance, newBalance);
            
            // Determine source of change
            let source = 'Unknown';
            if (payload.new?.mxi_purchased_directly !== payload.old?.mxi_purchased_directly) {
              source = 'Purchase';
            } else if (payload.new?.mxi_from_unified_commissions !== payload.old?.mxi_from_unified_commissions) {
              source = 'Commission';
            } else if (payload.new?.mxi_from_challenges !== payload.old?.mxi_from_challenges) {
              source = 'Tournament';
            } else if (payload.new?.accumulated_yield !== payload.old?.accumulated_yield) {
              source = 'Vesting';
            }
            
            this.notifyBalanceChange(oldBalance, newBalance, source);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to support messages
   */
  subscribeToMessages(userId: string, onNewMessage: (message: any) => void) {
    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          onNewMessage(payload.new);
          
          // Only notify if message is from admin
          if (payload.new?.is_admin_message) {
            this.notifyNewMessage('Support Team', payload.new?.message || 'You have a new message');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
