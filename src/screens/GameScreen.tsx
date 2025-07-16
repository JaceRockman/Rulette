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
    WaitForRuleSelectionModal,
    RuleSelectionModal,
    PlayerSelectionModal,
    PromptListModal,
} from '../modals';
import socketService from '../services/socketService';
import shared from '../shared/styles';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentUser, showExitGameModal,
        setShowExitGameModal, updatePoints, assignRule, endGame, dispatch, getAssignedRulesByPlayer, initiateAccusation, acceptAccusation, endAccusation, givePrompt, acceptPrompt, endPrompt, shredRule, setPlayerModal, updateActiveCloningDetails, endCloneRule, cloneRuleToPlayer } = useGame();
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [currentModal, setCurrentModal] = useState<string | undefined>(undefined);

    const [selectedPlayerForAction, setSelectedPlayerForAction] = useState<Player | null>(null);
    const [showHostActionModal, setShowHostActionModal] = useState(false);
    const [showGiveRuleModal, setShowGiveRuleModal] = useState(false);
    const [swapTargetPlayer, setSwapTargetPlayer] = useState<Player | null>(null);
    const [swapOwnRule, setSwapOwnRule] = useState<Rule | null>(null);
    const [upDownCurrentPlayerIndex, setUpDownCurrentPlayerIndex] = useState(0);
    const [upDownAction, setUpDownAction] = useState<'up' | 'down' | null>(null);
    const [transferredRuleIds, setTransferredRuleIds] = useState<string[]>([]);
    const [upDownPlayerOrder, setUpDownPlayerOrder] = useState<Player[]>([]);
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
        console.log('modalState', playerModal, globalModal);
        setCurrentModal(playerModal || globalModal);
    }, [gameState?.players.find(player => player.id === currentUser?.id)?.currentModal, gameState?.globalModal]);

    React.useEffect(() => {
        console.log('activeCloneRuleDetails', gameState?.activeCloneRuleDetails);
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

    const handleInitiateAccusation = (accusationDetails: ActiveAccusationDetails) => {
        console.log('accusationDetails', accusationDetails);
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
            // Check if player has rules to clone
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                setShowHostActionModal(false);
                updateActiveCloningDetails({
                    cloningPlayer: selectedPlayerForAction,
                });
                if (currentUser) setPlayerModal(currentUser.id, 'AwaitCloneRuleSelection');
            } else {
                Alert.alert('No Rules to Clone', `${selectedPlayerForAction.name} has no assigned rules to clone.`);
                setShowHostActionModal(false);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const confirmRuleForCloning = (rule: Rule) => {
        if (!gameState) return;
        updateActiveCloningDetails({
            ...gameState.activeCloneRuleDetails!,
            ruleToClone: rule
        });
        if (currentUser) setPlayerModal(currentUser.id, 'CloneActionTargetSelection');
    };

    const deselectRuleForCloning = () => {
        if (!gameState) return;
        updateActiveCloningDetails({
            ...gameState.activeCloneRuleDetails!,
            ruleToClone: undefined
        });
    };

    const confirmTargetForCloning = (player: Player) => {
        if (!gameState) return;
        updateActiveCloningDetails({
            ...gameState.activeCloneRuleDetails!,
            targetPlayer: player
        });
        cloneRuleToPlayer(gameState.activeCloneRuleDetails!.ruleToClone!, player);
        if (currentUser) setPlayerModal(currentUser.id, 'CloneActionResolution');
    };

    const handleFlipAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Check if player has rules to flip
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                setShowHostActionModal(false);
                if (currentUser) setPlayerModal(currentUser.id, 'RuleSelection');
            } else {
                Alert.alert('No Rules to Flip', `${selectedPlayerForAction.name} has no assigned rules to flip.`);
                setShowHostActionModal(false);
                setSelectedPlayerForAction(null);
            }
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

    // Handle Up action - start the modal flow
    const handleUpAction = () => {
        if (!gameState?.players) return;

        const nonHostPlayers = gameState.players.filter(p => !p.isHost);
        if (nonHostPlayers.length < 2) {
            Alert.alert('Not Enough Players', 'Need at least 2 non-host players for Up action.');
            return;
        }

        // Check if any players have rules to pass
        const playersWithRules = nonHostPlayers.filter(player => {
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === player.id && rule.isActive);
            return playerRules.length > 0;
        });

        if (playersWithRules.length === 0) {
            Alert.alert('No Rules to Pass', 'No players have rules to pass up.');
            setShowHostActionModal(false);
            return;
        }

        setUpDownAction('up');
        setUpDownCurrentPlayerIndex(0);
        setTransferredRuleIds([]);
        setUpDownPlayerOrder(playersWithRules);
        setShowHostActionModal(false);
        if (currentUser) setPlayerModal(currentUser.id, 'RuleSelection');
    };

    // Handle Down action - start the modal flow
    const handleDownAction = () => {
        if (!gameState?.players) return;

        const nonHostPlayers = gameState.players.filter(p => !p.isHost);
        if (nonHostPlayers.length < 2) {
            Alert.alert('Not Enough Players', 'Need at least 2 non-host players for Down action.');
            return;
        }

        // Check if any players have rules to pass
        const playersWithRules = nonHostPlayers.filter(player => {
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === player.id && rule.isActive);
            return playerRules.length > 0;
        });

        if (playersWithRules.length === 0) {
            Alert.alert('No Rules to Pass', 'No players have rules to pass down.');
            setShowHostActionModal(false);
            return;
        }

        setUpDownAction('down');
        setUpDownCurrentPlayerIndex(0);
        setTransferredRuleIds([]);
        setUpDownPlayerOrder(playersWithRules);
        setShowHostActionModal(false);
        if (currentUser) setPlayerModal(currentUser.id, 'RuleSelection');
    };

    // Helper to get players with rules left to pass
    const getRuleAssignedPlayers = () => {
        if (!gameState?.players) return [];
        const nonHostPlayers = gameState.players.filter(p => !p.isHost);
        return nonHostPlayers.filter(player =>
            gameState.rules.some(rule =>
                rule.assignedTo === player.id &&
                rule.isActive &&
                !transferredRuleIds.includes(rule.id)
            )
        );
    };

    // Handle rule selection for Up/Down actions
    const handleUpDownRuleSelect = (ruleId: string) => {
        if (!gameState?.players || upDownAction === null) return;
        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
        if (!currentPlayer) return;
        const rule = gameState.rules.find(r => r.id === ruleId);
        if (!rule) return;
        // Find the target player (above or below)
        const playerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
        let targetPlayerIndex: number;
        if (upDownAction === 'up') {
            targetPlayerIndex = playerIndex - 1;
            while (targetPlayerIndex >= 0 && gameState.players[targetPlayerIndex].isHost) {
                targetPlayerIndex--;
            }
            if (targetPlayerIndex < 0) {
                targetPlayerIndex = gameState.players.length - 1;
                while (targetPlayerIndex >= 0 && gameState.players[targetPlayerIndex].isHost) {
                    targetPlayerIndex--;
                }
            }
        } else {
            targetPlayerIndex = playerIndex + 1;
            while (targetPlayerIndex < gameState.players.length && gameState.players[targetPlayerIndex].isHost) {
                targetPlayerIndex++;
            }
            if (targetPlayerIndex >= gameState.players.length) {
                targetPlayerIndex = 0;
                while (targetPlayerIndex < gameState.players.length && gameState.players[targetPlayerIndex].isHost) {
                    targetPlayerIndex++;
                }
            }
        }
        if (targetPlayerIndex < 0 || targetPlayerIndex >= gameState.players.length) return;
        const targetPlayer = gameState.players[targetPlayerIndex];
        assignRule(ruleId, targetPlayer.id);
        setTransferredRuleIds(prev => [...prev, ruleId]);
        let nextPlayerIndex = upDownCurrentPlayerIndex + 1;
        if (nextPlayerIndex < upDownPlayerOrder.length) {
            setUpDownCurrentPlayerIndex(nextPlayerIndex);
        } else {
            const actionName = upDownAction === 'up' ? 'Up' : 'Down';
            Alert.alert(`${actionName} Action Complete`, `All players have passed their rules ${upDownAction}.`);
            setUpDownAction(null);
            setUpDownCurrentPlayerIndex(0);
            setTransferredRuleIds([]);
            setUpDownPlayerOrder([]);
            if (currentUser) setPlayerModal(currentUser.id, undefined);

            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('Game');
        }
    };

    // Handle Swap action - make selected player swap rules with another player
    const handleSwapAction = () => {
        if (!selectedPlayerForAction || !gameState) return;

        // Get the selected player's rules
        const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
        if (playerRules.length === 0) {
            Alert.alert('No Rules to Swap', `${selectedPlayerForAction.name} has no rules to swap.`);
            setShowHostActionModal(false);
            setSelectedPlayerForAction(null);
            return;
        }

        // Start the swap flow by showing the player's rules
        setShowHostActionModal(false);
        if (currentUser) setPlayerModal(currentUser.id, 'RuleSelection');
    };

    // Handler for when the first rule is selected (from the selected player)
    const handleSwapOwnRuleSelect = (ruleId: string) => {
        if (!selectedPlayerForAction || !gameState) return;

        const rule = gameState.rules.find(r => r.id === ruleId);
        if (!rule) return;

        setSwapOwnRule(rule);
        if (currentUser) setPlayerModal(currentUser.id, undefined);

        // Show player selection modal for the target player
        const nonHostPlayers = gameState.players.filter(p => !p.isHost && p.id !== selectedPlayerForAction.id);
        if (nonHostPlayers.length === 0) {
            Alert.alert('No Target Players', 'No other non-host players available for swap.');
            setSwapOwnRule(null);
            setSelectedPlayerForAction(null);
            return;
        }

        if (currentUser) setPlayerModal(currentUser.id, 'SwapPlayerSelection');
    };

    // Handler for when the target player is selected
    const handleSwapPlayerSelect = (targetPlayer: Player) => {
        if (!swapOwnRule || !selectedPlayerForAction) return;

        setSwapTargetPlayer(targetPlayer);
        if (currentUser) setPlayerModal(currentUser.id, undefined);

        // Immediately give the first rule to the target player
        assignRule(swapOwnRule.id, targetPlayer.id);

        // Show the target player's rules for selection (excluding the rule we just gave them)
        if (currentUser) setPlayerModal(currentUser.id, 'RuleSelection');
    };

    // Handler for when the target rule is selected
    const handleSwapTargetRuleSelect = (ruleId: string) => {
        if (!swapOwnRule || !swapTargetPlayer || !selectedPlayerForAction || !gameState) return;

        const targetRule = gameState.rules.find(r => r.id === ruleId);
        if (!targetRule) return;

        // Immediately give the target rule to the original player
        assignRule(targetRule.id, selectedPlayerForAction.id);

        Alert.alert('Swap Complete', `${selectedPlayerForAction.name} swapped "${swapOwnRule.text}" with ${swapTargetPlayer.name}'s "${targetRule.text}"!`);

        // Reset all swap state
        setSwapOwnRule(null);
        setSwapTargetPlayer(null);
        setSelectedPlayerForAction(null);
        if (currentUser) setPlayerModal(currentUser.id, undefined);

        // Broadcast navigation to game room for all players and host
        socketService.broadcastNavigateToScreen('Game');
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
                    onAccept={handleAcceptAccusation}
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
                <WaitForRuleSelectionModal
                    visible={currentModal === 'WaitForRuleSelection'}
                    accuser={gameState?.activeAccusationDetails?.accuser || null}
                    accused={gameState?.activeAccusationDetails?.accused || null}
                />

                {/* Host Action Modals */}
                <HostActionModal
                    visible={showHostActionModal}
                    selectedPlayerForAction={selectedPlayerForAction}
                    onGiveRule={handleGiveRuleAction}
                    onGivePrompt={handleGivePromptAction}
                    onCloneRule={handleInitiateClone}
                    onFlipRule={handleFlipAction}
                    onUpAction={handleUpAction}
                    onDownAction={handleDownAction}
                    onSwapAction={handleSwapAction}
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
                        givePrompt(prompt?.id!, selectedPlayerForAction?.id!)
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

                {/* Clone Rule Modals */}
                {/* Clone Action Selection Modal */}
                <RuleSelectionModal
                    visible={currentModal === 'CloneActionRuleSelection'}
                    title={`Select a Rule to Clone`}
                    description={`Choose one of your rules to clone:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeCloneRuleDetails?.cloningPlayer.id && rule.isActive) || []}
                    onAccept={confirmRuleForCloning}
                    onClose={endCloneRule}
                />

                {/* Clone Target Selection Modal */}
                <PlayerSelectionModal
                    visible={currentModal === 'CloneActionTargetSelection'}
                    title={`Select Recipient`}
                    description={`Choose a player to give the copied rule to:`}
                    players={gameState?.players.filter(player => {
                        return player.id !== gameState?.activeCloneRuleDetails?.cloningPlayer.id
                            && !player.isHost
                    }) || []}
                    onSelectPlayer={confirmTargetForCloning}
                    onClose={deselectRuleForCloning}
                    cancelButtonText="Back"
                />

                {/* Await Clone Rule Selection Modal */}
                <SimpleModal
                    visible={currentModal === 'AwaitCloneRuleSelection'}
                    title={'Clone Rule'}
                    description={`Waiting for ${gameState?.activeCloneRuleDetails?.cloningPlayer.name} to select a rule to clone...`}
                />

                {/* Await Clone Target Selection Modal */}
                <SimpleModal
                    visible={currentModal === 'AwaitCloneTargetSelection'}
                    title={'Clone Rule'}
                    description={`Waiting for ${gameState?.activeCloneRuleDetails?.cloningPlayer.name} to select a recipient for the copied rule...`}
                    content={
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Plaque
                                plaque={gameState?.activeCloneRuleDetails?.ruleToClone!}
                            />
                        </View>
                    }
                />

                {/* Clone Action Resolution Modal */}
                <SimpleModal
                    visible={currentModal === 'CloneActionResolution'}
                    title={'Clone Rule'}
                    description={`${gameState?.activeCloneRuleDetails?.cloningPlayer.name} has cloned the following rule and given it to ${gameState?.activeCloneRuleDetails?.targetPlayer?.name}!`}
                    content={
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Plaque
                                plaque={gameState?.activeCloneRuleDetails?.ruleToClone!}
                            />
                        </View>
                    }
                    onAccept={endCloneRule}
                    acceptButtonText="Ok"
                    acceptButtonDisplayed={currentUser?.id === gameState?.activeCloneRuleDetails?.targetPlayer?.id}
                />




                {/* Clone Rule Modal */}
                {/* <RuleSelectionModal
                    visible={showCloneRuleModal}
                    title={`Select ${selectedPlayerForAction?.name}'s Rule to Clone`}
                    description={`Choose one of ${selectedPlayerForAction?.name}'s rules to clone:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id && rule.isActive) || []}
                    onSelectRule={handleCloneRuleSelect}
                    onClose={() => {
                        setShowCloneRuleModal(false);
                        setCloneSelectedRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

                {/* Clone Target Selection Modal */}
                {/* <PlayerSelectionModal
                    visible={showCloneTargetModal}
                    title="Select Player to Clone Rule To"
                    description={`Choose a player to give a copy of "${cloneSelectedRule?.text}" to:`}
                    players={gameState?.players.filter(player => player.id !== selectedPlayerForAction?.id) || []}
                    onSelectPlayer={handleCloneTargetSelect}
                    onClose={() => {
                        setShowCloneTargetModal(false);
                        setCloneSelectedRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

                {/* Flip Rule Modal */}
                {/* <RuleSelectionModal
                    visible={showFlipRuleModal}
                    title={`Select ${selectedPlayerForAction?.name}'s Rule to Flip`}
                    description={`Choose one of ${selectedPlayerForAction?.name}'s rules to flip/negate:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id && rule.isActive) || []}
                    onSelectRule={handleFlipRuleSelect}
                    onClose={() => {
                        setShowFlipRuleModal(false);
                        setFlipSelectedRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

                {/* Flip Text Input Modal */}
                {/* <FlipTextInputModal
                    visible={flipSelectedRule !== null}
                    selectedRule={flipSelectedRule}
                    onFlipRule={handleFlipTextSubmit}
                    onClose={() => {
                        setFlipSelectedRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

                {/* Up Rule Modal */}
                {/* <RuleSelectionModal
                    visible={showUpRuleModal}
                    title={`Which rule would you like to send to ${(() => {
                        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
                        if (!currentPlayer) return '';
                        const playerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
                        let targetPlayerIndex = playerIndex - 1;
                        while (targetPlayerIndex >= 0 && gameState.players[targetPlayerIndex].isHost) {
                            targetPlayerIndex--;
                        }
                        if (targetPlayerIndex < 0) {
                            targetPlayerIndex = gameState.players.length - 1;
                            while (targetPlayerIndex >= 0 && gameState.players[targetPlayerIndex].isHost) {
                                targetPlayerIndex--;
                            }
                        }
                        return gameState.players[targetPlayerIndex]?.name || '';
                    })()}?`}
                    description={`${(() => {
                        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
                        return currentPlayer?.name || '';
                    })()}'s rules:`}
                    rules={(() => {
                        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
                        if (!currentPlayer) return [];
                        return gameState.rules.filter(rule =>
                            rule.assignedTo?.id === currentPlayer.id &&
                            rule.isActive &&
                            !transferredRuleIds.includes(rule.id)
                        );
                    })()}
                    onSelectRule={handleUpDownRuleSelect}
                    onClose={() => {
                        setShowUpRuleModal(false);
                        setUpDownAction(null);
                        setUpDownCurrentPlayerIndex(0);
                        setTransferredRuleIds([]);
                        setUpDownPlayerOrder([]);
                    }}
                /> */}

                {/* Down Rule Modal */}
                {/* <RuleSelectionModal
                    visible={showDownRuleModal}
                    title={`Which rule would you like to send to ${(() => {
                        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
                        if (!currentPlayer) return '';
                        const playerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
                        let targetPlayerIndex = playerIndex + 1;
                        while (targetPlayerIndex < gameState.players.length && gameState.players[targetPlayerIndex].isHost) {
                            targetPlayerIndex++;
                        }
                        if (targetPlayerIndex >= gameState.players.length) {
                            targetPlayerIndex = 0;
                            while (targetPlayerIndex < gameState.players.length && gameState.players[targetPlayerIndex].isHost) {
                                targetPlayerIndex++;
                            }
                        }
                        return gameState.players[targetPlayerIndex]?.name || '';
                    })()}?`}
                    description={`${(() => {
                        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
                        return currentPlayer?.name || '';
                    })()}'s rules:`}
                    rules={(() => {
                        const currentPlayer = upDownPlayerOrder[upDownCurrentPlayerIndex];
                        if (!currentPlayer) return [];
                        return gameState.rules.filter(rule =>
                            rule.assignedTo?.id === currentPlayer.id &&
                            rule.isActive &&
                            !transferredRuleIds.includes(rule.id)
                        );
                    })()}
                    onSelectRule={handleUpDownRuleSelect}
                    onClose={() => {
                        setShowDownRuleModal(false);
                        setUpDownAction(null);
                        setUpDownCurrentPlayerIndex(0);
                        setTransferredRuleIds([]);
                        setUpDownPlayerOrder([]);
                    }}
                /> */}

                {/* Swapper Rule Selection Modal */}
                {/* <RuleSelectionModal
                    visible={showSwapOwnRuleModal}
                    title={`Select ${selectedPlayerForAction?.name}'s Rule to Swap`}
                    description={`Choose one of ${selectedPlayerForAction?.name}'s rules to swap:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo?.id === selectedPlayerForAction?.id && rule.isActive) || []}
                    onSelectRule={handleSwapOwnRuleSelect}
                    onClose={() => {
                        setShowSwapOwnRuleModal(false);
                        setSwapOwnRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

                {/* Swapee Selection Modal */}
                {/* <PlayerSelectionModal
                    visible={showSwapPlayerModal}
                    title="Select Player to Swap With"
                    description={`Choose a player to swap rules with ${selectedPlayerForAction?.name}:`}
                    players={gameState?.players.filter(player =>
                        !player.isHost &&
                        player.id !== selectedPlayerForAction?.id &&
                        gameState.rules.filter(rule => rule.assignedTo?.id === player.id && rule.isActive).length > 0
                    ) || []}
                    onSelectPlayer={handleSwapPlayerSelect}
                    onClose={() => {
                        setShowSwapPlayerModal(false);
                        setSwapOwnRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

                {/* Swapee Rule Selection Modal */}
                {/* <RuleSelectionModal
                    visible={showSwapTargetRuleModal}
                    title={`Select ${swapTargetPlayer?.name}'s Rule to Swap`}
                    description={`Choose one of ${swapTargetPlayer?.name}'s rules to swap with ${selectedPlayerForAction?.name}:`}
                    rules={gameState?.rules.filter(rule =>
                        rule.assignedTo?.id === swapTargetPlayer?.id &&
                        rule.isActive &&
                        rule.id !== swapOwnRule?.id
                    ) || []}
                    onSelectRule={handleSwapTargetRuleSelect}
                    onClose={() => {
                        setShowSwapTargetRuleModal(false);
                        setSwapOwnRule(null);
                        setSwapTargetPlayer(null);
                        setSelectedPlayerForAction(null);
                    }}
                /> */}

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