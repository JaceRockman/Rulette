import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, FlatList, Dimensions, SafeAreaView, PanResponder, GestureResponderEvent, PanResponderGestureState, Modal, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../shared/styles';
import StripedBackground from '../components/Backdrop';
import OutlinedText from '../components/OutlinedText';
import WheelSegment from '../components/WheelSegment';
import {
    FlipTextInputModal,
    PlayerSelectionModal,
    RuleSelectionModal,
    SwapModal,
    EndGameConfirmationModal,
    CloneWorkflowModal,
    FlipWorkflowModal,
    UpDownWorkflowModal,
    SwapWorkflowModal,
    ShredWorkflowModal
} from '../modals';
import socketService from '../services/socketService';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type WheelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wheel'>;
type WheelScreenRouteProp = RouteProp<RootStackParamList, 'Wheel'>;

export default function WheelScreen() {
    const navigation = useNavigation<WheelScreenNavigationProp>();
    const route = useRoute<WheelScreenRouteProp>();
    const { gameState, removeWheelLayer, endGame, updatePoints, cloneRuleToPlayer, shredRule, dispatch, assignRule } = useGame();

    // Get the player ID from navigation params if provided
    const playerId = route.params?.playerId;

    // Note: We don't set the active player here - the server manages it
    // The playerId param is just for reference to know who is spinning
    // Workflow modal states
    const [showCloneWorkflowModal, setShowCloneWorkflowModal] = useState(false);
    const [showFlipWorkflowModal, setShowFlipWorkflowModal] = useState(false);
    const [showUpWorkflowModal, setShowUpWorkflowModal] = useState(false);
    const [showDownWorkflowModal, setShowDownWorkflowModal] = useState(false);
    const [showSwapWorkflowModal, setShowSwapWorkflowModal] = useState(false);
    const [showShredWorkflowModal, setShowShredWorkflowModal] = useState(false);

    // Legacy modal states (keeping for compatibility)
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showClonePlayerModal, setShowClonePlayerModal] = useState(false);
    const [showFlipModal, setShowFlipModal] = useState(false);
    const [showFlipTextInputModal, setShowFlipTextInputModal] = useState(false);
    const [showShredModal, setShowShredModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [selectedRuleForClone, setSelectedRuleForClone] = useState<{ rule: any; player: any } | null>(null);
    const [selectedRuleForFlip, setSelectedRuleForFlip] = useState<any>(null);
    const [swapStep, setSwapStep] = useState<'selectOwnRule' | 'selectOtherRule'>('selectOwnRule');
    const [selectedOwnRule, setSelectedOwnRule] = useState<any>(null);
    const [selectedOtherPlayer, setSelectedOtherPlayer] = useState<any>(null);
    const [showEndGameConfirmationModal, setShowEndGameConfirmationModal] = useState(false);
    const [isEndGameActionInProgress, setIsEndGameActionInProgress] = useState(false);
    const [hasProcessedEndSegment, setHasProcessedEndSegment] = useState(false);

    // Use wheel segments from game state
    const segments = gameState?.wheelSegments || [];

    // If no segments exist and game is started, create them
    React.useEffect(() => {
        if (gameState?.isGameStarted && segments.length === 0 && gameState.rules.length > 0 && gameState.prompts.length > 0) {
            // Create wheel segments if they don't exist
            dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });
        }
    }, [gameState?.isGameStarted, segments.length, gameState?.rules.length, gameState?.prompts.length]);

    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [showExpandedPlaque, setShowExpandedPlaque] = useState(false);
    const [showPromptButtons, setShowPromptButtons] = useState(false);
    const [isClosingPopup, setIsClosingPopup] = useState(false);
    const [frozenSegment, setFrozenSegment] = useState<any>(null);
    const [synchronizedSpinResult, setSynchronizedSpinResult] = useState<{ finalIndex: number; showPopup: boolean } | null>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const currentScrollOffset = useRef(0);
    const wheelContainerRef = useRef<View>(null);
    const [wheelHeight, setWheelHeight] = useState(0);
    const currentRotation = useRef(0);
    const popupScale = useRef(new Animated.Value(0)).current;
    const popupOpacity = useRef(new Animated.Value(0)).current;
    const [hasAdvancedPlayer, setHasAdvancedPlayer] = useState(false);

    // Pad the segments so the selected item can be centered and create a continuous loop
    const paddedSegments = [
        // Add the last few segments at the beginning
        ...segments.slice(-Math.floor(VISIBLE_ITEMS / 2)),
        // Add the actual segments
        ...segments,
        // Add the first few segments at the end
        ...segments.slice(0, Math.floor(VISIBLE_ITEMS / 2)),
    ];

    // Listen for synchronized wheel spin events
    React.useEffect(() => {
        const handleSynchronizedSpin = (data: { spinningPlayerId: string; finalIndex: number; scrollAmount: number; duration: number }) => {
            // Only perform the spin if we're not already spinning
            if (!isSpinning) {
                performSynchronizedSpin(data.finalIndex, data.scrollAmount, data.duration);
            }
        };

        socketService.setOnSynchronizedWheelSpin(handleSynchronizedSpin);

        return () => {
            socketService.setOnSynchronizedWheelSpin(null);
        };
    }, [isSpinning]);

    // Listen for end game continue events
    React.useEffect(() => {
        const handleEndGameContinue = () => {
            console.log('WheelScreen: Received end game continue broadcast');
            // Close the popup for all players when host chooses to continue
            const selectedSegment = segments[selectedIndex];
            setFrozenSegment(selectedSegment);
            setIsClosingPopup(true);

            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(popupOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Don't remove the wheel layer - keep it for the next spin
                setShowExpandedPlaque(false);
                setIsClosingPopup(false);
                setFrozenSegment(null);
                setSynchronizedSpinResult(null);
                setSelectedIndex(0); // Reset wheel index
                flatListRef.current?.scrollToOffset({ offset: 0, animated: false }); // Reset visual position
                scrollY.setValue(0); // Reset the Animated.Value to sync with visual position
                currentScrollOffset.current = 0; // Reset the current offset tracking
                console.log('WheelScreen: End game continue popup closed and wheel reset');
            });
        };

        socketService.setOnEndGameContinue(handleEndGameContinue);

        return () => {
            socketService.setOnEndGameContinue(null);
        };
    }, [selectedIndex, segments]);

    // Listen for end game end events
    React.useEffect(() => {
        const handleEndGameEnd = () => {
            console.log('WheelScreen: Received end game end broadcast');
            // Close the popup and end the game for all players when host chooses to end
            const selectedSegment = segments[selectedIndex];
            setFrozenSegment(selectedSegment);
            setIsClosingPopup(true);

            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(popupOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                if (selectedSegment) {
                    removeWheelLayer(selectedSegment.id);
                }
                setShowExpandedPlaque(false);
                setIsClosingPopup(false);
                setFrozenSegment(null);
                setSynchronizedSpinResult(null);
                popupScale.setValue(0);
                popupOpacity.setValue(0);

                // Find player with most points and end the game
                const winner = gameState?.players.reduce((prev, current) =>
                    (prev.points > current.points) ? prev : current
                );
                if (winner) {
                    endGame();
                    // Navigate to game room to show game over screen
                    socketService.broadcastNavigateToScreen('GAME_ROOM');
                }
                console.log('WheelScreen: End game end popup closed');
            });
        };

        socketService.setOnEndGameEnd(handleEndGameEnd);

        return () => {
            socketService.setOnEndGameEnd(null);
        };
    }, [selectedIndex, segments, gameState?.players]);

    // Check if game has ended
    React.useEffect(() => {
        if (gameState?.gameEnded && gameState?.winner) {
            // Navigate to game screen to show the game over screen
            socketService.broadcastNavigateToScreen('GAME_ROOM');
        }
    }, [gameState?.gameEnded, gameState?.winner, navigation]);

    // Handle end segment modal logic - moved to popup content logic to avoid immediate triggering

    // Memoize current player info to avoid repeated function calls during render
    const currentPlayerInfo = React.useMemo(() => {
        const currentClientId = socketService.getCurrentPlayerId();
        const currentPlayer = gameState?.players.find(p => p.id === currentClientId);
        return {
            id: currentClientId,
            player: currentPlayer,
            isHost: currentPlayer?.isHost || false
        };
    }, [gameState?.players]);

    // Handle end segment modal triggering
    React.useEffect(() => {
        const selectedSegment = isClosingPopup ? frozenSegment : segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
        const currentLayer = selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0];

        if (currentLayer && currentLayer.type === 'end' && showExpandedPlaque) {
            const isHost = currentPlayerInfo.isHost;

            if (isHost && !showEndGameConfirmationModal && !isEndGameActionInProgress && !hasProcessedEndSegment) {
                // Use setTimeout to avoid React state update during render
                setTimeout(() => {
                    setHasProcessedEndSegment(true);
                    setShowEndGameConfirmationModal(true);
                }, 0);
            }
        }
    }, [showExpandedPlaque, selectedIndex, synchronizedSpinResult, isClosingPopup, frozenSegment, segments, currentPlayerInfo, showEndGameConfirmationModal, isEndGameActionInProgress, hasProcessedEndSegment]);

    const handleSpin = () => {
        // Check if the current player is the active player
        const currentClientId = socketService.getCurrentPlayerId();
        const isActivePlayer = gameState?.activePlayer === currentClientId;

        if (!isActivePlayer) {
            // Only the active player can spin the wheel
            return;
        }

        setIsSpinning(true);
        setHasAdvancedPlayer(false); // Reset the flag for new spin
        setHasProcessedEndSegment(false); // Reset the end segment processing flag for new spin

        // Generate random final index
        const randomSpins = 40 + Math.floor(Math.random() * 11);
        const scrollAmount = randomSpins * ITEM_HEIGHT;
        const finalIndex = (selectedIndex + randomSpins) % segments.length;
        const duration = 3000 + Math.random() * 2000; // 3-5 seconds

        // Broadcast the synchronized spin to all players
        socketService.broadcastSynchronizedWheelSpin(finalIndex, scrollAmount, duration);

        // Perform the spin locally
        performSynchronizedSpin(finalIndex, scrollAmount, duration);
    };

    const performSynchronizedSpin = (finalIndex: number, scrollAmount: number, duration: number) => {
        setIsSpinning(true);
        setSelectedIndex(finalIndex);
        setHasProcessedEndSegment(false); // Reset the end segment processing flag for all players

        // Animate the scroll with a "spin" effect - always go top to bottom
        Animated.timing(scrollY, {
            toValue: currentScrollOffset.current + scrollAmount,
            duration: duration,
            useNativeDriver: true,
            easing: t => 1 - Math.pow(1 - t, 3), // ease out
        }).start(() => {
            setIsSpinning(false);
            // Snap to the final position, centered in the wheel
            const centerOffset = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
            const finalScroll = (finalIndex * ITEM_HEIGHT) + centerOffset;
            flatListRef.current?.scrollToOffset({ offset: finalScroll, animated: false });

            // Store the selected segment for later processing
            const selectedSegment = segments[finalIndex];
            // Don't process the layer yet - wait until popup is closed

            // Set synchronized spin result for all players to see the popup
            setSynchronizedSpinResult({ finalIndex, showPopup: true });

            // Show expanded plaque after a short delay
            setTimeout(() => {
                setShowExpandedPlaque(true);
                // Animate the popup expansion
                Animated.parallel([
                    Animated.timing(popupScale, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                        easing: t => 1 - Math.pow(1 - t, 3), // ease out
                    }),
                    Animated.timing(popupOpacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();
            }, 500);
        });
    };

    // Sync the FlatList scroll position with the animation
    React.useEffect(() => {
        const id = scrollY.addListener(({ value }) => {
            currentScrollOffset.current = value;

            // Use a smoother offset calculation to prevent flickering
            const wheelHeight = segments.length * ITEM_HEIGHT;
            let offset = value % wheelHeight;
            if (offset < 0) offset += wheelHeight;

            flatListRef.current?.scrollToOffset({ offset, animated: false });

            // Reset scrollY when it gets too large, but only when not spinning
            if (!isSpinning && value > segments.length * ITEM_HEIGHT * 10) {
                const resetValue = value % (segments.length * ITEM_HEIGHT);
                scrollY.setValue(resetValue);
                currentScrollOffset.current = resetValue;
            }
        });
        return () => scrollY.removeListener(id);
    }, [scrollY, segments.length, isSpinning]);

    // PanResponder for swipe-to-spin
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => {
                // Only allow the active player to start pan gestures
                const currentClientId = socketService.getCurrentPlayerId();
                const isActivePlayer = gameState?.activePlayer === currentClientId;
                return isActivePlayer;
            },
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only allow the active player to move pan gestures
                const currentClientId = socketService.getCurrentPlayerId();
                const isActivePlayer = gameState?.activePlayer === currentClientId;
                return isActivePlayer && Math.abs(gestureState.dy) > 10;
            },
            onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                if (gestureState.dy > 30 && !isSpinning) {
                    handleSpin();
                }
            },
        })
    ).current;

    // Handle Up modifier - pass rule to player above
    const handleUpModifier = () => {
        if (!gameState?.activePlayer || !gameState?.players) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.activePlayer);
        if (!currentPlayer || currentPlayer.isHost) {
            alert('Host players cannot use the Up modifier.');
            return;
        }

        // Find current player's index in the players array
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.activePlayer);
        if (currentPlayerIndex === -1) return;

        // Find the player above (previous in array, excluding host)
        let targetPlayerIndex = currentPlayerIndex - 1;
        while (targetPlayerIndex >= 0 && gameState.players[targetPlayerIndex].isHost) {
            targetPlayerIndex--;
        }

        if (targetPlayerIndex < 0) {
            // Wrap around to the end, excluding host
            targetPlayerIndex = gameState.players.length - 1;
            while (targetPlayerIndex >= 0 && gameState.players[targetPlayerIndex].isHost) {
                targetPlayerIndex--;
            }
        }

        if (targetPlayerIndex < 0) {
            alert('No valid target player found.');
            return;
        }

        const targetPlayer = gameState.players[targetPlayerIndex];

        // Find a random rule assigned to current player
        const currentPlayerRules = gameState.rules.filter(rule => rule.assignedTo === currentPlayer.id && rule.isActive);
        if (currentPlayerRules.length === 0) {
            alert('You have no rules to pass up.');
            return;
        }

        const randomRule = currentPlayerRules[Math.floor(Math.random() * currentPlayerRules.length)];

        // Assign the rule to the target player
        assignRule(randomRule.id, targetPlayer.id);

        alert(`${currentPlayer.name} passed the rule "${randomRule.text}" up to ${targetPlayer.name}!`);

        // Use centralized wheel completion function
        handleWheelCompletion();
    };

    // Handle Down modifier - pass rule to player below
    const handleDownModifier = () => {
        if (!gameState?.activePlayer || !gameState?.players) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.activePlayer);
        if (!currentPlayer || currentPlayer.isHost) {
            alert('Host players cannot use the Down modifier.');
            return;
        }

        // Find current player's index in the players array
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.activePlayer);
        if (currentPlayerIndex === -1) return;

        // Find the player below (next in array, excluding host)
        let targetPlayerIndex = currentPlayerIndex + 1;
        while (targetPlayerIndex < gameState.players.length && gameState.players[targetPlayerIndex].isHost) {
            targetPlayerIndex++;
        }

        if (targetPlayerIndex >= gameState.players.length) {
            // Wrap around to the beginning, excluding host
            targetPlayerIndex = 0;
            while (targetPlayerIndex < gameState.players.length && gameState.players[targetPlayerIndex].isHost) {
                targetPlayerIndex++;
            }
        }

        if (targetPlayerIndex >= gameState.players.length) {
            alert('No valid target player found.');
            return;
        }

        const targetPlayer = gameState.players[targetPlayerIndex];

        // Find a random rule assigned to current player
        const currentPlayerRules = gameState.rules.filter(rule => rule.assignedTo === currentPlayer.id && rule.isActive);
        if (currentPlayerRules.length === 0) {
            alert('You have no rules to pass down.');
            return;
        }

        const randomRule = currentPlayerRules[Math.floor(Math.random() * currentPlayerRules.length)];

        // Assign the rule to the target player
        assignRule(randomRule.id, targetPlayer.id);

        alert(`${currentPlayer.name} passed the rule "${randomRule.text}" down to ${targetPlayer.name}!`);

        // Use centralized wheel completion function
        handleWheelCompletion();
    };

    const handleFlipRuleSelect = (ruleId: string) => {
        const rule = gameState?.rules.find(r => r.id === ruleId);
        if (rule) {
            setSelectedRuleForFlip(rule);
            setShowFlipModal(false);
            setShowFlipTextInputModal(true);
        }
    };

    const handleFlipTextSubmit = (flippedText: string) => {
        if (!selectedRuleForFlip) return;

        // Update the rule text with the flipped version
        dispatch({
            type: 'UPDATE_RULE',
            payload: { ...selectedRuleForFlip, text: flippedText }
        });

        // Freeze the current segment to prevent content from changing during animation
        const selectedSegment = segments[selectedIndex];
        setFrozenSegment(selectedSegment);
        setIsClosingPopup(true);

        // Use centralized wheel completion function
        handleWheelCompletion();

        // Reset flip state
        setSelectedRuleForFlip(null);
        setShowFlipTextInputModal(false);
    };

    // Centralized function to handle wheel completion and ensure advanceToNextPlayer is called only once
    const handleWheelCompletion = () => {
        // Freeze the current segment to prevent content from changing during animation
        const selectedSegment = segments[selectedIndex];
        setFrozenSegment(selectedSegment);
        setIsClosingPopup(true);

        // Close the wheel popup and navigate back
        Animated.parallel([
            Animated.timing(popupScale, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(popupOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            if (selectedSegment) {
                removeWheelLayer(selectedSegment.id);
            }
            setShowExpandedPlaque(false);
            setIsClosingPopup(false);
            setFrozenSegment(null);
            setSynchronizedSpinResult(null);
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            // Broadcast navigation to game room for all players and host
            socketService.broadcastNavigateToScreen('GAME_ROOM');

            // Advance to next player after wheel spinning is complete (only once)
            if (!hasAdvancedPlayer) {
                console.log('WheelScreen: Calling advanceToNextPlayer() at:', new Date().toISOString());
                console.log('WheelScreen: Current activePlayer:', gameState?.activePlayer);
                socketService.advanceToNextPlayer();
                setHasAdvancedPlayer(true);
            } else {
                console.log('WheelScreen: Skipping advanceToNextPlayer() - already advanced at:', new Date().toISOString());
            }
        });
    };

    // Workflow modal handlers
    const handleCloneComplete = (sourceRule: any, targetPlayer: any) => {
        // Create a new rule with the same properties but a new ID
        const clonedRule = {
            ...sourceRule,
            id: Math.random().toString(36).substr(2, 9),
            assignedTo: targetPlayer.id
        };

        // Add the cloned rule to the game state
        dispatch({ type: 'ADD_RULE', payload: clonedRule });

        alert(`${sourceRule.assignedTo ? gameState?.players.find(p => p.id === sourceRule.assignedTo)?.name : 'Unknown'} cloned their rule "${sourceRule.text}" to ${targetPlayer.name}`);

        setShowCloneWorkflowModal(false);

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            handleWheelCompletion();
        }, 0);
    };

    const handleFlipComplete = (originalRule: any, flippedText: string) => {
        // Update the rule text with the flipped version
        dispatch({
            type: 'UPDATE_RULE',
            payload: { ...originalRule, text: flippedText }
        });

        alert(`Flipped rule: "${flippedText}"`);

        setShowFlipWorkflowModal(false);

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            handleWheelCompletion();
        }, 0);
    };

    const handleUpDownComplete = (sourceRule: any, targetPlayer: any, direction: 'up' | 'down') => {
        // Assign the rule to the target player
        assignRule(sourceRule.id, targetPlayer.id);

        const actionName = direction === 'up' ? 'passed up' : 'passed down';
        alert(`${gameState?.players.find(p => p.id === sourceRule.assignedTo)?.name} ${actionName} the rule "${sourceRule.text}" to ${targetPlayer.name}!`);

        if (direction === 'up') {
            setShowUpWorkflowModal(false);
        } else {
            setShowDownWorkflowModal(false);
        }

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            handleWheelCompletion();
        }, 0);
    };

    const handleSwapComplete = (ownRule: any, targetRule: any, targetPlayer: any) => {
        // Swap the rules
        assignRule(ownRule.id, targetPlayer.id);
        assignRule(targetRule.id, gameState?.activePlayer || '');

        alert(`${gameState?.players.find(p => p.id === gameState?.activePlayer)?.name} swapped "${ownRule.text}" with ${targetPlayer.name}'s "${targetRule.text}"!`);

        setShowSwapWorkflowModal(false);

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            handleWheelCompletion();
        }, 0);
    };

    const handleShredComplete = (rule: any) => {
        // Shred the rule by setting it as inactive and unassigned
        dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: undefined, isActive: false } });

        alert(`Shredded rule "${rule.text}"`);

        setShowShredWorkflowModal(false);

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            handleWheelCompletion();
        }, 0);
    };

    // Legacy handlers (keeping for compatibility):
    const handleCloneRuleSelect = (rule: any, player: any) => {
        setSelectedRuleForClone({ rule, player });
        setShowCloneModal(false);
        setShowClonePlayerModal(true);
    };

    const handleClonePlayerSelect = (player: any) => {
        if (selectedRuleForClone) {
            cloneRuleToPlayer(selectedRuleForClone.rule.id, player.id);
        }
        setShowClonePlayerModal(false);

        // Freeze the current segment to prevent content from changing during animation
        const selectedSegment = segments[selectedIndex];
        setFrozenSegment(selectedSegment);
        setIsClosingPopup(true);

        // Close the wheel popup and navigate back
        Animated.parallel([
            Animated.timing(popupScale, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(popupOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            if (selectedSegment) {
                removeWheelLayer(selectedSegment.id);
            }
            setShowExpandedPlaque(false);
            setIsClosingPopup(false);
            setFrozenSegment(null);
            setSynchronizedSpinResult(null);
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            socketService.broadcastNavigateToScreen('GAME_ROOM');

            // Advance to next player after wheel spinning is complete (only once)
            if (!hasAdvancedPlayer) {
                socketService.advanceToNextPlayer();
                setHasAdvancedPlayer(true);
            }
        });
    };

    const handleSwapOwnRuleSelect = (rule: any) => {
        setSelectedOwnRule(rule);
        setSwapStep('selectOtherRule');
    };

    const handleSwapOtherPlayerSelect = (player: any) => {
        setSelectedOtherPlayer(player);
    };

    const handleSwapOtherRuleSelect = (rule: any) => {
        // Perform the swap
        if (selectedOwnRule && gameState?.activePlayer) {
            // Swap the rules
            assignRule(selectedOwnRule.id, selectedOtherPlayer.id);
            assignRule(rule.id, gameState.activePlayer);

            alert(`${gameState.players.find(p => p.id === gameState.activePlayer)?.name} swapped "${selectedOwnRule.text}" with ${selectedOtherPlayer.name}'s "${rule.text}"!`);

            setShowSwapModal(false);

            // Freeze the current segment to prevent content from changing during animation
            const selectedSegment = segments[selectedIndex];
            setFrozenSegment(selectedSegment);
            setIsClosingPopup(true);

            // Close the wheel popup and navigate back
            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(popupOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                if (selectedSegment) {
                    removeWheelLayer(selectedSegment.id);
                }
                setShowExpandedPlaque(false);
                setIsClosingPopup(false);
                setFrozenSegment(null);
                setSynchronizedSpinResult(null);
                popupScale.setValue(0);
                popupOpacity.setValue(0);
                socketService.broadcastNavigateToScreen('GAME_ROOM');

                // Advance to next player after wheel spinning is complete (only once)
                if (!hasAdvancedPlayer) {
                    socketService.advanceToNextPlayer();
                    setHasAdvancedPlayer(true);
                }
            });
        }
    };

    const handleShredRuleSelect = (rule: any) => {
        shredRule(rule.id);
        setShowShredModal(false);

        // Freeze the current segment to prevent content from changing during animation
        const selectedSegment = segments[selectedIndex];
        setFrozenSegment(selectedSegment);
        setIsClosingPopup(true);

        // Close the wheel popup and navigate back
        Animated.parallel([
            Animated.timing(popupScale, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(popupOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            if (selectedSegment) {
                removeWheelLayer(selectedSegment.id);
            }
            setShowExpandedPlaque(false);
            setIsClosingPopup(false);
            setFrozenSegment(null);
            setSynchronizedSpinResult(null);
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            socketService.broadcastNavigateToScreen('GAME_ROOM');

            // Advance to next player after wheel spinning is complete (only once)
            if (!hasAdvancedPlayer) {
                socketService.advanceToNextPlayer();
                setHasAdvancedPlayer(true);
            }
        });
    };

    // Handle end game confirmation - continue game
    const handleContinueGame = () => {
        console.log('WheelScreen: Host chose to continue game');
        console.log('WheelScreen: isEndGameActionInProgress:', isEndGameActionInProgress);

        // Prevent multiple button presses
        if (isEndGameActionInProgress) {
            console.log('WheelScreen: Action already in progress, ignoring button press');
            return;
        }

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            setIsEndGameActionInProgress(true);
            setShowEndGameConfirmationModal(false);

            // Broadcast continue action to all players
            console.log('WheelScreen: Broadcasting end game continue');
            socketService.broadcastEndGameContinue();

            // Close the wheel popup without removing the layer or advancing the player
            const selectedSegment = segments[selectedIndex];
            setFrozenSegment(selectedSegment);
            setIsClosingPopup(true);

            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(popupOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Don't remove the wheel layer - keep it for the next spin
                setShowExpandedPlaque(false);
                setIsClosingPopup(false);
                setFrozenSegment(null);
                setSynchronizedSpinResult(null);
                popupScale.setValue(0);
                popupOpacity.setValue(0);
                setIsEndGameActionInProgress(false);
                setSelectedIndex(0); // Reset wheel index
                flatListRef.current?.scrollToOffset({ offset: 0, animated: false }); // Reset visual position
                scrollY.setValue(0); // Reset the Animated.Value to sync with visual position
                currentScrollOffset.current = 0; // Reset the current offset tracking
                console.log('WheelScreen: Continue game popup closed and wheel reset');
            });
        }, 0);
    };

    // Handle end game confirmation - end game
    const handleEndGame = () => {
        console.log('WheelScreen: Host chose to end game');
        console.log('WheelScreen: isEndGameActionInProgress:', isEndGameActionInProgress);

        // Prevent multiple button presses
        if (isEndGameActionInProgress) {
            console.log('WheelScreen: Action already in progress, ignoring button press');
            return;
        }

        // Use setTimeout to avoid React state update during render
        setTimeout(() => {
            setIsEndGameActionInProgress(true);
            setShowEndGameConfirmationModal(false);

            // Broadcast end action to all players
            console.log('WheelScreen: Broadcasting end game end');
            socketService.broadcastEndGameEnd();

            // Close the wheel popup
            const selectedSegment = segments[selectedIndex];
            setFrozenSegment(selectedSegment);
            setIsClosingPopup(true);

            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(popupOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                if (selectedSegment) {
                    removeWheelLayer(selectedSegment.id);
                }
                setShowExpandedPlaque(false);
                setIsClosingPopup(false);
                setFrozenSegment(null);
                setSynchronizedSpinResult(null);
                popupScale.setValue(0);
                popupOpacity.setValue(0);
                setIsEndGameActionInProgress(false);

                // Find player with most points and end the game
                const winner = gameState?.players.reduce((prev, current) =>
                    (prev.points > current.points) ? prev : current
                );
                if (winner) {
                    endGame();
                    // Navigate to game room to show game over screen
                    socketService.broadcastNavigateToScreen('GAME_ROOM');
                }
            });
        }, 0);
    };

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <View style={styles.mainContainer}>
                    <View style={{ height: 90 }} />
                    <View
                        ref={wheelContainerRef}
                        style={[
                            styles.wheelContainer,
                            { height: ITEM_HEIGHT * VISIBLE_ITEMS, width: '70%' } // dynamic height and width inline
                        ]}
                        onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            setWheelHeight(height);
                        }}
                        {...panResponder.panHandlers}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={paddedSegments}
                            keyExtractor={(_, idx) => idx.toString()}
                            inverted={true}
                            renderItem={({ item, index }) => {
                                // Calculate the actual segment index for wrapped segments
                                let actualIndex: number;
                                if (index < Math.floor(VISIBLE_ITEMS / 2)) {
                                    // Wrapped segments at the beginning (last few segments)
                                    actualIndex = segments.length - Math.floor(VISIBLE_ITEMS / 2) + index;
                                } else if (index >= segments.length + Math.floor(VISIBLE_ITEMS / 2)) {
                                    // Wrapped segments at the end (first few segments)
                                    actualIndex = index - (segments.length + Math.floor(VISIBLE_ITEMS / 2));
                                } else {
                                    // Regular segments in the middle
                                    actualIndex = index - Math.floor(VISIBLE_ITEMS / 2);
                                }

                                const segment = segments[actualIndex];
                                const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];

                                return (
                                    <WheelSegment
                                        currentPlaque={currentLayer}
                                        color={segment?.color || '#fff'}
                                    />
                                );
                            }}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            getItemLayout={(_, idx) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * idx, index: idx })}
                        />

                        {/* Top fade overlay - gradient effect */}
                        <View
                            style={[
                                styles.fadeOverlay,
                                { top: 0 }
                            ]}
                        >
                            {[1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map((opacity, i) => (
                                <View key={i} style={{ height: 12, backgroundColor: 'black', opacity }} />
                            ))}
                        </View>

                        {/* Bottom fade overlay - gradient effect */}
                        <View
                            style={[
                                styles.fadeOverlay,
                                { bottom: 0 }
                            ]}
                        >
                            {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((opacity, i) => (
                                <View key={i} style={{ height: 12, backgroundColor: 'black', opacity }} />
                            ))}
                        </View>
                    </View>

                    {/* Tick mark positioned outside the wheel container */}
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.tickMarkContainer,
                            { top: '50%', right: '16%' } // keep percentage-based values inline
                        ]}
                    >
                        <View
                            style={styles.tickMarkBlack}
                        />
                        <View
                            style={styles.tickMarkRed}
                        />
                    </Animated.View>
                </View>

                {/* Expanded plaque overlay */}
                {(showExpandedPlaque || synchronizedSpinResult?.showPopup) && (
                    <View
                        style={styles.expandedPlaqueOverlay}
                    >
                        <Animated.View
                            style={{
                                backgroundColor: (() => {
                                    const segment = segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    return currentLayer?.content?.plaqueColor || segment?.plaqueColor || '#fff';
                                })(),
                                borderRadius: 20,
                                padding: 40,
                                margin: 20,
                                width: '90%',
                                maxHeight: '60%',
                                borderWidth: 4,
                                borderColor: '#000',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                transform: [{ scale: popupScale }],
                                opacity: popupOpacity,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    marginBottom: 20,
                                    color: (() => {
                                        const segment = isClosingPopup ? frozenSegment : segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                        const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                        const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                    })(),
                                }}
                            >
                                {(() => {
                                    const segment = isClosingPopup ? frozenSegment : segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    if (!currentLayer) return 'NO CONTENT';

                                    switch (currentLayer.type) {
                                        case 'rule': return 'RULE';
                                        case 'prompt': return 'PROMPT';
                                        case 'modifier': return 'MODIFIER';
                                        case 'end': return 'END SEGMENT';
                                        default: return 'CONTENT';
                                    }
                                })()}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 18,
                                    textAlign: 'center',
                                    color: (() => {
                                        const segment = isClosingPopup ? frozenSegment : segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                        const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                        const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                    })(),
                                    lineHeight: 26,
                                }}
                            >
                                {(() => {
                                    const segment = isClosingPopup ? frozenSegment : segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    if (!currentLayer) return 'No content available';

                                    if (typeof currentLayer.content === 'string') {
                                        return currentLayer.content;
                                    }
                                    return currentLayer.content.text || 'No content available';
                                })()}
                            </Text>
                            {(() => {
                                const selectedSegment = isClosingPopup ? frozenSegment : segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                const currentLayer = selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0];

                                if (currentLayer && currentLayer.type === 'end') {
                                    // For end segments, show confirmation modal for host or waiting message for others
                                    // Use memoized player info to avoid React errors
                                    const isHost = currentPlayerInfo.isHost;

                                    console.log('WheelScreen: isHost:', isHost);

                                    if (isHost) {
                                        // Show confirmation modal for host - modal is triggered by useEffect
                                        // Return a minimal view to prevent React errors
                                        return (
                                            <View style={{ marginTop: 30, alignItems: 'center' }}>
                                                <Text style={{
                                                    color: '#666',
                                                    fontSize: 16,
                                                    textAlign: 'center',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Processing end game decision...
                                                </Text>
                                            </View>
                                        );
                                    } else {
                                        // Non-host players see waiting message
                                        console.log('WheelScreen: Non-host player');
                                        return (
                                            <View style={{ marginTop: 30, alignItems: 'center' }}>
                                                <Text style={{
                                                    color: '#666',
                                                    fontSize: 16,
                                                    textAlign: 'center',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Waiting for host to decide whether to continue or end the game...
                                                </Text>
                                            </View>
                                        );
                                    }
                                } else if (currentLayer && currentLayer.type === 'prompt') {
                                    // Get spinning player's rules (always use the active player)
                                    const spinningPlayerId = gameState?.activePlayer;
                                    const spinningPlayer = gameState?.players.find(p => p.id === spinningPlayerId);
                                    const playerRules = gameState?.rules.filter(rule => rule.assignedTo === spinningPlayer?.id && rule.isActive) || [];

                                    return (
                                        <View style={{ width: '100%' }}>
                                            {/* Rules Reminder Section */}
                                            {playerRules.length > 0 && (
                                                <View style={{ marginTop: 20, marginBottom: 20 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            fontWeight: 'bold',
                                                            textAlign: 'center',
                                                            marginBottom: 15,
                                                            color: (() => {
                                                                const segment = isClosingPopup ? frozenSegment : segments[selectedIndex];
                                                                const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                                                const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                                                return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                                            })(),
                                                        }}
                                                    >
                                                        Just as a reminder, these are your current rules:
                                                    </Text>
                                                    <ScrollView
                                                        horizontal
                                                        showsHorizontalScrollIndicator={false}
                                                        contentContainerStyle={{ paddingHorizontal: 10 }}
                                                    >
                                                        {playerRules.map((rule, index) => (
                                                            <View
                                                                key={rule.id}
                                                                style={styles.ruleButton}
                                                            >
                                                                <Text
                                                                    style={styles.ruleButtonText}
                                                                >
                                                                    {rule.text}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}

                                            {/* Success/Failure Buttons */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 }}>
                                                {/* Only show buttons for the host */}
                                                {(() => {
                                                    const currentClientId = socketService.getCurrentPlayerId();
                                                    const isHost = gameState?.players.find(p => p.id === currentClientId)?.isHost;

                                                    if (!isHost) {
                                                        return (
                                                            <View style={{ flex: 1, alignItems: 'center' }}>
                                                                <Text style={{
                                                                    color: '#666',
                                                                    fontSize: 16,
                                                                    textAlign: 'center',
                                                                    fontStyle: 'italic'
                                                                }}>
                                                                    Waiting for host to judge the prompt...
                                                                </Text>
                                                            </View>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <TouchableOpacity
                                                                style={{
                                                                    backgroundColor: '#28a745',
                                                                    paddingHorizontal: 30,
                                                                    paddingVertical: 15,
                                                                    borderRadius: 10,
                                                                    flex: 1,
                                                                    marginRight: 10,
                                                                }}
                                                                onPress={() => {
                                                                    // Give 2 points for success
                                                                    if (gameState?.activePlayer) {
                                                                        const currentPlayer = gameState.players.find(p => p.id === gameState.activePlayer);
                                                                        if (currentPlayer) {
                                                                            updatePoints(currentPlayer.id, currentPlayer.points + 2);
                                                                        }
                                                                    }

                                                                    // Show shred workflow modal instead of closing immediately
                                                                    setShowShredWorkflowModal(true);
                                                                }}
                                                            >
                                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                                                                    SUCCESS (+2)
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={{
                                                                    backgroundColor: '#dc3545',
                                                                    paddingHorizontal: 30,
                                                                    paddingVertical: 15,
                                                                    borderRadius: 10,
                                                                    flex: 1,
                                                                    marginLeft: 10,
                                                                }}
                                                                onPress={() => {
                                                                    // No points lost for failure

                                                                    // Freeze the current segment to prevent content from changing during animation
                                                                    setFrozenSegment(selectedSegment);
                                                                    setIsClosingPopup(true);

                                                                    // Animate the popup closing
                                                                    Animated.parallel([
                                                                        Animated.timing(popupScale, {
                                                                            toValue: 0,
                                                                            duration: 400,
                                                                            useNativeDriver: true,
                                                                        }),
                                                                        Animated.timing(popupOpacity, {
                                                                            toValue: 0,
                                                                            duration: 300,
                                                                            useNativeDriver: true,
                                                                        })
                                                                    ]).start(() => {
                                                                        // Remove the current layer to reveal the next one
                                                                        removeWheelLayer(selectedSegment.id);
                                                                        setShowExpandedPlaque(false);
                                                                        setIsClosingPopup(false);
                                                                        setFrozenSegment(null);
                                                                        setSynchronizedSpinResult(null);
                                                                        popupScale.setValue(0);
                                                                        popupOpacity.setValue(0);
                                                                        socketService.broadcastNavigateToScreen('GAME_ROOM');

                                                                        // Advance to next player after wheel spinning is complete (only once)
                                                                        if (!hasAdvancedPlayer) {
                                                                            socketService.advanceToNextPlayer();
                                                                            setHasAdvancedPlayer(true);
                                                                        }
                                                                    });
                                                                }}
                                                            >
                                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                                                                    FAILURE (0)
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </>
                                                    );
                                                })()}
                                            </View>
                                        </View>
                                    );
                                } else if (currentLayer && currentLayer.type === 'modifier' && typeof currentLayer.content === 'string') {
                                    // Only show modifier buttons for the active player (spinning player)
                                    const spinningPlayerId = gameState?.activePlayer;
                                    const currentClientId = socketService.getCurrentPlayerId();
                                    const isActivePlayer = spinningPlayerId === currentClientId;

                                    if (!isActivePlayer) {
                                        return (
                                            <View style={{ marginTop: 30, alignItems: 'center' }}>
                                                <Text style={{
                                                    color: '#666',
                                                    fontSize: 16,
                                                    textAlign: 'center',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Waiting for {gameState?.players.find(p => p.id === spinningPlayerId)?.name} to use modifier...
                                                </Text>
                                            </View>
                                        );
                                    }

                                    if (currentLayer.content === 'Clone') {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#28a745',
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 15,
                                                    borderRadius: 10,
                                                    marginTop: 30,
                                                    alignSelf: 'center',
                                                }}
                                                onPress={() => {
                                                    setShowCloneWorkflowModal(true);
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    SELECT RULE TO CLONE
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    } else if (currentLayer.content === 'Flip') {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#ffc107',
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 15,
                                                    borderRadius: 10,
                                                    marginTop: 30,
                                                    alignSelf: 'center',
                                                }}
                                                onPress={() => {
                                                    setShowFlipWorkflowModal(true);
                                                }}
                                            >
                                                <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>
                                                    SELECT RULE TO FLIP
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    } else if (currentLayer.content === 'Up') {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#17a2b8',
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 15,
                                                    borderRadius: 10,
                                                    marginTop: 30,
                                                    alignSelf: 'center',
                                                }}
                                                onPress={() => {
                                                    setShowUpWorkflowModal(true);
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    PASS RULE UP
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    } else if (currentLayer.content === 'Down') {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#6f42c1',
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 15,
                                                    borderRadius: 10,
                                                    marginTop: 30,
                                                    alignSelf: 'center',
                                                }}
                                                onPress={() => {
                                                    setShowDownWorkflowModal(true);
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    PASS RULE DOWN
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    } else if (currentLayer.content === 'Swap') {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#fd7e14',
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 15,
                                                    borderRadius: 10,
                                                    marginTop: 30,
                                                    alignSelf: 'center',
                                                }}
                                                onPress={() => {
                                                    setShowSwapWorkflowModal(true);
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    SWAP RULES
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }
                                } else {
                                    // Only show CLOSE button for the active player (spinning player) and not for end segments
                                    const spinningPlayerId = gameState?.activePlayer;
                                    const currentClientId = socketService.getCurrentPlayerId();
                                    const isActivePlayer = spinningPlayerId === currentClientId;
                                    const selectedSegment = segments[synchronizedSpinResult?.finalIndex ?? selectedIndex];
                                    const currentLayer = selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0];

                                    // Don't show close button for end segments
                                    if (currentLayer && currentLayer.type === 'end') {
                                        return null;
                                    }

                                    if (!isActivePlayer) {
                                        return (
                                            <View style={{ marginTop: 30, alignItems: 'center' }}>
                                                <Text style={{
                                                    color: '#666',
                                                    fontSize: 16,
                                                    textAlign: 'center',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Waiting for {gameState?.players.find(p => p.id === spinningPlayerId)?.name} to close...
                                                </Text>
                                            </View>
                                        );
                                    }

                                    return (
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#000',
                                                paddingHorizontal: 30,
                                                paddingVertical: 15,
                                                borderRadius: 10,
                                                marginTop: 30,
                                                alignSelf: 'center',
                                            }}
                                            onPress={() => {
                                                // Handle the selected segment before closing
                                                const selectedSegment = segments[selectedIndex];
                                                if (selectedSegment) {
                                                    const currentLayer = selectedSegment.layers[selectedSegment.currentLayerIndex];

                                                    // Handle rule assignment
                                                    if (currentLayer && currentLayer.type === 'rule') {
                                                        // Assign the rule to the spinning player (not the current player)
                                                        if (typeof currentLayer.content !== 'string' && currentLayer.content.id) {
                                                            const spinningPlayerId = gameState?.activePlayer;
                                                            if (spinningPlayerId) {
                                                                assignRule(currentLayer.content.id, spinningPlayerId);
                                                            }
                                                            // Remove the wheel layer since the rule has been assigned
                                                            if (selectedSegment) {
                                                                removeWheelLayer(selectedSegment.id);
                                                            }
                                                        }
                                                    }
                                                }

                                                // Freeze the current segment to prevent content from changing during animation
                                                setFrozenSegment(selectedSegment);
                                                setIsClosingPopup(true);

                                                // Animate the popup closing
                                                Animated.parallel([
                                                    Animated.timing(popupScale, {
                                                        toValue: 0,
                                                        duration: 400,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.timing(popupOpacity, {
                                                        toValue: 0,
                                                        duration: 300,
                                                        useNativeDriver: true,
                                                    })
                                                ]).start(() => {
                                                    // Check if the game has ended before proceeding
                                                    if (gameState?.gameEnded) {
                                                        // Game has ended, don't advance or navigate
                                                        setShowExpandedPlaque(false);
                                                        setIsClosingPopup(false);
                                                        setFrozenSegment(null);
                                                        setSynchronizedSpinResult(null);
                                                        popupScale.setValue(0);
                                                        popupOpacity.setValue(0);
                                                        return;
                                                    }

                                                    // Remove the current layer to reveal the next one (only if not already removed for rule assignment)
                                                    if (selectedSegment) {
                                                        const currentLayer = selectedSegment.layers[selectedSegment.currentLayerIndex];
                                                        if (currentLayer && currentLayer.type !== 'end' && currentLayer.type !== 'rule') {
                                                            removeWheelLayer(selectedSegment.id);
                                                        }
                                                    }
                                                    setShowExpandedPlaque(false);
                                                    setIsClosingPopup(false);
                                                    setFrozenSegment(null);
                                                    setSynchronizedSpinResult(null);
                                                    popupScale.setValue(0);
                                                    popupOpacity.setValue(0);
                                                    // Broadcast navigation to game room for all players and host
                                                    socketService.broadcastNavigateToScreen("GAME_ROOM");

                                                    // Advance to next player after wheel spinning is complete (only once)
                                                    if (!hasAdvancedPlayer) {
                                                        socketService.advanceToNextPlayer();
                                                        setHasAdvancedPlayer(true);
                                                    }
                                                });
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                CLOSE
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }
                            })()}
                        </Animated.View>
                    </View>
                )}

                <RuleSelectionModal
                    visible={showCloneModal}
                    title="Select Rule to Clone"
                    description={(() => {
                        const currentPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === gameState?.activePlayer && rule.isActive);
                        if (currentPlayerRules && currentPlayerRules.length > 0) {
                            return "Choose one of your rules to give to another player";
                        } else {
                            return "Choose any rule to give to another player";
                        }
                    })()}
                    rules={(() => {
                        const currentPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === gameState?.activePlayer && rule.isActive);
                        if (currentPlayerRules && currentPlayerRules.length > 0) {
                            return currentPlayerRules;
                        } else {
                            return gameState?.rules.filter(rule => rule.assignedTo && rule.isActive) || [];
                        }
                    })()}
                    onSelectRule={(ruleId) => {
                        const rule = gameState?.rules.find(r => r.id === ruleId);
                        const player = gameState?.players.find(p => p.id === rule?.assignedTo);
                        handleCloneRuleSelect(rule, player);
                    }}
                    onClose={() => setShowCloneModal(false)}
                />
                <PlayerSelectionModal
                    visible={showClonePlayerModal}
                    title="Select Player to Give Rule To"
                    description={`Choose who to give "${selectedRuleForClone?.rule.text}" to`}
                    players={gameState?.players || []}
                    onSelectPlayer={handleClonePlayerSelect}
                    onClose={() => setShowClonePlayerModal(false)}
                />
                <SwapModal
                    visible={showSwapModal}
                    onClose={() => {
                        setShowSwapModal(false);
                        setSwapStep('selectOwnRule');
                        setSelectedOwnRule(null);
                        setSelectedOtherPlayer(null);
                    }}
                    onOwnRuleSelect={handleSwapOwnRuleSelect}
                    onOtherPlayerSelect={handleSwapOtherPlayerSelect}
                    onOtherRuleSelect={handleSwapOtherRuleSelect}
                    swapStep={swapStep}
                    selectedOwnRule={selectedOwnRule}
                    selectedOtherPlayer={selectedOtherPlayer}
                    gameState={gameState}
                    activePlayerId={gameState?.activePlayer || ''}
                />
                <RuleSelectionModal
                    visible={showShredModal}
                    title="Select Rule to Shred"
                    description="Choose a rule to remove from your collection"
                    rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activePlayer && rule.isActive) || []}
                    onSelectRule={handleShredRuleSelect}
                    onClose={() => setShowShredModal(false)}
                />
                {/* Flip Text Input Modal */}
                <FlipTextInputModal
                    visible={showFlipTextInputModal}
                    selectedRule={selectedRuleForFlip}
                    onFlipRule={handleFlipTextSubmit}
                    onClose={() => {
                        setShowFlipTextInputModal(false);
                        setSelectedRuleForFlip(null);
                    }}
                />
                <RuleSelectionModal
                    visible={showFlipModal}
                    title="Select Rule to Flip"
                    description="Choose a rule to flip its meaning"
                    rules={gameState?.rules.filter(rule => rule.assignedTo && rule.isActive) || []}
                    onSelectRule={(ruleId) => {
                        handleFlipRuleSelect(ruleId);
                    }}
                    onClose={() => setShowFlipModal(false)}
                />
                <EndGameConfirmationModal
                    visible={showEndGameConfirmationModal}
                    onContinue={handleContinueGame}
                    onEnd={handleEndGame}
                    onClose={() => setShowEndGameConfirmationModal(false)}
                />

                {/* Workflow Modals */}
                <CloneWorkflowModal
                    visible={showCloneWorkflowModal}
                    onClose={() => setShowCloneWorkflowModal(false)}
                    onCloneComplete={handleCloneComplete}
                    gameState={gameState}
                    sourcePlayerId={gameState?.activePlayer}
                    title="Clone Rule"
                    description="Choose a rule to clone to another player"
                />

                <FlipWorkflowModal
                    visible={showFlipWorkflowModal}
                    onClose={() => setShowFlipWorkflowModal(false)}
                    onFlipComplete={handleFlipComplete}
                    gameState={gameState}
                    sourcePlayerId={gameState?.activePlayer}
                    title="Flip Rule"
                    description="Choose a rule to flip its meaning"
                />

                <UpDownWorkflowModal
                    visible={showUpWorkflowModal}
                    onClose={() => setShowUpWorkflowModal(false)}
                    onUpDownComplete={handleUpDownComplete}
                    gameState={gameState}
                    sourcePlayerId={gameState?.activePlayer}
                    direction="up"
                    title="Pass Rule Up"
                    description="Choose a rule to pass to the player above you"
                />

                <UpDownWorkflowModal
                    visible={showDownWorkflowModal}
                    onClose={() => setShowDownWorkflowModal(false)}
                    onUpDownComplete={handleUpDownComplete}
                    gameState={gameState}
                    sourcePlayerId={gameState?.activePlayer}
                    direction="down"
                    title="Pass Rule Down"
                    description="Choose a rule to pass to the player below you"
                />

                <SwapWorkflowModal
                    visible={showSwapWorkflowModal}
                    onClose={() => setShowSwapWorkflowModal(false)}
                    onSwapComplete={handleSwapComplete}
                    gameState={gameState}
                    sourcePlayerId={gameState?.activePlayer}
                    title="Swap Rules"
                    description="Choose a rule to swap with another player"
                />

                <ShredWorkflowModal
                    visible={showShredWorkflowModal}
                    onClose={() => setShowShredWorkflowModal(false)}
                    onShredComplete={handleShredComplete}
                    gameState={gameState}
                    sourcePlayerId={gameState?.activePlayer}
                    title="Shred Rule"
                    description="Choose a rule to remove from your collection"
                />
            </SafeAreaView>
        </StripedBackground>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        paddingTop: 100,
        alignItems: 'center',
        flex: 1,
    },
    wheelContainer: {
        backgroundColor: 'black',
        overflow: 'hidden',
        marginVertical: 32,
        width: '70%',
        position: 'relative',
        borderWidth: 8,
        borderColor: '#000',
        borderRadius: 8,
    },
    fadeOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 100,
        zIndex: 10,
    },
    fadeBlock: {
        height: 12,
        backgroundColor: 'black',
    },
    tickMarkContainer: {
        position: 'absolute',
        top: '50%',
        right: '16%',
        height: ITEM_HEIGHT,
        width: 30,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    tickMarkBlack: {
        width: 0,
        height: 0,
        borderTopWidth: 18,
        borderBottomWidth: 18,
        borderRightWidth: 35,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    tickMarkRed: {
        position: 'absolute',
        width: 0,
        height: 0,
        borderTopWidth: 15,
        borderBottomWidth: 15,
        borderRightWidth: 30,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: '#ff0000',
    },
    expandedPlaqueOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
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
    modalDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    modalButton: {
        backgroundColor: '#6b7280',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    modalButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    ruleButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    ruleButtonText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    ownerText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Add more as needed for all unique style objects
}); 