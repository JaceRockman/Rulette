import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import * as Clipboard from 'expo-clipboard';
import StripedBackground from '../components/StripedBackground';
import shared from '../styles/shared';
import OutlinedText from '../components/OutlinedText';

type LobbyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lobby'>;
type LobbyScreenRouteProp = RouteProp<RootStackParamList, 'Lobby'>;

export default function LobbyScreen() {
    const navigation = useNavigation<LobbyScreenNavigationProp>();
    const route = useRoute<LobbyScreenRouteProp>();
    const { gameState, currentPlayer, startGame } = useGame();

    const [startingPoints, setStartingPoints] = useState('20');
    const [numRules, setNumRules] = useState('3');
    const [numPrompts, setNumPrompts] = useState('3');

    const isHost = currentPlayer?.isHost;
    const lobbyCode = gameState?.code || route.params.code;

    const copyLobbyCode = async () => {
        await Clipboard.setStringAsync(lobbyCode);
        Alert.alert('Copied!', 'Lobby code copied to clipboard');
    };

    const handleStartGame = () => {
        if (!gameState?.players.length) {
            Alert.alert('Error', 'Need at least one player to start');
            return;
        }
        startGame();
        navigation.navigate('Game');
    };

    return (
        <StripedBackground>
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                    {/* Lobby Code Section */}
                    <View style={styles.section}>
                        <OutlinedText>Lobby Code</OutlinedText>
                        <TouchableOpacity style={shared.button} onPress={copyLobbyCode}>
                            <Text style={shared.buttonText}>{lobbyCode}</Text>
                            <Text style={styles.copyText}>Tap to copy</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Players Section */}
                    <View style={styles.section}>
                        <OutlinedText>Players ({gameState?.players.length || 0})</OutlinedText>
                        {gameState?.players.map((player) => (
                            <View key={player.id} style={styles.playerItem}>
                                <Text style={styles.playerName}>
                                    {player.name} {player.isHost ? '(Host)' : ''}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Host Settings Section */}
                    {isHost && (
                        <View style={styles.section}>
                            <OutlinedText>Game Settings</OutlinedText>

                            <View style={styles.settingRow}>
                                <OutlinedText>Starting Points:</OutlinedText>
                                <TextInput
                                    style={shared.input}
                                    value={startingPoints}
                                    onChangeText={setStartingPoints}
                                    keyboardType="numeric"
                                    placeholder="20"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <OutlinedText>Number of Rules:</OutlinedText>
                                <TextInput
                                    style={shared.input}
                                    value={numRules}
                                    onChangeText={setNumRules}
                                    keyboardType="numeric"
                                    placeholder="3"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <OutlinedText>Number of Prompts:</OutlinedText>
                                <TextInput
                                    style={shared.input}
                                    value={numPrompts}
                                    onChangeText={setNumPrompts}
                                    keyboardType="numeric"
                                    placeholder="3"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>
                    )}

                    {/* Start Game Button */}
                    {isHost && (
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={shared.button}
                                onPress={handleStartGame}
                                disabled={!gameState?.players.length}
                            >
                                <Text style={shared.buttonText}>Start Game</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </StripedBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 30,

    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 15,
        textAlign: 'center',
    },
    codeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        paddingVertical: 3,
        paddingHorizontal: 16,
        alignItems: 'center',
        alignSelf: 'center',
        width: '50%'
    },
    lobbyCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        letterSpacing: 2,
    },
    copyText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 5,
    },
    playerItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    playerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    settingLabel: {
        fontSize: 16,
        color: '#ffffff',
        marginRight: 15,
        minWidth: 120,
    },
    settingInput: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
    },
    startButton: {
        backgroundColor: '#cba84b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 