import React, { useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import RuleWritingScreen from './src/screens/RuleWritingScreen';
import PromptWritingScreen from './src/screens/PromptWritingScreen';
import { GameProvider } from './src/context/GameContext';
import OutlinedText from './src/components/OutlinedText';
import StripedBackground from './src/components/Backdrop';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './src/shared/styles';
import WheelScreen from './src/screens/WheelScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import { ExitGameModal } from './src/modals';
import { socketService } from './src/services/socketService';

export type RootStackParamList = {
    Home: undefined;
    Lobby: { lobbyCode?: string };
    Game: undefined;
    Wheel: { playerId?: string };
    RuleWriting: undefined;
    PromptWriting: undefined;
    GameOver: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    const [showExitGameModal, setShowExitGameModal] = useState(false);
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <GameProvider>
                    <StatusBar hidden={true} />
                    <Stack.Navigator
                        initialRouteName="Home"
                        screenOptions={{
                            headerBackground: () => (
                                <StripedBackground>
                                    <View style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                        height: 96,
                                        width: '100%',
                                        borderBottomWidth: 1,
                                        borderColor: '#000000',
                                    }} />
                                </StripedBackground>
                            ),
                            headerStyle: {
                                height: 96,
                            },
                            headerTitleStyle: {
                                fontSize: 20,
                                fontWeight: 'bold',
                            },
                            headerRight: () => (
                                <TouchableOpacity
                                    onPress={() => setShowExitGameModal(true)}
                                    style={{ marginLeft: 16 }}
                                >
                                    <Text style={{ fontSize: 24, marginRight: 16, color: colors.gameChangerWhite }}>✕</Text>
                                </TouchableOpacity>
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
                                headerRight: undefined,
                            }}
                        />
                        <Stack.Screen
                            name="Lobby"
                            component={LobbyScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Game Lobby</OutlinedText>,
                                headerTitleAlign: 'center',
                                headerLeft: undefined,
                            }}
                        />
                        <Stack.Screen
                            name="RuleWriting"
                            component={RuleWritingScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Write Rules</OutlinedText>,
                                headerTitleAlign: 'center',
                                headerLeft: undefined,
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
                        <Stack.Screen
                            name="Game"
                            component={GameScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Game Room</OutlinedText>,
                                headerTitleAlign: 'center',
                                headerLeft: undefined,
                            }}
                        />
                        <Stack.Screen
                            name="Wheel"
                            component={WheelScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Spin the Wheel!</OutlinedText>,
                                headerTitleAlign: 'center',
                                headerLeft: undefined,
                            }}
                        />
                        <Stack.Screen
                            name="GameOver"
                            component={GameOverScreen}
                            options={{
                                headerTitle: () => <OutlinedText>Game Over</OutlinedText>,
                                headerTitleAlign: 'center',
                                headerLeft: undefined,
                                headerRight: undefined,
                            }}
                        />
                    </Stack.Navigator>
                    <ExitGameModal
                        visible={showExitGameModal}
                        onAccept={() => {
                            console.log('socketService.getCurrentUserId()', socketService.getCurrentUserId())
                            socketService.removePlayer(socketService.getCurrentUserId()!)
                            setShowExitGameModal(false)
                        }}
                        onClose={() => { setShowExitGameModal(false) }}
                    />
                </GameProvider>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
} 