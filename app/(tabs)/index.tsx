import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Poll } from '@/types/database';
import { PollCard } from '@/components/PollCard';
import { ErrorView } from '@/components/ErrorView';

export default function ActivePolls() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolls = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('polls')
        .select('*')
        .gt('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPolls(data);
      setError(null);
    } catch (err) {
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPolls();
  }, []);

  useEffect(() => {
    fetchPolls();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, 
        (payload) => {
          if (payload.new) {
            setPolls(current => {
              const exists = current.find(poll => poll.id === payload.new.id);
              if (exists) {
                return current.map(poll => 
                  poll.id === payload.new.id ? payload.new : poll
                );
              }
              return [payload.new, ...current];
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchPolls} />;
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={polls}
        renderItem={({ item }) => (
          <PollCard
            poll={item}
            onPress={() => router.push(`/poll/${item.id}`)}
          />
        )}
        estimatedItemSize={150}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No active polls found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#71717a',
  },
});