import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import WheelScreen from './src/screens/WheelScreen';
import RuleWritingScreen from './src/screens/RuleWritingScreen';
import PromptWritingScreen from './src/screens/PromptWritingScreen';
import { GameProvider } from './src/context/GameContext';
import OutlinedText from './src/components/OutlinedText';
import StripedBackground from './src/components/StripedBackground';
import { View } from 'react-native';

export type RootStackParamList = {
    Home: undefined;
    Lobby: { code: string };
    Game: undefined;
    Wheel: { playerId?: string };
    RuleWriting: undefined;
    PromptWriting: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <GameProvider>
                <NavigationContainer>
                    <StatusBar hidden={true} />
                    <Stack.Navigator
                        initialRouteName="Home"
                        screenOptions={{
                            headerBackground: () => (
                                <StripedBackground>
                                    <View style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                        height: 107,
                                        width: '100%',
                                        borderBottomWidth: 1,
                                        borderColor: '#000000',
                                    }} />
                                </StripedBackground>
                            ),
                            headerTintColor: '#fff',
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
                        <Stack.Screen
                            name="RuleWriting"
                            component={RuleWritingScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Write Rules</OutlinedText>,
                                headerTitleAlign: 'center',
                            }}
                        />
                        <Stack.Screen
                            name="PromptWriting"
                            component={PromptWritingScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Write Prompts</OutlinedText>,
                                headerTitleAlign: 'center',
                            }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </GameProvider>
        </GestureHandlerRootView>
    );
} 