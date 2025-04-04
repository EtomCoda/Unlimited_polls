import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function Logout () {
  const router = useRouter();

  useEffect(() => {
    const logoutUser = async () => {
      try {
          // Sign out the user
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        // Redirect to the sign-in route
        router.push('/auth/signin');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

    logoutUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Logging out...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});


