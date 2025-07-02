import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import WheelScreen from './src/screens/WheelScreen';
import { GameProvider } from './src/context/GameContext';

export type RootStackParamList = {
    Home: undefined;
    Lobby: { code: string };
    Game: undefined;
    Wheel: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <GameProvider>
                <NavigationContainer>
                    <StatusBar style="auto" />
                    <Stack.Navigator
                        initialRouteName="Home"
                        screenOptions={{
                            headerStyle: {
                                backgroundColor: '#6366f1',
                            },
                            headerTintColor: '#fff',
                            headerTitleStyle: {
                                fontWeight: 'bold',
                            },
                        }}
                    >
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ title: 'Spin That Wheel' }}
                        />
                        <Stack.Screen
                            name="Lobby"
                            component={LobbyScreen}
                            options={{ title: 'Game Lobby' }}
                        />
                        <Stack.Screen
                            name="Game"
                            component={GameScreen}
                            options={{ title: 'Game Room' }}
                        />
                        <Stack.Screen
                            name="Wheel"
                            component={WheelScreen}
                            options={{ title: 'Spin the Wheel!' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </GameProvider>
        </GestureHandlerRootView>
    );
} 