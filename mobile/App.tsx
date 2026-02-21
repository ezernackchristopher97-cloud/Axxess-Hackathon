/**
 * NeuroSync Care
 * © 2026 Christopher Ezernack
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from './src/utils/theme';
import { DemoProvider, useDemoMode } from './src/contexts/DemoContext';

// Screens
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import RiskScoreScreen from './src/screens/RiskScoreScreen';
import CaregiverScreen from './src/screens/CaregiverScreen';
import VisitSummaryScreen from './src/screens/VisitSummaryScreen';
import AssistantChatScreen from './src/screens/AssistantChatScreen';
import EmergencyCardScreen from './src/screens/EmergencyCardScreen';
import NeuroSyncSettingsScreen from './src/screens/NeuroSyncSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.backgroundLight,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};


function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🧠',
    Risk: '📊',
    Care: '👥',
    Chat: '💬',
    SOS: '🚨',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[name] || '•'}
      </Text>
    </View>
  );
}


function HeaderRight() {
  const { isDemoMode } = useDemoMode();
  return (
    <View style={[styles.headerBadge, { backgroundColor: isDemoMode ? colors.warning + '30' : colors.success + '30' }]}>
      <Text style={[styles.headerBadgeText, { color: isDemoMode ? colors.warning : colors.success }]}>
        {isDemoMode ? 'DEMO' : 'LIVE'}
      </Text>
    </View>
  );
}


function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundLight,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.backgroundLight,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => <HeaderRight />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={PatientProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'NeuroSync Care',
          headerTitleStyle: {
            color: colors.primary,
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      />
      <Tab.Screen
        name="Risk"
        component={RiskScoreScreen}
        options={{
          title: 'Risk',
          headerTitle: 'Predictive Risk Score',
        }}
      />
      <Tab.Screen
        name="Care"
        component={CaregiverScreen}
        options={{
          title: 'Caregiver',
          headerTitle: 'Caregiver Alerts',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={AssistantChatScreen}
        options={{
          title: 'Assistant',
          headerTitle: 'NeuroSync Assistant',
        }}
      />
      <Tab.Screen
        name="SOS"
        component={EmergencyCardScreen}
        options={{
          title: 'SOS',
          headerTitle: 'Emergency Card',
          tabBarBadge: '!',
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            fontSize: 10,
          },
        }}
      />
    </Tab.Navigator>
  );
}


function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundLight,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VisitSummary"
        component={VisitSummaryScreen}
        options={{
          title: 'Visit Summary',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={NeuroSyncSettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <DemoProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <AppStack />
          </NavigationContainer>
        </DemoProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconFocused: {
    transform: [{ scale: 1.15 }],
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 12,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
