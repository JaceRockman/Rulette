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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import * as Clipboard from 'expo-clipboard';

type LobbyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lobby'>;
type LobbyScreenRouteProp = RouteProp<RootStackParamList, 'Lobby'>;

export default function LobbyScreen() {
    const navigation = useNavigation<LobbyScreenNavigationProp>();
    const route = useRoute<LobbyScreenRouteProp>();
    const { gameState, currentPlayer, addPrompt, addRule, startGame } = useGame();

    const [newPrompt, setNewPrompt] = useState('');
    const [newRule, setNewRule] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState('');

    const isHost = currentPlayer?.isHost;
    const lobbyCode = gameState?.code || route.params.code;

    const copyLobbyCode = async () => {
        await Clipboard.setStringAsync(lobbyCode);
        Alert.alert('Copied!', 'Lobby code copied to clipboard');
    };

    const handleAddPrompt = () => {
        if (!newPrompt.trim()) {
            Alert.alert('Error', 'Please enter a prompt');
            return;
        }
        addPrompt(newPrompt.trim());
        setNewPrompt('');
    };

    const handleAddRule = () => {
        if (!newRule.trim()) {
            Alert.alert('Error', 'Please enter a rule');
            return;
        }
        addRule(newRule.trim());
        setNewRule('');
    };

    const handleStartGame = () => {
        if (!gameState?.prompts.length) {
            Alert.alert('Error', 'Please add at least one prompt before starting');
            return;
        }
        if (!gameState?.rules.length) {
            Alert.alert('Error', 'Please add at least one rule before starting');
            return;
        }
        startGame();
        navigation.navigate('Game');
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.gradient}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Lobby Code Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lobby Code</Text>
                        <TouchableOpacity style={styles.codeContainer} onPress={copyLobbyCode}>
                            <Text style={styles.lobbyCode}>{lobbyCode}</Text>
                            <Text style={styles.copyText}>Tap to copy</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Players Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Players ({gameState?.players.length || 0})</Text>
                        {gameState?.players.map((player) => (
                            <View key={player.id} style={styles.playerItem}>
                                <Text style={styles.playerName}>
                                    {player.name} {player.isHost ? '(Host)' : ''}
                                </Text>
                                <Text style={styles.playerPoints}>{player.points} pts</Text>
                            </View>
                        ))}
                    </View>

                    {/* Add Prompts Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Add Prompts</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter a prompt..."
                                placeholderTextColor="#9ca3af"
                                value={newPrompt}
                                onChangeText={setNewPrompt}
                                multiline
                            />
                            <TouchableOpacity style={styles.addButton} onPress={handleAddPrompt}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        {gameState?.prompts.map((prompt) => (
                            <View key={prompt.id} style={styles.itemCard}>
                                <Text style={styles.itemText}>{prompt.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Add Rules Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Add Rules</Text>
                        <Text style={styles.sectionSubtitle}>Rules will be assigned to players when they spin the wheel</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter a rule..."
                                placeholderTextColor="#9ca3af"
                                value={newRule}
                                onChangeText={setNewRule}
                                multiline
                            />
                            <TouchableOpacity style={styles.addButton} onPress={handleAddRule}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        {gameState?.rules.map((rule) => (
                            <View key={rule.id} style={styles.itemCard}>
                                <Text style={styles.itemText}>{rule.text}</Text>
                                {rule.assignedTo && (
                                    <Text style={styles.assignedText}>
                                        Assigned to: {gameState.players.find(p => p.id === rule.assignedTo)?.name}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Start Game Button */}
                    {isHost && (
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={handleStartGame}
                                disabled={!gameState?.prompts.length || !gameState?.rules.length}
                            >
                                <Text style={styles.startButtonText}>Start Game</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
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
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#e5e7eb',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    codeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    lobbyCode: {
        fontSize: 24,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    playerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    playerPoints: {
        fontSize: 14,
        color: '#6b7280',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
        marginRight: 10,
        minHeight: 40,
    },
    addButton: {
        backgroundColor: '#10b981',
        borderRadius: 8,
        padding: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    playerSelector: {
        marginBottom: 10,
    },
    selectorLabel: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
    },
    playerChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
    },
    selectedChip: {
        backgroundColor: '#ffffff',
    },
    chipText: {
        color: '#ffffff',
        fontSize: 14,
    },
    selectedChipText: {
        color: '#1f2937',
    },
    itemCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    itemText: {
        fontSize: 14,
        color: '#1f2937',
        marginBottom: 4,
    },
    assignedText: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    startButton: {
        backgroundColor: '#ef4444',
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