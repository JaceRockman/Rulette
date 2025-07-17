import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { ActiveAccusationDetails, Plaque as PlaqueType, Player, Prompt, Rule } from '../types/game';
import { Backdrop, OutlinedText, ScoreDisplay, PrimaryButton, Plaque, render2ColumnPlaqueList } from '../components';
import {
    SimpleModal,
    RuleDetailsModal,
    AccusationJudgementModal,
    HostActionModal,
    FlipTextInputModal,
    ExitGameModal,
    PromptPerformanceModal,
    PromptResolutionModal,
    RuleSelectionModal,
    PlayerSelectionModal,
    PromptListModal,
} from '../modals';
import socketService from '../services/socketService';
import shared from '../shared/styles';
import ModifierModals from '../modals/ModifierModals';
import { initiateClone, initiateFlip, initiateSwap, initiateUpDown } from '../modals/ModifierModals';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentUser, showExitGameModal,
        setShowExitGameModal, updatePoints, assignRule, endGame, dispatch, initiateAccusation, acceptAccusation, endAccusation, givePrompt, acceptPrompt, endPrompt, shredRule, setPlayerModal } = useGame();
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [currentModal, setCurrentModal] = useState<string | undefined>(undefined);

    const [selectedPlayerForAction, setSelectedPlayerForAction] = useState<Player | null>(null);
    const [showHostActionModal, setShowHostActionModal] = useState(false);
    const [showGiveRuleModal, setShowGiveRuleModal] = useState(false);
    const [showNewHostSelectionModal, setShowNewHostSelectionModal] = useState(false);

    // Check if all non-host players have completed both phases
    const nonHostPlayers = gameState?.players.filter(player => !player.isHost) || [];
    const allNonHostPlayersCompleted = nonHostPlayers.every(player =>
        player.rulesCompleted && player.promptsCompleted
    ) || false;

    // Update local state to current modal based on game state
    React.useEffect(() => {
        const playerModal = gameState?.players.find(player => player.id === currentUser?.id)?.currentModal;
        const globalModal = gameState?.globalModal;
        setCurrentModal(playerModal || globalModal);
    }, [gameState?.players.find(player => player.id === currentUser?.id)?.currentModal, gameState?.globalModal]);

    React.useEffect(() => {
        if (!gameState) return;
        if (gameState?.activeCloneRuleDetails === undefined || gameState?.activeCloneRuleDetails?.cloningCompleted) {
            setCurrentModal(undefined);
            gameState.globalModal = undefined;
            return;
        }
        const currentPlayerIsCloning = gameState?.activeCloneRuleDetails?.cloningPlayer.id === currentUser?.id;
        if (currentPlayerIsCloning) {
            if (gameState?.activeCloneRuleDetails?.ruleToClone === undefined) {
                setCurrentModal('CloneActionRuleSelection');
            } else if (gameState?.activeCloneRuleDetails?.targetPlayer === undefined) {
                setCurrentModal('CloneActionTargetSelection');
            } else {
                setCurrentModal('CloneActionResolution');
            }
        } else {
            if (gameState?.activeCloneRuleDetails?.ruleToClone === undefined) {
                setCurrentModal('AwaitCloneRuleSelection');
            } else if (gameState?.activeCloneRuleDetails?.targetPlayer === undefined) {
                setCurrentModal('AwaitCloneTargetSelection');
            } else {
                setCurrentModal('CloneActionResolution');
            }
        }
    }, [gameState?.activeCloneRuleDetails]);

    const handleUpdatePoints = (playerId: string, currentPoints: number, change: number) => {
        const newPoints = Math.max(0, Math.min(99, currentPoints + change));
        updatePoints(playerId, newPoints);
    };

    const handleAssignRuleToPlayer = (ruleId: string, player: Player) => {
        if (player && gameState) {
            const rule = gameState.rules.find(r => r.id === ruleId);
            if (rule) {
                assignRule(ruleId, player.id);
            } else {
                Alert.alert('Rule Not Found', `Rule with ID ${ruleId} not found.`);
            }
            setShowGiveRuleModal(false);
        }
    };

    const handleRuleTap = (rule: Rule) => {
        if (currentUser) setPlayerModal(currentUser.id, 'RuleDetails');
        setSelectedRule(rule);
    };

    const handleRuleHold = (rule: Rule, holder: Player, holdee: Player) => {
        return;
    };

    // Host player action handlers
    const handlePlayerTap = (player: Player) => {
        if (currentUser?.isHost) {
            // Check if all non-host players have completed both phases
            if (!allNonHostPlayersCompleted) {
                Alert.alert(
                    'Actions Disabled',
                    'All players must complete rules and prompts before host actions are available.',
                    [{ text: 'OK' }]
                );
                return;
            }
            setSelectedPlayerForAction(player);
            setShowHostActionModal(true);
        }
    };

    const handleGiveRuleAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Check if there are unassigned rules available

            const availableRules = gameState?.rules.filter(rule => rule.assignedTo !== selectedPlayerForAction.id);
            if (availableRules.length > 0) {
                setShowHostActionModal(false);
                setShowGiveRuleModal(true);
            } else {
                Alert.alert('No Rules Available', 'Player has all rules assigned to them already.');
                setShowHostActionModal(false);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const handleInitiateAccusation = (accusationDetails: ActiveAccusationDetails) => {
        initiateAccusation(accusationDetails);
        setSelectedRule(null);
    };

    const handleAcceptAccusation = () => {
        acceptAccusation();
        setSelectedRule(null);
    };

    const handleGivePromptAction = () => {
        setShowHostActionModal(false);
        if (currentUser) setPlayerModal(currentUser.id, 'GivePrompt');
    };

    const handlePromptRulePress = (rule: Rule) => {
        if (currentUser) setPlayerModal(currentUser.id, 'RuleDetails');
        setSelectedRule(rule);
    };






    const handleInitiateClone = () => {
        if (selectedPlayerForAction && gameState) {
            initiateClone({ gameState, cloningPlayer: selectedPlayerForAction });
        }
    };


    const handleInitiateFlip = () => {
        if (selectedPlayerForAction && gameState) {
            initiateFlip({ gameState, flippingPlayer: selectedPlayerForAction });
        }
    };


    const handleInitiateSwap = () => {
        if (selectedPlayerForAction && gameState) {
            initiateSwap({ gameState, swappingPlayer: selectedPlayerForAction });
        }
    };



    // Handle Up/Down workflow using socket-based approach
    const handleInitiateUpDown = (direction: 'up' | 'down') => {
        if (selectedPlayerForAction && gameState) {
            initiateUpDown({ gameState, direction });
        }
    };



    // Host action handlers
    const handleEndGame = () => {
        if (!gameState) return;

        // Find player with most points
        const winner = gameState.players.reduce((prev, current) =>
            (prev.points > current.points) ? prev : current
        );
        if (winner) {
            endGame();
        }
    };

    const handleSelectNewHost = () => {
        setShowNewHostSelectionModal(true);
    };

    const handleNewHostSelected = (newHost: Player) => {
        // Check if current player is being removed (they are the current host)
        const isCurrentPlayerRemoved = currentUser?.isHost;

        // Update the game state to make the selected player the new host
        dispatch({ type: 'SET_HOST', payload: newHost.id });
        setShowNewHostSelectionModal(false);

        if (isCurrentPlayerRemoved) {
            // If current player was removed, navigate to home screen
            Alert.alert('Host Changed', `${newHost.name} is now the host! You have been removed from the game.`, [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } else {
            Alert.alert('Host Changed', `${newHost.name} is now the host!`);
        }
    };

    const decrementPlayerPointsButton = (player: Player) => {
        return (
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
        );
    };

    const incrementPlayerPointsButton = (player: Player) => {
        return (
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
        );
    };

    const playerCardComponent = (player: Player) => {
        return (
            <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() => handlePlayerTap(player)}
                activeOpacity={currentUser?.isHost && player.id !== currentUser.id ? 0.7 : 1}>
                <Text style={styles.playerName}>
                    {player.name}
                </Text>

                {/* Points display - score controls only for host */}
                <View style={styles.pointsRow}>
                    {currentUser?.isHost && decrementPlayerPointsButton(player)}
                    <View style={styles.pointsContainer}>
                        <ScoreDisplay value={player.points} />
                    </View>
                    {currentUser?.isHost && incrementPlayerPointsButton(player)}
                </View>

                {/* Player's Assigned Rules */}
                {playerRulesComponent(player)}
            </TouchableOpacity>
        );
    };

    const playerRulesComponent = (player: Player) => {
        const playerRules = gameState?.rules.filter(rule => rule.assignedTo === player.id);

        return playerRules && playerRules.length > 0 ? (
            <View style={styles.playerRulesContainer}>
                <Text style={styles.playerRulesTitle}>Assigned Rules:</Text>
                {render2ColumnPlaqueList({
                    plaques: playerRules,
                    onPress: (plaque: PlaqueType) => handleRuleTap(plaque as Rule),
                })}
            </View>
        ) : null;
    };

    // Show game over screen if game has ended
    if (gameState?.gameEnded && gameState?.winner) {
        return (
            <Backdrop>
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
                        onPress={() => socketService.broadcastNavigateToScreen('HOME')}
                    >
                        <Text style={shared.buttonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </Backdrop>
        );
    }

    if (!gameState || !currentUser) {
        return (
            <Backdrop>
                <SafeAreaView style={styles.container}>
                    <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                        <View style={styles.content}>
                            <Text style={styles.errorText}>Loading game...</Text>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Backdrop>
        );
    }

    return (
        <Backdrop>
            <SafeAreaView style={shared.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>

                    {/* Host Section */}
                    {gameState.players.find(player => player.isHost) && (
                        <View style={shared.section}>
                            <OutlinedText>Host</OutlinedText>
                            {gameState.players.filter(player => player.isHost).map((player) => (
                                <TouchableOpacity
                                    key={player.id}
                                    style={styles.playerCard}
                                    onPress={() => handlePlayerTap(player)}
                                    activeOpacity={currentUser?.isHost && player.id !== currentUser.id ? 0.7 : 1}
                                >
                                    <Text style={styles.playerName}>
                                        {player.name}
                                    </Text>

                                    {/* Player's Assigned Rules */}
                                    {playerRulesComponent(player)}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Players Section */}
                    {gameState.players.filter(player => !player.isHost).length > 0 && (
                        <View style={styles.section}>
                            <OutlinedText>Players</OutlinedText>
                            {(() => {
                                // Get non-host players
                                const nonHostPlayers = gameState.players.filter(player => !player.isHost);
                                const currentUserIndex = nonHostPlayers.findIndex(p => p.id === currentUser?.id);

                                const sortedPlayers = currentUser?.isHost ? nonHostPlayers : [
                                    currentUser, // Current user first
                                    ...nonHostPlayers.slice(currentUserIndex + 1),
                                    ...nonHostPlayers.slice(0, currentUserIndex)
                                ];

                                return sortedPlayers.map((player) => (
                                    playerCardComponent(player)
                                ));
                            })()}
                        </View>
                    )}

                    {currentUser?.isHost && (
                        <View style={{ marginTop: 20, marginBottom: 20 }}>
                            <PrimaryButton
                                title="Spin That Wheel!"
                                onPress={() => socketService.broadcastNavigateToScreen('Wheel')}
                            />
                        </View>
                    )
                    }
                </ScrollView>

                {/* Rule Details Popup */}
                <RuleDetailsModal
                    visible={currentModal === 'RuleDetails'}
                    rule={selectedRule}
                    viewingPlayer={currentUser}
                    viewedPlayer={gameState?.players.find(player => player.id === selectedRule?.assignedTo) || null}
                    isAccusationInProgress={gameState?.activeAccusationDetails !== undefined && gameState?.activeAccusationDetails?.accusationAccepted === undefined}
                    onAccuse={handleInitiateAccusation}
                    onClose={() => {
                        setSelectedRule(null);
                        if (currentUser) setPlayerModal(currentUser.id, undefined);
                    }}
                />

                {/* Accusation Judgement Popup */}
                <AccusationJudgementModal
                    visible={currentModal === 'AccusationJudgement'}
                    activeAccusationDetails={gameState?.activeAccusationDetails || null}
                    currentUser={currentUser!}
                    onAccept={() => {
                        acceptAccusation();
                        setSelectedRule(null);
                    }}
                    onDecline={() => {
                        endAccusation();
                        if (currentUser) setPlayerModal(currentUser.id, undefined);
                    }}
                />

                {/* Accusation Rule Passing Modal */}
                <RuleSelectionModal
                    visible={currentModal === 'SuccessfulAccusationRuleSelection'}
                    title={`Accusation Accepted!`}
                    description={`Select a rule to give to ${gameState?.activeAccusationDetails?.accused?.name}:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeAccusationDetails?.accuser.id) || []}
                    onAccept={(rule: Rule) => {
                        endAccusation();
                        assignRule(rule.id, gameState?.activeAccusationDetails?.accused.id!);
                    }}
                    onClose={endAccusation}
                    cancelButtonText="Skip"
                />

                {/* Wait For Rule Selection Modal */}
                <SimpleModal
                    visible={currentModal === 'WaitForRuleSelection'}
                    title={`Accusation Accepted!`}
                    description={`Waiting for ${gameState?.activeAccusationDetails?.accuser.name} to select a rule to give to ${gameState?.activeAccusationDetails?.accused.name}...`}
                />

                {/* Host Action Modals */}
                <HostActionModal
                    visible={showHostActionModal}
                    selectedPlayerForAction={selectedPlayerForAction}
                    onGiveRule={handleGiveRuleAction}
                    onGivePrompt={handleGivePromptAction}
                    onCloneRule={handleInitiateClone}
                    onFlipRule={handleInitiateFlip}
                    onSwapAction={handleInitiateSwap}
                    onUpAction={() => handleInitiateUpDown('up')}
                    onDownAction={() => handleInitiateUpDown('down')}
                    onClose={() => setShowHostActionModal(false)}
                />

                {/* Rule Modals */}
                {/* Host Give Rule Modal */}
                <RuleSelectionModal
                    visible={showGiveRuleModal}
                    title={`Give Rule to ${selectedPlayerForAction?.name}`}
                    description={`Select a rule to give to ${selectedPlayerForAction?.name}:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo !== selectedPlayerForAction?.id) || []}
                    onAccept={(rule) => handleAssignRuleToPlayer(rule.id, selectedPlayerForAction!)}
                    onClose={() => {
                        setShowGiveRuleModal(false);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Prompt Modals */}
                {/* Host Prompt Selection Modal */}
                <PromptListModal
                    visible={currentModal === 'GivePrompt'}
                    title={`Select a Prompt to Give to ${selectedPlayerForAction?.name}`}
                    description={`Select a prompt to give to ${selectedPlayerForAction?.name}:`}
                    prompts={gameState?.prompts || []}
                    onAccept={(prompt: Prompt | null) => {
                        if (prompt && selectedPlayerForAction) {
                            givePrompt(prompt.id, selectedPlayerForAction.id);
                        }
                    }}
                    onClose={() => {
                        if (currentUser) setPlayerModal(currentUser.id, undefined);
                    }}
                />

                {/* Prompt Initiated Modal */}
                <PromptPerformanceModal
                    visible={currentModal === 'PromptPerformance'}
                    selectedPlayerForAction={gameState?.activePromptDetails?.selectedPlayer || null}
                    prompt={gameState?.activePromptDetails?.selectedPrompt || null}
                    onPressRule={handlePromptRulePress}
                    onSuccess={() => {
                        acceptPrompt();
                    }}
                    onFailure={() => {
                        endPrompt();
                    }}
                />

                {/* Prompt Resolution Modal */}
                <PromptResolutionModal
                    visible={currentModal === 'PromptResolution'}
                    selectedPlayerForAction={gameState?.activePromptDetails?.selectedPlayer || null}
                    prompt={gameState?.activePromptDetails?.selectedPrompt || null}
                    onShredRule={(ruleId: string) => {
                        shredRule(ruleId);
                    }}
                    onSkip={() => {
                        endPrompt();
                    }}
                />

                {/* Modifier Modals */}
                <ModifierModals
                    currentModal={currentModal || ''}
                    gameState={gameState}
                    currentUser={currentUser}
                />


                {/* Exit Game Modal */}
                <ExitGameModal
                    visible={showExitGameModal}
                    onClose={() => setShowExitGameModal(false)}
                    onEndGame={handleEndGame}
                    onSelectNewHost={handleSelectNewHost}
                />

                {/* New Host Selection Modal */}
                <PlayerSelectionModal
                    visible={showNewHostSelectionModal}
                    title="Select New Host"
                    description="Choose a player to become the new host:"
                    players={gameState?.players.filter(player => !player.isHost) || []}
                    onSelectPlayer={handleNewHostSelected}
                    onClose={() => setShowNewHostSelectionModal(false)}
                />
            </SafeAreaView>
        </Backdrop>
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
        borderRadius: 0,
        paddingHorizontal: 2,
        paddingVertical: 4,
        borderWidth: 6,
        borderColor: '#ff0000',
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
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000000',
    },
    spinButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#9b2f4d',
        textAlign: 'center',
        marginTop: 50,
    },
}); 