import { Tabs } from 'expo-router';
import { Vote, History } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0891b2',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Active Polls',
          tabBarIcon: ({ color, size }) => <Vote size={size} color={color} />,
        }}
      />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create Poll',
            tabBarIcon: ({ color, size }) => <Vote size={size} color={color} />,
          }}
        />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}