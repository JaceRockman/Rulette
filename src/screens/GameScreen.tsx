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
import { colors } from '../styles/shared';
import shared from '../styles/shared';
import OutlinedText from '../components/OutlinedText';
import DigitalClock from '../components/DigitalClock';
import Plaque from '../components/Plaque';
import {
    RuleAccusationPopup,
    AccusationDecisionModal,
    HostPlayerActionModal,
    AccusationRuleModal
} from '../components/Modals';
import AbstractRuleSelectionModal from '../components/Modals/RuleSelectionModal';
import AbstractPlayerSelectionModal from '../components/Modals/PlayerSelectionModal';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentPlayer, updatePoints, assignRule, endGame, dispatch } = useGame();
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [showRulePopup, setShowRulePopup] = useState(false);
    const [selectedRuleForAccusation, setSelectedRuleForAccusation] = useState<{ rule: Rule; accusedPlayer: Player } | null>(null);
    const [showAccusationPopup, setShowAccusationPopup] = useState(false);
    const [accusationDetails, setAccusationDetails] = useState<{ accuser: Player; accused: Player; rule: Rule } | null>(null);
    const [isAccusationInProgress, setIsAccusationInProgress] = useState(false);
    const [showRuleSelectionModal, setShowRuleSelectionModal] = useState(false);
    const [acceptedAccusationDetails, setAcceptedAccusationDetails] = useState<{ accuser: Player; accused: Player; rule: Rule } | null>(null);
    const [selectedPlayerForAction, setSelectedPlayerForAction] = useState<Player | null>(null);
    const [showPlayerActionModal, setShowPlayerActionModal] = useState(false);
    const [showShredRuleModal, setShowShredRuleModal] = useState(false);
    const [showGiveRuleModal, setShowGiveRuleModal] = useState(false);
    const [showAccusationTargetModal, setShowAccusationTargetModal] = useState(false);
    const [showAccusationRuleModal, setShowAccusationRuleModal] = useState(false);
    const [accusationTarget, setAccusationTarget] = useState<Player | null>(null);
    const [originalCurrentPlayer, setOriginalCurrentPlayer] = useState<string | null>(null);

    // Restore original current player when returning from wheel
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (originalCurrentPlayer && currentPlayer && currentPlayer.id !== originalCurrentPlayer) {
                dispatch({ type: 'SET_CURRENT_PLAYER', payload: originalCurrentPlayer });
                setOriginalCurrentPlayer(null);
            }
        });

        return unsubscribe;
    }, [navigation, originalCurrentPlayer, currentPlayer, dispatch]);

    const handleSpinWheel = () => {
        navigation.navigate('Wheel');
    };

    const handleUpdatePoints = (playerId: string, currentPoints: number, change: number) => {
        const newPoints = Math.max(0, currentPoints + change);
        updatePoints(playerId, newPoints);
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
        if (accusationDetails && gameState) {
            // Give point to accuser
            updatePoints(accusationDetails.accuser.id, accusationDetails.accuser.points + 1);
            // Take point from accused
            updatePoints(accusationDetails.accused.id, accusationDetails.accused.points - 1);

            // Check if accuser has any rules to give
            const accuserRules = gameState.rules.filter(rule => rule.assignedTo === accusationDetails.accuser.id);

            if (accuserRules.length > 0) {
                // Store the accepted accusation details and show rule selection modal
                setAcceptedAccusationDetails(accusationDetails);
                setShowAccusationPopup(false);
                setShowRuleSelectionModal(true);
            } else {
                // Accuser has no rules to give, complete accusation without rule reassignment
                Alert.alert(
                    'Accusation Accepted',
                    `${accusationDetails.accuser.name} successfully accused ${accusationDetails.accused.name} of breaking the rule: "${accusationDetails.rule.text}"\n\n${accusationDetails.accuser.name} has no rules to give.`
                );
                setShowAccusationPopup(false);
                setAccusationDetails(null);
                setIsAccusationInProgress(false);
            }
        }
    };

    const handleDeclineAccusation = () => {
        setShowAccusationPopup(false);
        setAccusationDetails(null);
        setIsAccusationInProgress(false);
    };

    const handleGiveRuleToAccused = (ruleId: string) => {
        if (acceptedAccusationDetails) {
            // Assign the selected rule to the accused player
            assignRule(ruleId, acceptedAccusationDetails.accused.id);

            // Close the modal and reset state
            setShowRuleSelectionModal(false);
            setAcceptedAccusationDetails(null);
            setAccusationDetails(null);
            setIsAccusationInProgress(false);
        }
    };

    // Host player action handlers
    const handlePlayerTap = (player: Player) => {
        if (currentPlayer?.isHost && player.id !== currentPlayer.id) {
            setSelectedPlayerForAction(player);
            setShowPlayerActionModal(true);
        }
    };

    const handleCloneAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Find a random rule assigned to this player to clone
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                const randomRule = playerRules[Math.floor(Math.random() * playerRules.length)];
                // Create a clone by assigning the same rule to another random player
                const otherPlayers = gameState.players.filter(player =>
                    player.id !== selectedPlayerForAction.id &&
                    player.id !== randomRule.assignedTo
                );

                if (otherPlayers.length > 0) {
                    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                    // Create a new rule with the same properties but a new ID
                    const clonedRule = {
                        ...randomRule,
                        id: Math.random().toString(36).substr(2, 9),
                        assignedTo: targetPlayer.id
                    };
                    // Add the cloned rule to the game state
                    dispatch({ type: 'ADD_RULE', payload: clonedRule });
                    Alert.alert('Clone Action', `${selectedPlayerForAction.name} cloned their rule "${randomRule.text}" to ${targetPlayer.name}`);
                } else {
                    Alert.alert('No Target Available', 'No other players available to clone the rule to.');
                }
            } else {
                Alert.alert('No Rules to Clone', `${selectedPlayerForAction.name} has no assigned rules to clone.`);
            }
            setShowPlayerActionModal(false);
            setSelectedPlayerForAction(null);
        }
    };

    const handleSuccessfulPromptAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Give points first
            updatePoints(selectedPlayerForAction.id, selectedPlayerForAction.points + 2);

            // Check if player has rules to shred
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                // Show rule selection modal for shredding
                setShowPlayerActionModal(false);
                setShowShredRuleModal(true);
            } else {
                Alert.alert('Successful Prompt', `${selectedPlayerForAction.name} gained 2 points for a successful prompt!`);
                setShowPlayerActionModal(false);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const handleSuccessfulAccusationAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Give points first
            updatePoints(selectedPlayerForAction.id, selectedPlayerForAction.points + 1);

            // Show target selection modal
            setShowPlayerActionModal(false);
            setShowAccusationTargetModal(true);
        }
    };

    const handleFlipAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Find a random rule assigned to this player to flip
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                const randomRule = playerRules[Math.floor(Math.random() * playerRules.length)];
                // Flip the rule text by adding "NOT" or "DON'T" to make it opposite
                let flippedText = randomRule.text;
                if (flippedText.toLowerCase().includes('must') || flippedText.toLowerCase().includes('should') || flippedText.toLowerCase().includes('always')) {
                    flippedText = flippedText.replace(/\b(must|should|always)\b/gi, 'must NOT');
                } else if (flippedText.toLowerCase().includes('cannot') || flippedText.toLowerCase().includes('must not') || flippedText.toLowerCase().includes('never')) {
                    flippedText = flippedText.replace(/\b(cannot|must not|never)\b/gi, 'must');
                } else if (flippedText.toLowerCase().includes('don\'t') || flippedText.toLowerCase().includes('do not')) {
                    flippedText = flippedText.replace(/\b(don't|do not)\b/gi, 'must');
                } else {
                    // Default: add "NOT" at the beginning
                    flippedText = `NOT: ${flippedText}`;
                }

                // Update the rule text
                const updatedRule = { ...randomRule, text: flippedText };
                // Note: This would need a proper updateRule function in the context
                Alert.alert('Flip Action', `Flipped rule for ${selectedPlayerForAction.name}: "${flippedText}"`);
            } else {
                Alert.alert('No Rules to Flip', `${selectedPlayerForAction.name} has no assigned rules to flip.`);
            }
            setShowPlayerActionModal(false);
            setSelectedPlayerForAction(null);
        }
    };

    const handleShredRule = (ruleId: string) => {
        if (selectedPlayerForAction && gameState) {
            const rule = gameState.rules.find(r => r.id === ruleId);
            if (rule) {
                // Shred the rule by setting it as inactive and unassigned
                dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: undefined, isActive: false } });
                Alert.alert('Rule Shredded', `Shredded rule "${rule.text}" from ${selectedPlayerForAction.name}`);
            }
            setShowShredRuleModal(false);
            setSelectedPlayerForAction(null);
        }
    };

    const handleGiveRuleAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Check if there are unassigned rules available
            const availableRules = gameState.rules.filter(rule => !rule.assignedTo && rule.isActive);
            if (availableRules.length > 0) {
                setShowPlayerActionModal(false);
                setShowGiveRuleModal(true);
            } else {
                Alert.alert('No Rules Available', 'No unassigned rules available to give.');
                setShowPlayerActionModal(false);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const handleGiveRule = (ruleId: string) => {
        if (selectedPlayerForAction && gameState) {
            const rule = gameState.rules.find(r => r.id === ruleId);
            if (rule) {
                // Assign the rule to the player
                dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: selectedPlayerForAction.id } });
                Alert.alert('Rule Given', `Gave rule "${rule.text}" to ${selectedPlayerForAction.name}`);
            }
            setShowGiveRuleModal(false);
            setSelectedPlayerForAction(null);
        }
    };

    const handleAccusationTargetSelect = (targetPlayer: Player) => {
        setAccusationTarget(targetPlayer);
        setShowAccusationTargetModal(false);
        setShowAccusationRuleModal(true);
    };

    const handleAccusationRuleSelect = (ruleId: string) => {
        if (selectedPlayerForAction && accusationTarget && gameState) {
            const rule = gameState.rules.find(r => r.id === ruleId);
            if (rule) {
                // Assign the rule to the accusation target
                dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: accusationTarget.id } });
                Alert.alert('Accusation Complete', `${selectedPlayerForAction.name} successfully accused ${accusationTarget.name} and gave them the rule "${rule.text}"`);
            }
            setShowAccusationRuleModal(false);
            setSelectedPlayerForAction(null);
            setAccusationTarget(null);
        }
    };

    const handleSpinWheelForPlayer = () => {
        if (selectedPlayerForAction && currentPlayer) {
            // Store the original current player
            setOriginalCurrentPlayer(currentPlayer.id);
            // Set the current player to the selected player and navigate to wheel
            dispatch({ type: 'SET_CURRENT_PLAYER', payload: selectedPlayerForAction.id });
            setShowPlayerActionModal(false);
            setSelectedPlayerForAction(null);
            navigation.navigate('Wheel');
        }
    };

    // Show game over screen if game has ended
    if (gameState?.gameEnded && gameState?.winner) {
        return (
            <StripedBackground>
                <View style={[shared.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <OutlinedText style={{ fontSize: 48, marginBottom: 20, textAlign: 'center' }}>
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
                            color: '#000',
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
                    {/* Players Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Players</Text>
                        {gameState.players.map((player) => (
                            <TouchableOpacity
                                key={player.id}
                                style={styles.playerCard}
                                onPress={() => handlePlayerTap(player)}
                                activeOpacity={currentPlayer?.isHost && player.id !== currentPlayer.id ? 0.7 : 1}
                            >
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
                            </TouchableOpacity>
                        ))}
                    </View>



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
                <AbstractPlayerSelectionModal
                    visible={selectedRule !== null}
                    title="Assign Rule"
                    description={`Select a player to assign this rule to: "${selectedRule?.text}"`}
                    players={gameState.players}
                    onSelectPlayer={(player) => selectedRule && handleAssignRule(selectedRule, player.id)}
                    onClose={() => setSelectedRule(null)}
                />

                {/* Rule Accusation Popup */}
                <RuleAccusationPopup
                    visible={showRulePopup}
                    selectedRuleForAccusation={selectedRuleForAccusation}
                    currentPlayer={currentPlayer}
                    isAccusationInProgress={isAccusationInProgress}
                    onAccuse={handleAccuse}
                    onClose={() => setShowRulePopup(false)}
                />

                {/* Host Accusation Decision Popup */}
                <AccusationDecisionModal
                    visible={showAccusationPopup}
                    accusationDetails={accusationDetails}
                    onAccept={handleAcceptAccusation}
                    onDecline={handleDeclineAccusation}
                />

                {/* Rule Selection Modal */}
                <AbstractRuleSelectionModal
                    visible={showRuleSelectionModal}
                    title={`Give Rule to ${acceptedAccusationDetails?.accused.name}`}
                    description={`${acceptedAccusationDetails?.accuser.name} successfully accused ${acceptedAccusationDetails?.accused.name} of breaking: "${acceptedAccusationDetails?.rule.text}". Select one of your rules to give to ${acceptedAccusationDetails?.accused.name}:`}
                    rules={gameState.rules.filter(rule => rule.assignedTo === acceptedAccusationDetails?.accuser.id)}
                    onSelectRule={handleGiveRuleToAccused}
                    onClose={() => {
                        setShowRuleSelectionModal(false);
                        setAcceptedAccusationDetails(null);
                        setAccusationDetails(null);
                        setIsAccusationInProgress(false);
                    }}
                />

                {/* Host Player Action Modal */}
                <HostPlayerActionModal
                    visible={showPlayerActionModal}
                    selectedPlayerForAction={selectedPlayerForAction}
                    onSpinWheel={handleSpinWheelForPlayer}
                    onGiveRule={handleGiveRuleAction}
                    onSuccessfulPrompt={handleSuccessfulPromptAction}
                    onSuccessfulAccusation={handleSuccessfulAccusationAction}
                    onCloneRule={handleCloneAction}
                    onFlipRule={handleFlipAction}
                    onClose={() => setShowPlayerActionModal(false)}
                />

                {/* Shred Rule Modal */}
                <AbstractRuleSelectionModal
                    visible={showShredRuleModal}
                    title={`Shred a Rule from ${selectedPlayerForAction?.name}`}
                    description={`${selectedPlayerForAction?.name} gained 2 points for a successful prompt! Now select a rule to shred:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id) || []}
                    onSelectRule={handleShredRule}
                    onClose={() => {
                        setShowShredRuleModal(false);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Give Rule Modal */}
                <AbstractRuleSelectionModal
                    visible={showGiveRuleModal}
                    title={`Give Rule to ${selectedPlayerForAction?.name}`}
                    description={`Select an unassigned rule to give to ${selectedPlayerForAction?.name}:`}
                    rules={gameState?.rules.filter(rule => !rule.assignedTo && rule.isActive) || []}
                    onSelectRule={handleGiveRule}
                    onClose={() => {
                        setShowGiveRuleModal(false);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Accusation Target Selection Modal */}
                <AbstractPlayerSelectionModal
                    visible={showAccusationTargetModal}
                    title="Who is being accused?"
                    description={`${selectedPlayerForAction?.name} successfully accused someone. Select who they accused:`}
                    players={gameState?.players.filter(player => player.id !== selectedPlayerForAction?.id) || []}
                    onSelectPlayer={handleAccusationTargetSelect}
                    onClose={() => {
                        setShowAccusationTargetModal(false);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Accusation Rule Selection Modal */}
                <AccusationRuleModal
                    visible={showAccusationRuleModal}
                    selectedPlayerForAction={selectedPlayerForAction}
                    accusationTarget={accusationTarget}
                    rules={gameState?.rules || []}
                    onSelectRule={handleAccusationRuleSelect}
                    onClose={() => {
                        setShowAccusationRuleModal(false);
                        setSelectedPlayerForAction(null);
                        setAccusationTarget(null);
                    }}
                />
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
}); 