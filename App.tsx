import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import EditHabitScreen from './src/screens/EditHabitScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { ready, onboarded } = useStore();
  const theme = useTheme();

  const navTheme = useMemo(() => {
    const base = theme.mode === 'dark' ? NavDarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: theme.bg, card: theme.bg, border: theme.border, text: theme.text, primary: theme.accent },
    };
  }, [theme]);

  if (!ready) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={onboarded ? 'Home' : 'Onboarding'}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </StoreProvider>
  );
}
