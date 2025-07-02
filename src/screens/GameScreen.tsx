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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { Player, Rule } from '../types/game';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentPlayer, updatePoints, swapRules, assignRule } = useGame();
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    const handleSpinWheel = () => {
        navigation.navigate('Wheel');
    };

    const handleUpdatePoints = (playerId: string, currentPoints: number, change: number) => {
        const newPoints = Math.max(0, currentPoints + change);
        updatePoints(playerId, newPoints);
    };

    const handleSwapRules = (player1: Player, player2: Player) => {
        swapRules(player1.id, player2.id);
        Alert.alert('Rules Swapped!', `Rules have been swapped between ${player1.name} and ${player2.name}`);
    };

    const handleAssignRule = (rule: Rule, playerId: string) => {
        assignRule(rule.id, playerId);
        setShowRuleModal(false);
        setSelectedRule(null);
    };

    const openRuleModal = (rule: Rule) => {
        setSelectedRule(rule);
        setShowRuleModal(true);
    };

    if (!gameState) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No game state found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#ec4899']}
                style={styles.gradient}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Game Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Round {gameState.roundNumber}</Text>
                        <Text style={styles.gameStatus}>
                            {gameState.isWheelSpinning ? 'Wheel is spinning...' : 'Ready to spin!'}
                        </Text>
                    </View>

                    {/* Players and Scores */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Players & Scores</Text>
                        {gameState.players.map((player: Player) => (
                            <View key={player.id} style={styles.playerCard}>
                                <View style={styles.playerHeader}>
                                    <Text style={styles.playerName}>
                                        {player.name} {player.isHost ? '(Host)' : ''}
                                    </Text>
                                    <Text style={styles.playerPoints}>{player.points} pts</Text>
                                </View>

                                <View style={styles.pointControls}>
                                    <TouchableOpacity
                                        style={styles.pointButton}
                                        onPress={() => handleUpdatePoints(player.id, player.points, 2)}
                                    >
                                        <Text style={styles.pointButtonText}>+2</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.pointButton, styles.minusButton]}
                                        onPress={() => handleUpdatePoints(player.id, player.points, -1)}
                                    >
                                        <Text style={styles.pointButtonText}>-1</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Player's Rules */}
                                <View style={styles.rulesContainer}>
                                    <Text style={styles.rulesTitle}>Rules:</Text>
                                    {gameState.rules
                                        .filter((rule: Rule) => rule.assignedTo === player.id)
                                        .map((rule: Rule) => (
                                            <TouchableOpacity
                                                key={rule.id}
                                                style={styles.ruleItem}
                                                onPress={() => openRuleModal(rule)}
                                            >
                                                <Text style={styles.ruleText}>{rule.text}</Text>
                                                <Text style={styles.ruleAction}>Tap to reassign</Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Rule Swap Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Swap Rules</Text>
                        <Text style={styles.sectionSubtitle}>Select two players to swap their rules</Text>
                        <View style={styles.swapContainer}>
                            {gameState.players.map((player: Player) => (
                                <TouchableOpacity
                                    key={player.id}
                                    style={[
                                        styles.swapChip,
                                        selectedPlayer?.id === player.id && styles.selectedSwapChip
                                    ]}
                                    onPress={() => {
                                        if (selectedPlayer && selectedPlayer.id !== player.id) {
                                            handleSwapRules(selectedPlayer, player);
                                            setSelectedPlayer(null);
                                        } else {
                                            setSelectedPlayer(player);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.swapChipText,
                                        selectedPlayer?.id === player.id && styles.selectedSwapChipText
                                    ]}>
                                        {player.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {selectedPlayer && (
                            <Text style={styles.swapHint}>
                                Now select another player to swap rules with {selectedPlayer.name}
                            </Text>
                        )}
                    </View>

                    {/* Spin Wheel Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.spinButton}
                            onPress={handleSpinWheel}
                            disabled={gameState.isWheelSpinning}
                        >
                            <Text style={styles.spinButtonText}>
                                {gameState.isWheelSpinning ? 'Wheel Spinning...' : 'Spin the Wheel!'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Rule Assignment Modal */}
                <Modal
                    visible={showRuleModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowRuleModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Reassign Rule</Text>
                            <Text style={styles.modalRuleText}>{selectedRule?.text}</Text>
                            <Text style={styles.modalSubtitle}>Assign to:</Text>
                            <ScrollView style={styles.modalPlayerList}>
                                {gameState.players.map((player: Player) => (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={styles.modalPlayerItem}
                                        onPress={() => handleAssignRule(selectedRule!, player.id)}
                                    >
                                        <Text style={styles.modalPlayerName}>{player.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowRuleModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
        color: '#10b981',
    },
    pointControls: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    pointButton: {
        backgroundColor: '#10b981',
        borderRadius: 8,
        padding: 8,
        marginRight: 8,
        minWidth: 40,
        alignItems: 'center',
    },
    minusButton: {
        backgroundColor: '#ef4444',
    },
    pointButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
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
        backgroundColor: '#f59e0b',
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
        color: '#ef4444',
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