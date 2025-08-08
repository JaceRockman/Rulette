import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { showAlert } from '../shared/alert';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { Plaque as PlaqueType, Player, Rule } from '../types/game';
import { Backdrop, OutlinedText, ScoreDisplay, PrimaryButton, render2ColumnPlaqueList } from '../components';
import {
    HostActionModal,
    ExitGameModal,
    PlayerSelectionModal,
} from '../modals';
import socketService from '../services/socketService';
import shared from '../shared/styles';
import ModifierModals from '../modals/ModifierModals';
import { initiateClone, initiateFlip, initiateSwap, initiateUpDown } from '../modals/ModifierModals';
import PromptAndAccusationModals from '../modals/PromptAndAccusationModals';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const isFocused = useIsFocused();

    // if (!isFocused) return null;

    const { gameState, currentUser, showExitGameModal,
        setShowExitGameModal, updatePoints, endGame, dispatch, shredRule,
        triggerCloneModifier, triggerFlipModifier, triggerSwapModifier, triggerUpDownModifier, getNonHostPlayers } = useGame();

    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    const currentModal = gameState?.players.find(player => player.id === currentUser?.id)?.currentModal;
    const setCurrentModal = (modal: string | null) => {
        socketService.setPlayerModal(currentUser!.id, modal);
    }

    const logSetCurrentModal = (modal: string | null) => {
        console.log("setting current modal", modal)
        setCurrentModal(modal)
    }

    const logSetSelectedRule = (rule: Rule | null) => {
        console.log("setting selected rule", rule)
        setSelectedRule(rule)
    }

    const [selectedPlayerForAction, setSelectedPlayerForAction] = useState<Player | null>(null);
    const [showNewHostSelectionModal, setShowNewHostSelectionModal] = useState(false);

    // Check if all non-host players have completed both phases
    const nonHostPlayers = getNonHostPlayers();

    React.useEffect(() => {
        if (!gameState) return;
        if (gameState?.selectedPlayerForAction) {
            setSelectedPlayerForAction(gameState.players.find(player => player.id === gameState.selectedPlayerForAction) || null);
        }
    }, [gameState?.selectedPlayerForAction]);

    const handleRuleTap = (rule: Rule) => {
        logSetSelectedRule(rule);
        logSetCurrentModal('RuleDetails');
    };

    const handleRuleHold = (rule: Rule, holder: Player, holdee: Player) => {
        return;
    };

    // Host player action handlers
    const handlePlayerTap = (player: Player) => {
        if (currentUser?.isHost) {
            // Check if all non-host players have completed both phases
            if (!gameState?.playerInputCompleted) {
                showAlert('Actions Disabled', 'All players must complete rules and prompts before host actions are available.');
                return;
            }
            // Defensive: clear any lingering modals from previous actions
            socketService.setAllPlayerModals(null);
            socketService.setSelectedPlayerForAction(player.id);
            socketService.setPlayerModal(currentUser!.id, 'HostAction');
        }
    };

    const handleGiveRuleAction = () => {
        if (gameState?.selectedPlayerForAction !== null) {
            // Check if there are unassigned rules available

            const availableRules = gameState?.rules.filter(rule => rule.assignedTo !== gameState?.selectedPlayerForAction);
            if (availableRules && availableRules.length > 0) {
                socketService.setPlayerModal(currentUser!.id, 'GiveRule');
            } else {
                showAlert('No Rules Available', 'Player has all rules assigned to them already.');
                socketService.setPlayerModal(currentUser!.id, null);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const handleGivePromptAction = () => {
        socketService.setPlayerModal(currentUser!.id, 'GivePrompt');
    };






    const handleInitiateClone = () => {
        if (gameState?.selectedPlayerForAction !== null && gameState) {
            // Ensure no stale modals linger from previous actions
            socketService.setAllPlayerModals(null);
            const selectedPlayer = gameState.players.find(player => player.id === gameState.selectedPlayerForAction);
            if (selectedPlayer) {
                const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayer.id);
                const result = initiateClone({ cloningPlayer: selectedPlayer, playerRules: playerRules || [], triggerCloneModifier: triggerCloneModifier });
                if (result === 'failed') {
                    // Do not open any clone modals if the player has no rules to clone
                    return;
                }
                gameState.players.forEach(player => {
                    if (player.id === selectedPlayer.id) {
                        socketService.setPlayerModal(player.id, 'CloneActionRuleSelection');
                    } else {
                        socketService.setPlayerModal(player.id, 'AwaitCloneRuleSelection');
                    }
                })
            }
        }
    };


    const handleInitiateFlip = () => {
        if (gameState?.selectedPlayerForAction !== null && gameState) {
            // Ensure no stale modals linger from previous actions
            socketService.setAllPlayerModals(null);
            const selectedPlayer = gameState.players.find(player => player.id === gameState.selectedPlayerForAction);
            if (selectedPlayer) {
                const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayer.id);
                const result = initiateFlip({ flippingPlayer: selectedPlayer, playerRules: playerRules || [], triggerFlipModifier: triggerFlipModifier });
                if (result === 'failed') {
                    // Do not open any flip modals if the player has no rules to flip
                    return;
                }
                gameState.players.forEach(player => {
                    if (player.id === selectedPlayer?.id) {
                        socketService.setPlayerModal(player.id, "FlipActionRuleSelection");
                    } else {
                        socketService.setPlayerModal(player.id, "AwaitFlipRuleSelection");
                    }
                })
            }
        }
    };


    const handleInitiateSwap = () => {
        if (gameState?.selectedPlayerForAction !== null && gameState) {
            // Ensure no stale modals linger from previous actions
            socketService.setAllPlayerModals(null);
            const selectedPlayer = gameState.players.find(player => player.id === gameState.selectedPlayerForAction);
            if (selectedPlayer) {
                const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayer.id);
                const otherPlayersWithRules = gameState.players.filter(player => player.id !== selectedPlayer.id && gameState.rules.some(rule => rule.assignedTo === player.id));
                if (otherPlayersWithRules.length > 0) {
                    const result = initiateSwap({ swappingPlayer: selectedPlayer, playerRules, swappeesWithRules: otherPlayersWithRules, triggerSwapModifier: triggerSwapModifier });
                    if (result === 'failed') {
                        // Do not open any swap modals if the player has no rules to swap
                        return;
                    }
                } else {
                    showAlert('No Other Players With Rules', `No other players have rules to swap with ${selectedPlayer.name}.`);
                    return;
                }

                gameState.players.forEach(player => {
                    if (player.id === selectedPlayer?.id) {
                        socketService.setPlayerModal(player.id, "SwapperRuleSelection");
                    } else {
                        socketService.setPlayerModal(player.id, "AwaitSwapRuleSelection");
                    }
                })
            }
        }
    };



    // Handle Up/Down workflow using socket-based approach
    const handleInitiateUpDown = (direction: 'up' | 'down') => {

        if (!gameState?.players) return;

        // Ensure no stale modals linger from previous actions
        socketService.setAllPlayerModals(null);

        const nonHostPlayers = gameState.players.filter(p => !p.isHost);
        if (nonHostPlayers.length < 2) {
            showAlert('Not Enough Players', `Need at least 2 non-host players for ${direction} action.`);
            return;
        }

        // Check if any players have rules to pass
        const playersWithRules = nonHostPlayers.filter(player => {
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === player.id);
            return playerRules.length > 0;
        });

        if (playersWithRules.length === 0) {
            showAlert('No Rules to Pass', `No players have rules to pass ${direction}.`);
            return;
        }

        if (gameState?.selectedPlayerForAction !== null && gameState) {
            const selectedPlayer = gameState.players.find(player => player.id === gameState.selectedPlayerForAction);
            if (selectedPlayer) {
                initiateUpDown({ direction, triggerUpDownModifier: triggerUpDownModifier });

                gameState.players.forEach(player => {
                    const playerHasRules = gameState.rules.some(rule => rule.assignedTo === player.id);
                    if (playerHasRules && !player.isHost) {
                        socketService.setPlayerModal(player.id, "UpDownRuleSelection");
                    } else {
                        socketService.setPlayerModal(player.id, "AwaitUpDownRuleSelection");
                    }
                })
            }
        }
    };

    const handleNewHostSelected = (newHost: Player) => {
        // Check if current player is being removed (they are the current host)
        const isCurrentPlayerRemoved = currentUser?.isHost;

        // Update the game state to make the selected player the new host
        dispatch({ type: 'SET_HOST', payload: newHost.id });
        setShowNewHostSelectionModal(false);

        if (isCurrentPlayerRemoved) {
            // If current player was removed, navigate to home screen
            showAlert('Host Changed', `${newHost.name} is now the host! You have been removed from the game.`);
            navigation.navigate('Home');
        } else {
            showAlert('Host Changed', `${newHost.name} is now the host!`);
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
                onPress={() => updatePoints(player.id, -1)}
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
                onPress={() => updatePoints(player.id, 1)}
            >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>+1</Text>
            </TouchableOpacity>
        );
    };

    const playerCardComponent = (player: Player) => {
        const isActivePlayer = gameState?.activePlayer === player.id;

        return (
            <TouchableOpacity
                key={player.id}
                style={[
                    styles.playerCard,
                    isActivePlayer && { borderColor: 'green', borderWidth: 4 }
                ]}
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
                    onPress: !player.isHost ? (plaque: PlaqueType) => handleRuleTap(plaque as Rule) : undefined,
                })}
            </View>
        ) : null;
    };

    const finishPrompt = (sideEffects?: () => void) => {
        setCurrentModal(null);
        sideEffects?.();
    }

    const finishModifier = (sideEffects?: () => void) => {
        setCurrentModal(null);
        sideEffects?.();
    }

    const sortPlayersByTopPlayer = (nonHostPlayers: Player[], topPlayer: Player | null) => {
        if (!topPlayer) return nonHostPlayers;
        const topPlayerIndex = nonHostPlayers.findIndex(player => player.id === topPlayer.id);
        return [...nonHostPlayers.slice(topPlayerIndex), ...nonHostPlayers.slice(0, topPlayerIndex)];
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

    // Responsive layout: avoid relying on static SCREEN_WIDTH

    return (
        <Backdrop>
            <SafeAreaView style={shared.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>

                    {/* Host Section */}
                    <View style={shared.section}>
                        <OutlinedText>Host</OutlinedText>
                        {gameState.players.filter(player => player.isHost).map((player) => (
                            <TouchableOpacity
                                key={player.id}
                                style={[
                                    styles.playerCard,
                                    (gameState?.activePlayer === player.id) && { borderColor: 'green', borderWidth: 4 }
                                ]}
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

                    {currentUser?.isHost && (
                        <PrimaryButton
                            buttonStyle={styles.spinWheelButton}
                            textStyle={styles.spinWheelButtonText}
                            title="Spin That Wheel!"
                            onPress={() => socketService.broadcastNavigateToScreen('Wheel')}
                        />
                    )}

                    {/* Players Section */}
                    <View style={styles.section}>
                        <OutlinedText>Players</OutlinedText>
                        {(() => {
                            const topPlayer = currentUser?.isHost ? gameState.players.find(player => player.id === gameState.activePlayer) : currentUser;

                            const sortedPlayers = sortPlayersByTopPlayer(nonHostPlayers || [], topPlayer || null)

                            return sortedPlayers.map((player) => (
                                playerCardComponent(player)
                            ));
                        })()}
                    </View>
                </ScrollView>


                {/* Host Action Modals */}
                <HostActionModal
                    visible={currentModal === 'HostAction'}
                    selectedPlayerForAction={selectedPlayerForAction}
                    onGiveRule={handleGiveRuleAction}
                    onGivePrompt={handleGivePromptAction}
                    onCloneRule={handleInitiateClone}
                    onFlipRule={handleInitiateFlip}
                    onUpAction={() => handleInitiateUpDown('up')}
                    onDownAction={() => handleInitiateUpDown('down')}
                    onSwapAction={handleInitiateSwap}
                    onClose={() => {
                        // Defensive: ensure all player modals are cleared when closing host actions
                        socketService.setAllPlayerModals(null);
                        setCurrentModal(null);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Prompt and Accusation Modals */}
                <PromptAndAccusationModals
                    setCurrentModal={setCurrentModal}
                    currentModal={currentModal || ''}
                    setSelectedRule={setSelectedRule}
                    selectedRule={selectedRule}
                    currentUser={currentUser}
                    selectedPlayerForAction={selectedPlayerForAction}
                    onShredRule={(ruleId: string) => {
                        shredRule(ruleId);
                        socketService.setAllPlayerModals(null);
                        socketService.setSelectedRule(null);
                    }}
                    onFinishPrompt={finishPrompt}
                />

                {/* Modifier Modals */}
                <ModifierModals
                    setCurrentModal={setCurrentModal}
                    currentModal={currentModal || ''}
                    currentUser={currentUser}
                    onFinishModifier={finishModifier}
                />


                {/* Exit Game Modal */}
                <ExitGameModal
                    visible={showExitGameModal}
                    onClose={() => setShowExitGameModal(false)}
                    onAccept={() => { socketService.removePlayer(socketService.getCurrentUserId()!) }}
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
        alignItems: 'center',
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
    spinWheelButton: {
        width: '50%',
        height: 100,
        alignSelf: 'center',
        borderWidth: 4,
    },
    spinWheelButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        alignSelf: 'center',
    },
    playerCard: {
        width: '90%',
        maxWidth: 720,
        alignSelf: 'center',
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
        fontSize: 30,
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