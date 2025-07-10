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
    const { gameState, currentUser, startGame, addTestPlayers, addFillerRules, addFillerPrompts } = useGame();

    const [startingPoints, setStartingPoints] = useState('');
    const [numRules, setNumRules] = useState('');
    const [numPrompts, setNumPrompts] = useState('');
    const [numTestPlayers, setNumTestPlayers] = useState('');
    const [numFillerRules, setNumFillerRules] = useState('');
    const [numFillerPrompts, setNumFillerPrompts] = useState('');

    const isHost = currentUser?.isHost;
    const lobbyCode = gameState?.code || route.params.code;

    // Navigate to rule writing when game starts
    React.useEffect(() => {
        if (gameState?.isGameStarted) {
            navigation.navigate('RuleWriting');
        }
    }, [gameState?.isGameStarted, navigation]);

    const copyLobbyCode = async () => {
        await Clipboard.setStringAsync(lobbyCode);
        Alert.alert('Copied!', 'Lobby code copied to clipboard');
    };

    const handleAddTestPlayers = () => {
        const numPlayers = parseInt(numTestPlayers) || 0;
        if (numPlayers > 0) {
            addTestPlayers(numPlayers);
            Alert.alert('Test Players Added', `${numPlayers} test players have been added to the game.`);
        }
    };

    const handleAddFillerRules = () => {
        const numRules = parseInt(numFillerRules) || 0;
        if (numRules > 0) {
            addFillerRules(numRules);
            Alert.alert('Filler Rules Added', `${numRules} filler rules have been added to the game.`);
        }
    };

    const handleAddFillerPrompts = () => {
        const numPrompts = parseInt(numFillerPrompts) || 0;
        if (numPrompts > 0) {
            addFillerPrompts(numPrompts);
            Alert.alert('Filler Prompts Added', `${numPrompts} filler prompts have been added to the game.`);
        }
    };

    const handleStartGame = () => {
        if (!gameState?.players.length) {
            Alert.alert('Error', 'Need at least one player to start');
            return;
        }

        // Start the game - navigation will be handled by useEffect when game state updates
        startGame();
    };

    return (
        <StripedBackground>
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                    {/* Lobby Code Section */}
                    <View style={styles.section}>
                        <OutlinedText style={{ textAlign: 'center' }}>Lobby Code</OutlinedText>
                        <TouchableOpacity style={styles.lobbyCodeButton} onPress={copyLobbyCode}>
                            <Text style={styles.lobbyCodeText}>{lobbyCode}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Host Section */}
                    {gameState?.players?.find(player => player.isHost) && (
                        <View style={styles.section}>
                            <OutlinedText>Host</OutlinedText>
                            <View style={styles.hostContainer}>
                                {gameState?.players?.filter(player => player.isHost).map((player) => (
                                    <View key={player.id} style={styles.hostItem}>
                                        <Text style={styles.playerName}>{player.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Players Section */}
                    {(gameState?.players?.filter(player => !player.isHost)?.length ?? 0) > 0 && (
                        <View style={styles.section}>
                            <OutlinedText>Players</OutlinedText>
                            <View style={styles.playerGrid}>
                                {(gameState?.players?.filter(player => !player.isHost) ?? []).map((player) => (
                                    <View key={player.id} style={styles.playerItem}>
                                        <Text style={styles.playerName}>{player.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Host Settings Section */}
                    {isHost && (
                        <View style={styles.section}>
                            <OutlinedText style={styles.gameSettingsTitle}>Game Settings</OutlinedText>

                            <View style={styles.settingContainer}>
                                <OutlinedText style={styles.settingLabel}>Starting Points</OutlinedText>
                                <TextInput
                                    style={styles.settingInput}
                                    value={startingPoints}
                                    onChangeText={setStartingPoints}
                                    keyboardType="numeric"
                                    placeholder="20"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.settingContainer}>
                                <OutlinedText style={styles.settingLabel}>Number of Rules</OutlinedText>
                                <TextInput
                                    style={styles.settingInput}
                                    value={numRules}
                                    onChangeText={setNumRules}
                                    keyboardType="numeric"
                                    placeholder="3"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.settingContainer}>
                                <OutlinedText style={styles.settingLabel}>Number of Prompts</OutlinedText>
                                <TextInput
                                    style={styles.settingInput}
                                    value={numPrompts}
                                    onChangeText={setNumPrompts}
                                    keyboardType="numeric"
                                    placeholder="3"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Development-only settings */}
                            {__DEV__ && (
                                <>
                                    <View style={styles.settingContainer}>
                                        <OutlinedText style={styles.settingLabel}>Test Players</OutlinedText>
                                        <TextInput
                                            style={styles.settingInput}
                                            value={numTestPlayers}
                                            onChangeText={setNumTestPlayers}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    {parseInt(numTestPlayers) > 0 && (
                                        <TouchableOpacity
                                            style={[shared.button, { marginTop: 10 }]}
                                            onPress={handleAddTestPlayers}
                                        >
                                            <Text style={shared.buttonText}>Add Test Players</Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.settingContainer}>
                                        <OutlinedText style={styles.settingLabel}>Filler Rules</OutlinedText>
                                        <TextInput
                                            style={styles.settingInput}
                                            value={numFillerRules}
                                            onChangeText={setNumFillerRules}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    {parseInt(numFillerRules) > 0 && (
                                        <TouchableOpacity
                                            style={[shared.button, { marginTop: 10 }]}
                                            onPress={handleAddFillerRules}
                                        >
                                            <Text style={shared.buttonText}>Add Filler Rules</Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.settingContainer}>
                                        <OutlinedText style={styles.settingLabel}>Filler Prompts</OutlinedText>
                                        <TextInput
                                            style={styles.settingInput}
                                            value={numFillerPrompts}
                                            onChangeText={setNumFillerPrompts}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    {parseInt(numFillerPrompts) > 0 && (
                                        <TouchableOpacity
                                            style={[shared.button, { marginTop: 10 }]}
                                            onPress={handleAddFillerPrompts}
                                        >
                                            <Text style={shared.buttonText}>Add Filler Prompts</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
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
    hostContainer: {
        alignItems: 'center',
    },
    hostItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: 8,
        alignItems: 'center',
        width: '50%',
    },
    playerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    playerItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: 8,
        alignItems: 'center',
        width: '48%',
    },
    playerName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#1f2937',
    },
    gameSettingsTitle: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 20,
    },
    settingContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    settingLabel: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    settingInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
        width: 200,
        textAlign: 'center',
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
    lobbyCodeButton: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        alignSelf: 'center',
        width: '60%',
        borderWidth: 3,
        borderColor: '#000000',
    },
    lobbyCodeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        letterSpacing: 2,
    },
}); 