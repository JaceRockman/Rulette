import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { Player, Rule } from '../types/game';
import StripedBackground from '../components/StripedBackground';
import shared from '../styles/shared';
import OutlinedText from '../components/OutlinedText';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentPlayer, updatePoints, swapRules, assignRule } = useGame();
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
    const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);

    const handleSpinWheel = () => {
        navigation.navigate('Wheel');
    };

    const handleUpdatePoints = (playerId: string, currentPoints: number, change: number) => {
        const newPoints = Math.max(0, currentPoints + change);
        updatePoints(playerId, newPoints);
    };

    const handleSwapRules = (player1: Player, player2: Player) => {
        swapRules(player1.id, player2.id);
        setSelectedPlayer1(null);
        setSelectedPlayer2(null);
    };

    const handleAssignRule = (rule: Rule, playerId: string) => {
        assignRule(rule.id, playerId);
        setSelectedRule(null);
    };

    const openRuleModal = (rule: Rule) => {
        setSelectedRule(rule);
    };

    // Show game over screen if game has ended
    if (gameState?.gameEnded && gameState?.winner) {
        return (
            <StripedBackground>
                <View style={[shared.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <OutlinedText style={{ fontSize: 48, marginBottom: 20, color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
                        GAME OVER!
                    </OutlinedText>

                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        padding: 40,
                        margin: 20,
                        borderWidth: 4,
                        borderColor: '#000',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}>
                        <Text style={{
                            fontSize: 32,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: 10,
                            color: '#000',
                        }}>
                            🏆 WINNER! 🏆
                        </Text>
                        <Text style={{
                            fontSize: 24,
                            textAlign: 'center',
                            marginBottom: 10,
                            color: '#000',
                        }}>
                            {gameState.winner.name}
                        </Text>
                        <Text style={{
                            fontSize: 20,
                            textAlign: 'center',
                            color: '#666',
                        }}>
                            {gameState.winner.points} points
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[shared.button, { marginTop: 30 }]}
                        onPress={() => navigation.navigate('Home' as never)}
                    >
                        <Text style={shared.buttonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </StripedBackground>
        );
    }

    if (!gameState || !currentPlayer) {
        return (
            <StripedBackground>
                <SafeAreaView style={styles.container}>
                    <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                        <View style={styles.content}>
                            <Text style={styles.errorText}>Loading game...</Text>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </StripedBackground>
        );
    }

    return (
        <StripedBackground>
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Game Room</Text>
                        <Text style={styles.gameStatus}>
                            {currentPlayer.isHost ? 'You are the host' : 'Waiting for host to start...'}
                        </Text>
                    </View>

                    {/* Players Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Players</Text>
                        {gameState.players.map((player) => (
                            <View key={player.id} style={styles.playerCard}>
                                <View style={styles.playerHeader}>
                                    <Text style={styles.playerName}>
                                        {player.name} {player.isHost ? '(Host)' : ''}
                                    </Text>
                                    <Text style={styles.playerPoints}>{player.points} pts</Text>
                                </View>

                                {currentPlayer.isHost && (
                                    <View style={styles.pointControls}>
                                        <TouchableOpacity
                                            style={[shared.button]}
                                            onPress={() => handleUpdatePoints(player.id, player.points, -5)}
                                        >
                                            <Text style={shared.buttonText}>-5</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[shared.button]}
                                            onPress={() => handleUpdatePoints(player.id, player.points, -1)}
                                        >
                                            <Text style={shared.buttonText}>-1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={shared.button}
                                            onPress={() => handleUpdatePoints(player.id, player.points, 1)}
                                        >
                                            <Text style={shared.buttonText}>+1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={shared.button}
                                            onPress={() => handleUpdatePoints(player.id, player.points, 5)}
                                        >
                                            <Text style={shared.buttonText}>+5</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {player.rules.length > 0 && (
                                    <View style={styles.rulesContainer}>
                                        <Text style={styles.rulesTitle}>Rules:</Text>
                                        {player.rules.map((rule) => (
                                            <View key={rule.id} style={styles.ruleItem}>
                                                <Text style={styles.ruleText}>{rule.text}</Text>
                                                {currentPlayer.isHost && (
                                                    <TouchableOpacity
                                                        onPress={() => openRuleModal(rule)}
                                                    >
                                                        <Text style={styles.ruleAction}>Tap to reassign</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Rule Swap Section (Host Only) */}
                    {currentPlayer.isHost && gameState.players.length >= 2 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Swap Rules Between Players</Text>
                            <Text style={styles.sectionSubtitle}>Select two players to swap their rules</Text>

                            <View style={styles.swapContainer}>
                                {gameState.players.map((player) => (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={[
                                            styles.swapChip,
                                            (selectedPlayer1?.id === player.id || selectedPlayer2?.id === player.id) && styles.selectedSwapChip
                                        ]}
                                        onPress={() => {
                                            if (!selectedPlayer1) {
                                                setSelectedPlayer1(player);
                                            } else if (!selectedPlayer2 && selectedPlayer1.id !== player.id) {
                                                setSelectedPlayer2(player);
                                            } else if (selectedPlayer1?.id === player.id) {
                                                setSelectedPlayer1(null);
                                            } else if (selectedPlayer2?.id === player.id) {
                                                setSelectedPlayer2(null);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.swapChipText,
                                            (selectedPlayer1?.id === player.id || selectedPlayer2?.id === player.id) && styles.selectedSwapChipText
                                        ]}>
                                            {player.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {selectedPlayer1 && selectedPlayer2 && (
                                <TouchableOpacity
                                    style={styles.spinButton}
                                    onPress={() => handleSwapRules(selectedPlayer1, selectedPlayer2)}
                                >
                                    <Text style={styles.spinButtonText}>
                                        Swap Rules: {selectedPlayer1.name} ↔ {selectedPlayer2.name}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <Text style={styles.swapHint}>
                                Tap players to select them, then tap "Swap Rules" to exchange their rules
                            </Text>
                        </View>
                    )}

                    {/* Spin Wheel Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.spinButton}
                            onPress={handleSpinWheel}
                        >
                            <Text style={styles.spinButtonText}>Spin the Wheel!</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Rule Assignment Modal */}
                <Modal
                    visible={selectedRule !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedRule(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Assign Rule</Text>
                            <Text style={styles.modalRuleText}>{selectedRule?.text}</Text>

                            <Text style={styles.modalSubtitle}>Select a player to assign this rule to:</Text>
                            <ScrollView style={styles.modalPlayerList}>
                                {gameState.players.map((player) => (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={styles.modalPlayerItem}
                                        onPress={() => selectedRule && handleAssignRule(selectedRule, player.id)}
                                    >
                                        <Text style={styles.modalPlayerName}>{player.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setSelectedRule(null)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    gameStatus: {
        fontSize: 16,
        color: '#e5e7eb',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    playerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    playerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    playerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    playerPoints: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d08d4b',
    },
    pointControls: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    rulesContainer: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
    },
    rulesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6b7280',
        marginBottom: 8,
    },
    ruleItem: {
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        padding: 8,
        marginBottom: 6,
    },
    ruleText: {
        fontSize: 12,
        color: '#1f2937',
    },
    ruleAction: {
        fontSize: 10,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 2,
    },
    swapContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    swapChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    selectedSwapChip: {
        backgroundColor: '#ffffff',
    },
    swapChipText: {
        color: '#ffffff',
        fontSize: 14,
    },
    selectedSwapChipText: {
        color: '#1f2937',
    },
    swapHint: {
        fontSize: 12,
        color: '#e5e7eb',
        fontStyle: 'italic',
        marginTop: 8,
    },
    spinButton: {
        backgroundColor: '#cba84b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    spinButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#9b2f4d',
        textAlign: 'center',
        marginTop: 50,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalRuleText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    modalSubtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    modalPlayerList: {
        maxHeight: 200,
    },
    modalPlayerItem: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    modalPlayerName: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#6b7280',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
    },
    modalCancelText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 