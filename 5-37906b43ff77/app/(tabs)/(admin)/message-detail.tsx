
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  user_email: string;
  user_name: string;
}

interface Reply {
  id: string;
  message_id: string;
  user_id: string;
  is_admin: boolean;
  reply_text: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const messageId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (messageId) {
      loadMessageDetails();
    } else {
      Alert.alert('Error', 'No message ID provided');
      router.back();
    }
  }, [messageId]);

  const loadMessageDetails = async () => {
    try {
      setLoading(true);

      // Load message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          users!inner(email, name)
        `)
        .eq('id', messageId)
        .single();

      if (messageError) {
        console.error('Error loading message:', messageError);
        throw messageError;
      }

      if (!messageData) {
        throw new Error('Message not found');
      }

      const mappedMessage: Message = {
        ...messageData,
        user_email: messageData.users.email,
        user_name: messageData.users.name,
      };

      setMessage(mappedMessage);

      // Load replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('message_replies')
        .select(`
          *,
          users:user_id(email, name)
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Error loading replies:', repliesError);
        throw repliesError;
      }

      const mappedReplies = repliesData?.map((r: any) => ({
        ...r,
        user_name: r.users?.name || 'Unknown',
        user_email: r.users?.email || '',
      })) || [];

      setReplies(mappedReplies);
    } catch (error: any) {
      console.error('Error in loadMessageDetails:', error);
      Alert.alert('Error', error.message || 'Failed to load message details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSending(true);

      const { error } = await supabase
        .from('message_replies')
        .insert({
          message_id: messageId,
          user_id: user.id,
          is_admin: true,
          reply_text: replyText.trim(),
        });

      if (error) {
        console.error('Error sending reply:', error);
        throw error;
      }

      setReplyText('');
      await loadMessageDetails();
      Alert.alert('Success', 'Reply sent successfully');
    } catch (error: any) {
      console.error('Error in handleSendReply:', error);
      Alert.alert('Error', error.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);

      const { error } = await supabase
        .from('messages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }

      await loadMessageDetails();
      Alert.alert('Success', `Status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error in handleUpdateStatus:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'kyc': return 'person.badge.shield.checkmark';
      case 'withdrawal': return 'arrow.down.circle';
      case 'transaction': return 'dollarsign.circle';
      case 'technical': return 'wrench.and.screwdriver';
      default: return 'envelope';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'normal': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.warning;
      case 'in_progress': return colors.primary;
      case 'resolved': return colors.success;
      case 'closed': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading message...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!message) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Message not found</Text>
          <TouchableOpacity style={buttonStyles.primary} onPress={() => router.back()}>
            <Text style={buttonStyles.primaryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Message Details</Text>
          </View>
        </View>

        {/* Message Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Message Header */}
          <View style={[commonStyles.card, styles.messageCard]}>
            <View style={styles.messageHeader}>
              <IconSymbol 
                name={getCategoryIcon(message.category)} 
                size={32} 
                color={getPriorityColor(message.priority)} 
              />
              <View style={styles.messageHeaderInfo}>
                <Text style={styles.messageSubject}>{message.subject}</Text>
                <Text style={styles.messageUser}>
                  From: {message.user_name} ({message.user_email})
                </Text>
                <Text style={styles.messageDate}>
                  {new Date(message.created_at).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Priority and Status Badges */}
            <View style={styles.badgesContainer}>
              <View style={[styles.badge, { backgroundColor: getPriorityColor(message.priority) + '20' }]}>
                <Text style={[styles.badgeText, { color: getPriorityColor(message.priority) }]}>
                  {message.priority.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(message.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(message.status) }]}>
                  {message.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {message.category.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Message Body */}
            <View style={styles.messageBody}>
              <Text style={styles.messageText}>{message.message}</Text>
            </View>

            {/* Status Actions */}
            <View style={styles.statusActions}>
              <Text style={styles.statusActionsTitle}>Update Status:</Text>
              <View style={styles.statusButtons}>
                {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      message.status === status && styles.statusButtonActive,
                      { borderColor: getStatusColor(status) }
                    ]}
                    onPress={() => handleUpdateStatus(status)}
                    disabled={updatingStatus || message.status === status}
                  >
                    <Text 
                      style={[
                        styles.statusButtonText,
                        message.status === status && { color: '#fff' }
                      ]}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Replies Section */}
          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>
              Replies ({replies.length})
            </Text>

            {replies.length === 0 ? (
              <View style={styles.noReplies}>
                <IconSymbol name="bubble.left" size={48} color={colors.textSecondary} />
                <Text style={styles.noRepliesText}>No replies yet</Text>
              </View>
            ) : (
              replies.map((reply) => (
                <View 
                  key={reply.id} 
                  style={[
                    commonStyles.card, 
                    styles.replyCard,
                    reply.is_admin && styles.adminReplyCard
                  ]}
                >
                  <View style={styles.replyHeader}>
                    <View style={styles.replyUserInfo}>
                      <IconSymbol 
                        name={reply.is_admin ? 'person.badge.shield.checkmark' : 'person.circle'} 
                        size={20} 
                        color={reply.is_admin ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={styles.replyUserName}>
                        {reply.is_admin ? 'Admin' : reply.user_name}
                      </Text>
                    </View>
                    <Text style={styles.replyDate}>
                      {new Date(reply.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.replyText}>{reply.reply_text}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Reply Input */}
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            placeholderTextColor={colors.textSecondary}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!replyText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="paperplane.fill" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  messageCard: {
    marginBottom: 24,
  },
  messageHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  messageHeaderInfo: {
    flex: 1,
  },
  messageSubject: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  messageUser: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageBody: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  statusActions: {
    marginTop: 8,
  },
  statusActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  repliesSection: {
    marginTop: 8,
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  noReplies: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  noRepliesText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  replyCard: {
    marginBottom: 12,
  },
  adminReplyCard: {
    backgroundColor: colors.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  replyDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  replyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  replyInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
});
