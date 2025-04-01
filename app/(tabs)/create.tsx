import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { addDays } from 'date-fns';

export default function CreatePoll() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('7');
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A poll must have at least 2 options');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a poll title');
      return;
    }
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a poll question');
      return;
    }
    if (options.some(opt => !opt.trim())) {
      Alert.alert('Error', 'All options must have text');
      return;
    }
    if (new Set(options).size !== options.length) {
      Alert.alert('Error', 'All options must be unique');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a poll');
        return;
      }

      const endsAt = addDays(new Date(), parseInt(duration));

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title,
          question,
          created_by: user.id,
          ends_at: endsAt.toISOString(),
        })
        .select()
        .single();

      if (pollError) throw pollError;

      const optionsToInsert = options.map(text => ({
        poll_id: poll.id,
        text,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      Alert.alert('Success', 'Poll created successfully!');
      router.push(`/poll/${poll.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter poll title"
          maxLength={100}
        />

        <Text style={styles.label}>Question</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={question}
          onChangeText={setQuestion}
          placeholder="Enter your question"
          multiline
          maxLength={500}
        />

        <View style={styles.durationContainer}>
          <Text style={styles.label}>Duration (days)</Text>
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <Text style={styles.label}>Options</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={[styles.input, styles.optionInput]}
              value={option}
              onChangeText={(text) => updateOption(text, index)}
              placeholder={`Option ${index + 1}`}
              maxLength={200}
            />
            <Pressable
              onPress={() => removeOption(index)}
              style={({ pressed }) => [
                styles.removeButton,
                pressed && styles.buttonPressed,
              ]}>
              <Trash2 size={20} color="#ef4444" />
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={addOption}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
          ]}>
          <Plus size={20} color="#0891b2" />
          <Text style={styles.addButtonText}>Add Option</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Create Poll</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#18181b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationInput: {
    width: 80,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    marginRight: 12,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});