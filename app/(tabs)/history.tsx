import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Poll } from '@/types/database';
import { PollCard } from '@/components/PollCard';
import { ErrorView } from '@/components/ErrorView';

export default function History() {
  const router = useRouter();
  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [activeSection, setActiveSection] = useState<'created' | 'voted'>(
    'created'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolls = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      }: any = await supabase.auth.getUser();
      if (userError || !user)
        throw userError('Failed to fetch user information.');

      const { data: createdData, error: createdError } = await supabase
        .from('polls')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      const { data: votedData, error: votedError } = await supabase
        .from('votes')
        .select('polls(*)') // Join with polls table
        .eq('user_id', user.id);

      if (votedError) throw votedError;

      const votedPolls = votedData.map((vote: any) => vote.polls);

      setCreatedPolls(createdData);
      setVotedPolls(votedPolls);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load polls. Please try again.');
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
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setActiveSection('created')}>
          <Text
            style={[
              styles.navText,
              activeSection === 'created' && styles.activeNavText,
            ]}
          >
            My Polls
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveSection('voted')}>
          <Text
            style={[
              styles.navText,
              activeSection === 'voted' && styles.activeNavText,
            ]}
          >
            Voted Polls
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'created' ? (
        <FlashList
          data={createdPolls}
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
              <Text style={styles.emptyText}>No recent polls found</Text>
            </View>
          }
        />
      ) : (
        <FlashList
          data={votedPolls}
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
              <Text style={styles.emptyText}>No recent votes found</Text>
            </View>
          }
        />
      )}
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
  navbar: {
    justifyContent: 'space-around',
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    shadowColor: '#000',
  },
  navText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#71717a',
  },
  activeNavText: {
    color: '#0891b2',
    textDecorationLine: 'underline',
  },
});
