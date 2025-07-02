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
import OutlinedText from './src/components/OutlinedText';


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
                                backgroundColor: 'transparent',
                                elevation: 0,
                                shadowOpacity: 0,
                                height: 100,
                            },
                            headerTintColor: '#fff',
                            headerTitleStyle: {
                                fontWeight: 'bold',
                                fontSize: 36,
                                color: '#fff',
                            },
                            headerTransparent: true,
                        }}
                    >
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Spin That Wheel</OutlinedText>,
                                headerTitleAlign: 'center',
                            }}
                        />
                        <Stack.Screen
                            name="Lobby"
                            component={LobbyScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Game Lobby</OutlinedText>,
                                headerTitleAlign: 'center',
                            }}
                        />
                        <Stack.Screen
                            name="Game"
                            component={GameScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Game Room</OutlinedText>,
                                headerTitleAlign: 'center',
                            }}
                        />
                        <Stack.Screen
                            name="Wheel"
                            component={WheelScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Spin the Wheel!</OutlinedText>,
                                headerTitleAlign: 'center',
                            }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </GameProvider>
        </GestureHandlerRootView>
    );
} 