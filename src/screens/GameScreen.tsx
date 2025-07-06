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
import DigitalClock from '../components/DigitalClock';
import Plaque from '../components/Plaque';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentPlayer, updatePoints, swapRules, assignRule, endGame } = useGame();
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
    const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);
    const [showRulePopup, setShowRulePopup] = useState(false);
    const [selectedRuleForAccusation, setSelectedRuleForAccusation] = useState<{ rule: Rule; accusedPlayer: Player } | null>(null);
    const [showAccusationPopup, setShowAccusationPopup] = useState(false);
    const [accusationDetails, setAccusationDetails] = useState<{ accuser: Player; accused: Player; rule: Rule } | null>(null);
    const [isAccusationInProgress, setIsAccusationInProgress] = useState(false);

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

    const handleRuleTap = (rule: Rule, accusedPlayer: Player) => {
        // Prevent accusation if one is already in progress
        if (isAccusationInProgress) {
            return;
        }
        setSelectedRuleForAccusation({ rule, accusedPlayer });
        setShowRulePopup(true);
    };

    const handleAccuse = () => {
        if (selectedRuleForAccusation && currentPlayer) {
            setAccusationDetails({
                accuser: currentPlayer,
                accused: selectedRuleForAccusation.accusedPlayer,
                rule: selectedRuleForAccusation.rule
            });
            setShowRulePopup(false);
            setShowAccusationPopup(true);
            setIsAccusationInProgress(true);
        }
    };

    const handleAcceptAccusation = () => {
        if (accusationDetails) {
            // Give point to accuser
            updatePoints(accusationDetails.accuser.id, accusationDetails.accuser.points + 1);
            // Take point from accused
            updatePoints(accusationDetails.accused.id, accusationDetails.accused.points - 1);
            setShowAccusationPopup(false);
            setAccusationDetails(null);
            setIsAccusationInProgress(false);
        }
    };

    const handleDeclineAccusation = () => {
        setShowAccusationPopup(false);
        setAccusationDetails(null);
        setIsAccusationInProgress(false);
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
                                <Text style={styles.playerName}>
                                    {player.name} {player.isHost ? '(Host)' : ''}
                                </Text>

                                <View style={styles.pointsRow}>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#dc3545',
                                            width: 60,
                                            height: 40,
                                            borderRadius: 8,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => handleUpdatePoints(player.id, player.points, -1)}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>-1</Text>
                                    </TouchableOpacity>
                                    <View style={styles.pointsContainer}>
                                        <DigitalClock value={player.points} />
                                    </View>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#28a745',
                                            width: 60,
                                            height: 40,
                                            borderRadius: 8,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => handleUpdatePoints(player.id, player.points, 1)}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>+1</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Player's Assigned Rules */}
                                {(() => {
                                    const playerRules = gameState.rules.filter(rule => rule.assignedTo === player.id);
                                    return playerRules.length > 0 ? (
                                        <View style={styles.playerRulesContainer}>
                                            <Text style={styles.playerRulesTitle}>Assigned Rules:</Text>
                                            <View style={styles.playerRulesGrid}>
                                                {(() => {
                                                    const rows = [];
                                                    for (let i = 0; i < playerRules.length; i += 2) {
                                                        const hasSecondItem = playerRules[i + 1];
                                                        const row = (
                                                            <View key={i} style={{
                                                                flexDirection: 'row',
                                                                marginBottom: 12,
                                                                justifyContent: 'space-between',
                                                                width: '100%'
                                                            }}>
                                                                <View style={{ width: '48%' }}>
                                                                    <TouchableOpacity
                                                                        onPress={() => handleRuleTap(playerRules[i], player)}
                                                                        activeOpacity={0.8}
                                                                    >
                                                                        <Plaque
                                                                            text={playerRules[i].text}
                                                                            plaqueColor={playerRules[i].plaqueColor || '#fff'}
                                                                            style={{ minHeight: 100 }}
                                                                        />
                                                                    </TouchableOpacity>
                                                                </View>
                                                                {hasSecondItem && (
                                                                    <View style={{ width: '48%' }}>
                                                                        <TouchableOpacity
                                                                            onPress={() => handleRuleTap(playerRules[i + 1], player)}
                                                                            activeOpacity={0.8}
                                                                        >
                                                                            <Plaque
                                                                                text={playerRules[i + 1].text}
                                                                                plaqueColor={playerRules[i + 1].plaqueColor || '#fff'}
                                                                                style={{ minHeight: 100 }}
                                                                            />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        );
                                                        rows.push(row);
                                                    }
                                                    return rows;
                                                })()}
                                            </View>
                                        </View>
                                    ) : null;
                                })()}





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

                    {/* End Game Early Button (Host Only) */}
                    {currentPlayer.isHost && (
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={[styles.spinButton, { backgroundColor: '#ed5c5d' }]}
                                onPress={() => {
                                    // Find player with most points
                                    const winner = gameState.players.reduce((prev, current) =>
                                        (prev.points > current.points) ? prev : current
                                    );
                                    if (winner) {
                                        endGame();
                                    }
                                }}
                            >
                                <Text style={styles.spinButtonText}>End Game Early</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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

                {/* Rule Accusation Popup */}
                {showRulePopup && (
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9999,
                            elevation: 9999,
                        }}
                        activeOpacity={1}
                        onPress={() => setShowRulePopup(false)}
                    >
                        <TouchableOpacity
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: selectedRuleForAccusation?.rule.plaqueColor || '#ffffff',
                                    borderWidth: 2,
                                    borderColor: '#000000',
                                }
                            ]}
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <Text style={[
                                styles.modalTitle,
                                {
                                    color: (() => {
                                        const plaqueColor = selectedRuleForAccusation?.rule.plaqueColor || '#ffffff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff' || plaqueColor === '#ffffff') ? '#000' : '#fff';
                                    })()
                                }
                            ]}>Rule Details</Text>
                            <Text style={[
                                styles.modalRuleText,
                                {
                                    color: (() => {
                                        const plaqueColor = selectedRuleForAccusation?.rule.plaqueColor || '#ffffff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff' || plaqueColor === '#ffffff') ? '#000' : '#fff';
                                    })()
                                }
                            ]}>
                                {selectedRuleForAccusation?.rule.text}
                            </Text>
                            {(!currentPlayer || selectedRuleForAccusation?.accusedPlayer.id !== currentPlayer.id) && (
                                <Text style={[
                                    styles.modalSubtitle,
                                    {
                                        color: (() => {
                                            const plaqueColor = selectedRuleForAccusation?.rule.plaqueColor || '#ffffff';
                                            return (plaqueColor === '#fbbf24' || plaqueColor === '#fff' || plaqueColor === '#ffffff') ? '#000' : '#fff';
                                        })()
                                    }
                                ]}>
                                    Accusing {selectedRuleForAccusation?.accusedPlayer.name} of breaking this rule
                                </Text>
                            )}

                            {(!currentPlayer || selectedRuleForAccusation?.accusedPlayer.id !== currentPlayer.id) && (
                                <TouchableOpacity
                                    style={[
                                        styles.spinButton,
                                        {
                                            alignSelf: 'center',
                                            marginTop: 20,
                                            opacity: isAccusationInProgress ? 0.5 : 1
                                        }
                                    ]}
                                    onPress={handleAccuse}
                                    disabled={isAccusationInProgress}
                                >
                                    <Text style={styles.spinButtonText}>Accuse!</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}

                {/* Host Accusation Decision Popup */}
                <Modal
                    visible={showAccusationPopup}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowAccusationPopup(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Rule Violation Accusation</Text>
                            <Text style={styles.modalRuleText}>
                                {accusationDetails?.accuser.name} has accused {accusationDetails?.accused.name} of breaking rule:
                            </Text>
                            <Text style={[styles.modalRuleText, { fontStyle: 'italic', marginTop: 10 }]}>
                                "{accusationDetails?.rule.text}"
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
                                <TouchableOpacity
                                    style={[styles.modalCancelButton, { flex: 1, marginRight: 10 }]}
                                    onPress={handleDeclineAccusation}
                                >
                                    <Text style={styles.modalCancelText}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.spinButton, { flex: 1, marginLeft: 10 }]}
                                    onPress={handleAcceptAccusation}
                                >
                                    <Text style={styles.spinButtonText}>Accept</Text>
                                </TouchableOpacity>
                            </View>
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
        marginBottom: 8,
        alignSelf: 'center',
    },
    pointsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 12,
    },
    pointsContainer: {
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 8,
        paddingHorizontal: 2,
        paddingVertical: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
        width: 80,
    },
    playerRulesContainer: {
        marginBottom: 12,
    },
    playerRulesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6b7280',
        marginBottom: 8,
        textAlign: 'center',
    },
    playerRulesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },

    playerPoints: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d08d4b',
    },
    pointControls: {
        flexDirection: 'row',
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
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