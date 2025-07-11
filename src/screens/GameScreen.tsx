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
    TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { Player, Rule } from '../types/game';
import StripedBackground from '../components/Backdrop';
import { colors } from '../styles/shared';
import shared from '../styles/shared';
import OutlinedText from '../components/OutlinedText';
import DigitalClock from '../components/ScoreDisplay';
import Plaque from '../components/Plaque';
import {
    RuleAccusationPopup,
    AccusationJudgementModal,
    HostPlayerActionModal,
    HostActionModal,
    FlipTextInputModal
} from '../modals';
import RuleSelectionModal from '../modals/RuleSelectionModal';
import PlayerSelectionModal from '../modals/PlayerSelectionModal';
import socketService from '../services/socketService';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
    const navigation = useNavigation<GameScreenNavigationProp>();
    const { gameState, currentUser, activePlayer, updatePoints, assignRule, endGame, dispatch } = useGame();
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
    const [showSwapPlayerModal, setShowSwapPlayerModal] = useState(false);
    const [showSwapOwnRuleModal, setShowSwapOwnRuleModal] = useState(false);
    const [showSwapTargetRuleModal, setShowSwapTargetRuleModal] = useState(false);
    const [swapTargetPlayer, setSwapTargetPlayer] = useState<Player | null>(null);
    const [swapOwnRule, setSwapOwnRule] = useState<Rule | null>(null);
    const [showCloneRuleModal, setShowCloneRuleModal] = useState(false);
    const [showCloneTargetModal, setShowCloneTargetModal] = useState(false);
    const [cloneSelectedRule, setCloneSelectedRule] = useState<Rule | null>(null);
    const [showFlipRuleModal, setShowFlipRuleModal] = useState(false);
    const [flipSelectedRule, setFlipSelectedRule] = useState<Rule | null>(null);
    const [showUpRuleModal, setShowUpRuleModal] = useState(false);
    const [showDownRuleModal, setShowDownRuleModal] = useState(false);
    const [upDownCurrentPlayerIndex, setUpDownCurrentPlayerIndex] = useState(0);
    const [upDownAction, setUpDownAction] = useState<'up' | 'down' | null>(null);
    const [transferredRuleIds, setTransferredRuleIds] = useState<string[]>([]);
    const [upDownPlayerOrder, setUpDownPlayerOrder] = useState<Player[]>([]);
    const [showHostActionModal, setShowHostActionModal] = useState(false);
    const [showNewHostSelectionModal, setShowNewHostSelectionModal] = useState(false);


    // Restore original current user when returning from wheel
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (originalCurrentPlayer && currentUser && currentUser.id !== originalCurrentPlayer) {
                dispatch({ type: 'SET_CURRENT_USER', payload: originalCurrentPlayer });
                setOriginalCurrentPlayer(null);
            }
        });

        return unsubscribe;
    }, [navigation, originalCurrentPlayer, currentUser, dispatch]);

    // Set up custom header for host
    React.useEffect(() => {
        if (currentUser?.isHost) {
            navigation.setOptions({
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => setShowHostActionModal(true)}
                        style={{ marginLeft: 16 }}
                    >
                        <Text style={{ fontSize: 24, color: '#ffffff' }}>←</Text>
                    </TouchableOpacity>
                ),
            });
        } else {
            navigation.setOptions({
                headerLeft: undefined,
            });
        }
    }, [navigation, currentUser?.isHost]);

    // Listen for navigation events
    React.useEffect(() => {
        const handleNavigateToScreen = (data: { screen: string; params?: any }) => {
            if (data.screen === 'WHEEL') {
                // Navigate to wheel screen with the provided parameters
                navigation.navigate('Wheel', data.params || {});
            } else if (data.screen === 'GAME_ROOM') {
                // Navigate back to game room
                navigation.navigate('Game');
            } else if (data.screen === 'HOME') {
                // Navigate to home screen
                navigation.navigate('Home');
            }
        };

        socketService.setOnNavigateToScreen(handleNavigateToScreen);

        return () => {
            socketService.setOnNavigateToScreen(null);
        };
    }, [navigation]);

    // Check if all non-host players have completed both phases
    const nonHostPlayers = gameState?.players.filter(player => !player.isHost) || [];
    const allNonHostPlayersCompleted = nonHostPlayers.every(player =>
        player.rulesCompleted && player.promptsCompleted
    ) || false;

    const handleUpdatePoints = (playerId: string, currentPoints: number, change: number) => {
        const newPoints = Math.max(0, Math.min(99, currentPoints + change));
        updatePoints(playerId, newPoints);
    };



    const handleAssignRule = (rule: Rule, playerId: string) => {
        assignRule(rule.id, playerId);
        setSelectedRule(null);

        // Broadcast navigation to game room for all players and host
        socketService.broadcastNavigateToScreen('GAME_ROOM');
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
        if (selectedRuleForAccusation && currentUser) {
            setAccusationDetails({
                accuser: currentUser,
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
            handleUpdatePoints(accusationDetails.accuser.id, accusationDetails.accuser.points, 1);
            // Take point from accused
            handleUpdatePoints(accusationDetails.accused.id, accusationDetails.accused.points, -1);

            // Check if accuser has any rules to give
            const accuserRules = gameState.rules.filter(rule => rule.assignedTo === accusationDetails.accuser.id);

            if (accuserRules.length > 0) {
                // Store the accepted accusation details and show rule selection modal
                setAcceptedAccusationDetails(accusationDetails);
                setShowAccusationPopup(false);
                setShowRuleSelectionModal(true);
            } else {
                // Use shared logic for completing accusation without rules
                completeAccusationWithoutRules(accusationDetails.accuser, accusationDetails.accused, accusationDetails.rule.text);
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

            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('GAME_ROOM');
        }
    };

    // Host player action handlers
    const handlePlayerTap = (player: Player) => {
        if (currentUser?.isHost && player.id !== currentUser.id) {
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
            setShowPlayerActionModal(true);
        }
    };

    const handleCloneAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Check if player has rules to clone
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                setShowPlayerActionModal(false);
                setShowCloneRuleModal(true);
            } else {
                Alert.alert('No Rules to Clone', `${selectedPlayerForAction.name} has no assigned rules to clone.`);
                setShowPlayerActionModal(false);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const handleCloneRuleSelect = (ruleId: string) => {
        if (!selectedPlayerForAction || !gameState) return;

        const rule = gameState.rules.find(r => r.id === ruleId);
        if (!rule) return;

        setCloneSelectedRule(rule);
        setShowCloneRuleModal(false);

        // Show player selection modal for the target player
        const otherPlayers = gameState.players.filter(player =>
            player.id !== selectedPlayerForAction.id
        );
        if (otherPlayers.length === 0) {
            Alert.alert('No Target Players', 'No other players available for cloning.');
            setCloneSelectedRule(null);
            setSelectedPlayerForAction(null);
            return;
        }

        setShowCloneTargetModal(true);
    };

    const handleCloneTargetSelect = (targetPlayer: Player) => {
        if (!cloneSelectedRule || !selectedPlayerForAction) return;

        // Create a new rule with the same properties but a new ID
        const clonedRule = {
            ...cloneSelectedRule,
            id: Math.random().toString(36).substr(2, 9),
            assignedTo: targetPlayer.id
        };

        // Add the cloned rule to the game state
        dispatch({ type: 'ADD_RULE', payload: clonedRule });

        Alert.alert('Clone Complete', `${selectedPlayerForAction.name} cloned their rule "${cloneSelectedRule.text}" to ${targetPlayer.name}`);

        // Reset all clone state
        setCloneSelectedRule(null);
        setSelectedPlayerForAction(null);
        setShowCloneTargetModal(false);

        // Broadcast navigation to game room for all players and host
        socketService.broadcastNavigateToScreen('GAME_ROOM');
    };

    const handleSuccessfulPromptAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Give points first
            handleUpdatePoints(selectedPlayerForAction.id, selectedPlayerForAction.points, 2);

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
            handleUpdatePoints(selectedPlayerForAction.id, selectedPlayerForAction.points, 1);

            // Show target selection modal
            setShowPlayerActionModal(false);
            setShowAccusationTargetModal(true);
        }
    };

    const handleFlipAction = () => {
        if (selectedPlayerForAction && gameState) {
            // Check if player has rules to flip
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
            if (playerRules.length > 0) {
                setShowPlayerActionModal(false);
                setShowFlipRuleModal(true);
            } else {
                Alert.alert('No Rules to Flip', `${selectedPlayerForAction.name} has no assigned rules to flip.`);
                setShowPlayerActionModal(false);
                setSelectedPlayerForAction(null);
            }
        }
    };

    const handleFlipRuleSelect = (ruleId: string) => {
        if (!selectedPlayerForAction || !gameState) return;

        const rule = gameState.rules.find(r => r.id === ruleId);
        if (!rule) return;

        setFlipSelectedRule(rule);
        setShowFlipRuleModal(false);
    };

    const handleFlipTextSubmit = (flippedText: string) => {
        if (!flipSelectedRule || !selectedPlayerForAction) {
            Alert.alert('Error', 'No rule selected for flipping.');
            return;
        }

        // Update the rule text with the flipped version
        dispatch({
            type: 'UPDATE_RULE',
            payload: { ...flipSelectedRule, text: flippedText }
        });

        Alert.alert('Flip Complete', `Flipped rule for ${selectedPlayerForAction.name}: "${flippedText}"`);

        // Reset all flip state
        setFlipSelectedRule(null);
        setSelectedPlayerForAction(null);

        // Broadcast navigation to game room for all players and host
        socketService.broadcastNavigateToScreen('GAME_ROOM');
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

            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('GAME_ROOM');
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
                // Assign the rule to the player via socket service
                assignRule(ruleId, selectedPlayerForAction.id);
                Alert.alert('Rule Given', `Gave rule "${rule.text}" to ${selectedPlayerForAction.name}`);
            }
            setShowGiveRuleModal(false);
            setSelectedPlayerForAction(null);

            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('GAME_ROOM');
        }
    };

    const handleAccusationTargetSelect = (targetPlayer: Player) => {
        setAccusationTarget(targetPlayer);
        setShowAccusationTargetModal(false);

        // Check if the accusing player has any rules to give
        if (selectedPlayerForAction && gameState) {
            const accuserRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);

            if (accuserRules.length > 0) {
                // Show rule selection modal
                setShowAccusationRuleModal(true);
            } else {
                // Use shared logic for completing accusation without rules
                completeAccusationWithoutRules(selectedPlayerForAction, targetPlayer);
                setSelectedPlayerForAction(null);
                setAccusationTarget(null);
            }
        }
    };

    // Shared function to handle accusation completion when accuser has no rules
    const completeAccusationWithoutRules = (accuser: Player, accused: Player, ruleText?: string) => {
        // Give point to accuser
        handleUpdatePoints(accuser.id, accuser.points, 1);
        // Take point from accused
        handleUpdatePoints(accused.id, accused.points, -1);

        const ruleContext = ruleText ? ` of breaking the rule: "${ruleText}"` : '';
        Alert.alert(
            'Accusation Complete',
            `${accuser.name} successfully accused ${accused.name}${ruleContext}!\n\n${accuser.name} has no rules to give.`
        );

        // Broadcast navigation to game room for all players and host
        socketService.broadcastNavigateToScreen('GAME_ROOM');
    };

    const handleAccusationRuleSelect = (ruleId: string) => {
        if (selectedPlayerForAction && accusationTarget && gameState) {
            const rule = gameState.rules.find(r => r.id === ruleId);
            if (rule) {
                // Give point to accuser
                handleUpdatePoints(selectedPlayerForAction.id, selectedPlayerForAction.points, 1);
                // Take point from accused
                handleUpdatePoints(accusationTarget.id, accusationTarget.points, -1);

                // Assign the rule to the accusation target via socket service
                assignRule(ruleId, accusationTarget.id);
                Alert.alert('Accusation Complete', `${selectedPlayerForAction.name} successfully accused ${accusationTarget.name} and gave them the rule "${rule.text}"`);
            }
            setShowAccusationRuleModal(false);
            setSelectedPlayerForAction(null);
            setAccusationTarget(null);

            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('GAME_ROOM');
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
            setShowPlayerActionModal(false);
            return;
        }

        setUpDownAction('up');
        setUpDownCurrentPlayerIndex(0);
        setTransferredRuleIds([]);
        setUpDownPlayerOrder(playersWithRules);
        setShowPlayerActionModal(false);
        setShowUpRuleModal(true);
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
            setShowPlayerActionModal(false);
            return;
        }

        setUpDownAction('down');
        setUpDownCurrentPlayerIndex(0);
        setTransferredRuleIds([]);
        setUpDownPlayerOrder(playersWithRules);
        setShowPlayerActionModal(false);
        setShowDownRuleModal(true);
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
            setShowUpRuleModal(false);
            setShowDownRuleModal(false);

            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('GAME_ROOM');
        }
    };

    // Handle Swap action - make selected player swap rules with another player
    const handleSwapAction = () => {
        if (!selectedPlayerForAction || !gameState) return;

        // Get the selected player's rules
        const playerRules = gameState.rules.filter(rule => rule.assignedTo === selectedPlayerForAction.id);
        if (playerRules.length === 0) {
            Alert.alert('No Rules to Swap', `${selectedPlayerForAction.name} has no rules to swap.`);
            setShowPlayerActionModal(false);
            setSelectedPlayerForAction(null);
            return;
        }

        // Start the swap flow by showing the player's rules
        setShowPlayerActionModal(false);
        setShowSwapOwnRuleModal(true);
    };

    // Handler for when the first rule is selected (from the selected player)
    const handleSwapOwnRuleSelect = (ruleId: string) => {
        if (!selectedPlayerForAction || !gameState) return;

        const rule = gameState.rules.find(r => r.id === ruleId);
        if (!rule) return;

        setSwapOwnRule(rule);
        setShowSwapOwnRuleModal(false);

        // Show player selection modal for the target player
        const nonHostPlayers = gameState.players.filter(p => !p.isHost && p.id !== selectedPlayerForAction.id);
        if (nonHostPlayers.length === 0) {
            Alert.alert('No Target Players', 'No other non-host players available for swap.');
            setSwapOwnRule(null);
            setSelectedPlayerForAction(null);
            return;
        }

        setShowSwapPlayerModal(true);
    };

    // Handler for when the target player is selected
    const handleSwapPlayerSelect = (targetPlayer: Player) => {
        if (!swapOwnRule || !selectedPlayerForAction) return;

        setSwapTargetPlayer(targetPlayer);
        setShowSwapPlayerModal(false);

        // Immediately give the first rule to the target player
        assignRule(swapOwnRule.id, targetPlayer.id);

        // Show the target player's rules for selection (excluding the rule we just gave them)
        setShowSwapTargetRuleModal(true);
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
        setShowSwapTargetRuleModal(false);

        // Broadcast navigation to game room for all players and host
        socketService.broadcastNavigateToScreen('GAME_ROOM');
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
                        onPress={() => socketService.broadcastNavigateToScreen('HOME')}
                    >
                        <Text style={shared.buttonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </StripedBackground>
        );
    }

    if (!gameState || !currentUser) {
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
                    {/* Host Section */}
                    {gameState.players.find(player => player.isHost) && (
                        <View style={styles.section}>
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
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Players Section */}
                    {gameState.players.filter(player => !player.isHost).length > 0 && (
                        <View style={styles.section}>
                            <OutlinedText>Players</OutlinedText>
                            {gameState.players.filter(player => !player.isHost).map((player) => (
                                <TouchableOpacity
                                    key={player.id}
                                    style={styles.playerCard}
                                    onPress={() => handlePlayerTap(player)}
                                    activeOpacity={currentUser?.isHost && player.id !== currentUser.id ? 0.7 : 1}
                                >
                                    <Text style={styles.playerName}>
                                        {player.name}
                                    </Text>

                                    {/* Points display - score controls only for host */}
                                    <View style={styles.pointsRow}>
                                        {currentUser?.isHost ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <View style={styles.pointsContainer}>
                                                <DigitalClock value={player.points} />
                                            </View>
                                        )}
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
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Show current active player info */}
                    {gameState?.activePlayer && (
                        <View style={styles.section}>
                            <Text style={{
                                fontSize: 16,
                                color: '#e5e7eb',
                                textAlign: 'center',
                                fontStyle: 'italic',
                                marginBottom: 10
                            }}>
                                Current Turn: {gameState.players.find(p => p.id === gameState.activePlayer)?.name}
                                {currentUser?.id === gameState.activePlayer && ' (You)'}
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: '#9ca3af',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}>
                                Active Player ID: {gameState.activePlayer}
                            </Text>
                            <Text style={{
                                fontSize: 10,
                                color: '#6b7280',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}>
                                Debug: Current User ID: {currentUser?.id} | Is Active: {currentUser?.id === gameState.activePlayer ? 'YES' : 'NO'}
                            </Text>
                            <Text style={{
                                fontSize: 10,
                                color: '#6b7280',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}>
                                Debug: All Players: {gameState.players.map(p => `${p.name}(${p.id}${p.isHost ? ',H' : ''})`).join(', ')}
                            </Text>
                        </View>
                    )}


                </ScrollView>


                {/* Player Action Modals */}
                {/* Rule Accusation Popup */}
                <RuleAccusationPopup
                    visible={showRulePopup}
                    selectedRuleForAccusation={selectedRuleForAccusation}
                    currentUser={currentUser}
                    isAccusationInProgress={isAccusationInProgress}
                    onAccuse={handleAccuse}
                    onClose={() => setShowRulePopup(false)}
                />

                {/* Host Accusation Decision Popup */}
                <AccusationJudgementModal
                    visible={showAccusationPopup}
                    accusationDetails={accusationDetails}
                    onAccept={handleAcceptAccusation}
                    onDecline={handleDeclineAccusation}
                />

                {/* Give Rule Modal */}
                <RuleSelectionModal
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

                {/* Host Action Modals */}
                <HostPlayerActionModal
                    visible={showPlayerActionModal}
                    selectedPlayerForAction={selectedPlayerForAction}
                    onGiveRule={handleGiveRuleAction}
                    onSuccessfulPrompt={handleSuccessfulPromptAction}
                    onSuccessfulAccusation={handleSuccessfulAccusationAction}
                    onCloneRule={handleCloneAction}
                    onFlipRule={handleFlipAction}
                    onUpAction={handleUpAction}
                    onDownAction={handleDownAction}
                    onSwapAction={handleSwapAction}
                    onClose={() => setShowPlayerActionModal(false)}
                />

                {/* Give Rule to Player Modal */}
                <RuleSelectionModal
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

                {/* Successful Prompt Modal */}
                <RuleSelectionModal
                    visible={showShredRuleModal}
                    title={`Shred a Rule from ${selectedPlayerForAction?.name}`}
                    description={`${selectedPlayerForAction?.name} gained 2 points for a successful prompt! Now select a rule to shred:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id) || []}
                    onSelectRule={handleShredRule}
                    onClose={() => {
                        setShowShredRuleModal(false);
                        setSelectedPlayerForAction(null);
                    }}
                    cancelButtonText="None"
                />

                {/* Successful Accusation Modal */}
                <PlayerSelectionModal
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

                {/* Accusor's Rule Selection Modal */}
                <RuleSelectionModal
                    visible={showAccusationRuleModal}
                    title={`Select ${selectedPlayerForAction?.name}'s Rule to Give`}
                    description={`Choose one of ${selectedPlayerForAction?.name}'s rules to give to ${accusationTarget?.name}:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id && rule.isActive) || []}
                    onSelectRule={handleAccusationRuleSelect}
                    onClose={() => {
                        setShowAccusationRuleModal(false);
                        setSelectedPlayerForAction(null);
                        setAccusationTarget(null);
                    }}
                />

                {/* Clone Rule Modal */}
                <RuleSelectionModal
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
                />

                {/* Clone Target Selection Modal */}
                <PlayerSelectionModal
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
                />

                {/* Flip Rule Modal */}
                <RuleSelectionModal
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
                />

                {/* Flip Text Input Modal */}
                <FlipTextInputModal
                    visible={flipSelectedRule !== null}
                    selectedRule={flipSelectedRule}
                    onFlipRule={handleFlipTextSubmit}
                    onClose={() => {
                        setFlipSelectedRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Up Rule Modal */}
                <RuleSelectionModal
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
                            rule.assignedTo === currentPlayer.id &&
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
                />

                {/* Down Rule Modal */}
                <RuleSelectionModal
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
                            rule.assignedTo === currentPlayer.id &&
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
                />

                {/* Swapper Rule Selection Modal */}
                <RuleSelectionModal
                    visible={showSwapOwnRuleModal}
                    title={`Select ${selectedPlayerForAction?.name}'s Rule to Swap`}
                    description={`Choose one of ${selectedPlayerForAction?.name}'s rules to swap:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id && rule.isActive) || []}
                    onSelectRule={handleSwapOwnRuleSelect}
                    onClose={() => {
                        setShowSwapOwnRuleModal(false);
                        setSwapOwnRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Swapee Selection Modal */}
                <PlayerSelectionModal
                    visible={showSwapPlayerModal}
                    title="Select Player to Swap With"
                    description={`Choose a player to swap rules with ${selectedPlayerForAction?.name}:`}
                    players={gameState?.players.filter(player =>
                        !player.isHost &&
                        player.id !== selectedPlayerForAction?.id &&
                        gameState.rules.filter(rule => rule.assignedTo === player.id && rule.isActive).length > 0
                    ) || []}
                    onSelectPlayer={handleSwapPlayerSelect}
                    onClose={() => {
                        setShowSwapPlayerModal(false);
                        setSwapOwnRule(null);
                        setSelectedPlayerForAction(null);
                    }}
                />

                {/* Swapee Rule Selection Modal */}
                <RuleSelectionModal
                    visible={showSwapTargetRuleModal}
                    title={`Select ${swapTargetPlayer?.name}'s Rule to Swap`}
                    description={`Choose one of ${swapTargetPlayer?.name}'s rules to swap with ${selectedPlayerForAction?.name}:`}
                    rules={gameState?.rules.filter(rule =>
                        rule.assignedTo === swapTargetPlayer?.id &&
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
                />

                {/* Host Action Modal */}
                <HostActionModal
                    visible={showHostActionModal}
                    onClose={() => setShowHostActionModal(false)}
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