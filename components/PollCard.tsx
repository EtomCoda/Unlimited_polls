import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Poll } from '@/types/database';
import { Timer } from 'lucide-react-native';

interface PollCardProps {
  poll: Poll;
  onPress: () => void;
}

export function PollCard({ poll, onPress }: PollCardProps) {
  const timeRemaining = formatDistanceToNow(new Date(poll.ends_at), {
    addSuffix: true,
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{poll.title}</Text>
        <View style={styles.timeContainer}>
          <Timer size={16} color="#71717a" />
          <Text style={styles.timeText}>Ends {timeRemaining}</Text>
        </View>
      </View>
      <Text style={styles.question}>{poll.question}</Text>
      <View style={styles.footer}>
        <Text style={styles.votes}>
          {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#71717a',
    marginLeft: 4,
  },
  question: {
    fontSize: 16,
    color: '#3f3f46',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  votes: {
    fontSize: 14,
    color: '#71717a',
  },
});