import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Poll, PollOption, Vote } from '@/types/database';
import { ErrorView } from '@/components/ErrorView';
import { formatDistanceToNow } from 'date-fns';

export default function PollScreen() {
  const { id } = useLocalSearchParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<Vote | null>(null);

  useEffect(() => {
    fetchPollData();

    // Subscribe to real-time updates for options
    const subscription = supabase
      .channel('poll_options')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'poll_options', filter: `poll_id=eq.${id}` },
        (payload) => {
          if (payload.new) {
            setOptions(current => 
              current.map(option =>
                option.id === payload.new.id ? payload.new : option
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const fetchPollData = async () => {
    try {
      const [pollResult, optionsResult, voteResult] = await Promise.all([
        supabase.from('polls').select('*').eq('id', id).single(),
        supabase.from('poll_options').select('*').eq('poll_id', id),
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return null;
          return supabase
            .from('votes')
            .select('*')
            .eq('poll_id', id)
            .eq('user_id', user.id)
            .single();
        }),
      ]);

      if (pollResult.error) throw pollResult.error;
      if (optionsResult.error) throw optionsResult.error;

      setPoll(pollResult.data);
      setOptions(optionsResult.data);
      if (voteResult?.data) {
        setUserVote(voteResult.data);
        setSelectedOption(voteResult.data.option_id);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load poll data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) return;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to vote');
        return;
      }

      const { error: voteError } = await supabase.from('votes').insert({
        poll_id: id,
        option_id: selectedOption,
        user_id: user.id,
      });

      if (voteError) throw voteError;

      setUserVote({
        id: 'temp',
        poll_id: id as string,
        option_id: selectedOption,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Your vote has been recorded');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error || !poll) {
    return <ErrorView message={error || 'Poll not found'} onRetry={fetchPollData} />;
  }

  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
  const isPollEnded = new Date(poll.ends_at) < new Date();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{poll.title}</Text>
        <Text style={styles.timeRemaining}>
          {isPollEnded ? 'Poll ended' : `Ends ${formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}`}
        </Text>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      <View style={styles.options}>
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOption === option.id;
          const isDisabled = !!userVote || isPollEnded;

          return (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                isSelected && styles.selectedOption,
                isDisabled && styles.disabledOption,
              ]}
              onPress={() => !isDisabled && setSelectedOption(option.id)}
              disabled={isDisabled}>
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}>
                  {option.text}
                </Text>
                <Text style={styles.voteCount}>
                  {option.votes} {option.votes === 1 ? 'vote' : 'votes'} ({percentage.toFixed(1)}%)
                </Text>
              </View>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${percentage}%` },
                  isSelected && styles.selectedProgressBar,
                ]} 
              />
            </Pressable>
          );
        })}
      </View>

      {!userVote && !isPollEnded && (
        <Pressable
          style={[
            styles.submitButton,
            (!selectedOption || submitting) && styles.disabledButton,
          ]}
          onPress={handleVote}
          disabled={!selectedOption || submitting}>
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Vote</Text>
          )}
        </Pressable>
      )}

      <Text style={styles.totalVotes}>
        Total votes: {totalVotes}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: 14,
    color: '#71717a',
  },
  question: {
    fontSize: 18,
    color: '#3f3f46',
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedOption: {
    backgroundColor: '#e0f2fe',
  },
  disabledOption: {
    opacity: 0.8,
  },
  optionContent: {
    zIndex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#18181b',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#0891b2',
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 14,
    color: '#71717a',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#f0f9ff',
    zIndex: 0,
  },
  selectedProgressBar: {
    backgroundColor: '#e0f2fe',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  totalVotes: {
    textAlign: 'center',
    marginTop: 16,
    color: '#71717a',
  },
});