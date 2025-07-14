import { Tabs } from 'expo-router';
import { Camera, Image, Kanban, User } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 18,
          height: 68,
          borderRadius: 24,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
        },
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size, focused }) => <Camera size={focused ? 28 : 24} color={color} />,
          headerTitle: '📷 Compliance Camera',
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'AI Gallery',
          tabBarIcon: ({ color, size, focused }) => <Image size={focused ? 28 : 24} color={color} />,
          headerTitle: '🤖 AI Gallery',
        }}
      />
      <Tabs.Screen
        name="kanban"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => <Kanban size={focused ? 28 : 24} color={color} />,
          headerTitle: '📋 Task Board',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => <User size={focused ? 28 : 24} color={color} />,
          headerTitle: '👤 Profile & Settings',
        }}
      />
    </Tabs>
  );
} 