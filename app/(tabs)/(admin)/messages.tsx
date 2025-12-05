
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

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

export default function AdminMessagesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('messages')
        .select(`
          *,
          users!inner(email, name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'open') {
        query = query.in('status', ['open', 'in_progress']);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped = data?.map((m: any) => ({
        ...m,
        user_email: m.users.email,
        user_name: m.users.name,
      })) || [];

      setMessages(mapped);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>User Messages</Text>
          <Text style={styles.subtitle}>{messages.length} message(s)</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'open' && styles.filterButtonActive]}
          onPress={() => setFilter('open')}
        >
          <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
            Open
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="envelope.open" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No messages to display</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              style={[commonStyles.card, styles.messageCard]}
              onPress={() => router.push(`/(tabs)/(admin)/message-detail?id=${message.id}`)}
            >
              <View style={styles.messageHeader}>
                <IconSymbol 
                  name={getCategoryIcon(message.category)} 
                  size={24} 
                  color={getPriorityColor(message.priority)} 
                />
                <View style={styles.messageInfo}>
                  <Text style={styles.messageSubject}>{message.subject}</Text>
                  <Text style={styles.messageUser}>{message.user_name} • {message.user_email}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(message.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(message.priority) }]}>
                    {message.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.messagePreview} numberOfLines={2}>
                {message.message}
              </Text>
              <View style={styles.messageFooter}>
                <View style={[styles.statusBadge, styles[`status${message.status.replace('_', '')}`]]}>
                  <Text style={styles.statusText}>{message.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.messageDate}>
                  {new Date(message.created_at).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
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
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  messageCard: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  messageUser: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  messagePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusopen: {
    backgroundColor: colors.warning + '20',
  },
  statusinprogress: {
    backgroundColor: colors.primary + '20',
  },
  statusresolved: {
    backgroundColor: colors.success + '20',
  },
  statusclosed: {
    backgroundColor: colors.textSecondary + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  messageDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
