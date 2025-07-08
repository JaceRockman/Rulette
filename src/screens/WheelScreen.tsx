import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, FlatList, Dimensions, SafeAreaView, PanResponder, GestureResponderEvent, PanResponderGestureState, Modal, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGame } from '../context/GameContext';
import shared from '../styles/shared';
import StripedBackground from '../components/StripedBackground';
import OutlinedText from '../components/OutlinedText';
import WheelSegment from '../components/WheelSegment';
import FlipTextInputModal from '../components/Modals/FlipTextInputModal';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WheelScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { gameState, removeWheelLayer, endGame, assignRuleToCurrentPlayer, updatePoints, cloneRuleToPlayer, shredRule, dispatch, assignRule, spinWheel } = useGame();

    // Get the player ID from navigation params if provided
    const playerId = (route.params as { playerId?: string })?.playerId;

    // Set the current player to the spinning player if provided
    React.useEffect(() => {
        if (playerId && gameState?.currentPlayer !== playerId) {
            dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerId });
        }
    }, [playerId, gameState?.currentPlayer, dispatch]);
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
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const currentScrollOffset = useRef(0);
    const wheelContainerRef = useRef<View>(null);
    const [wheelHeight, setWheelHeight] = useState(0);
    const currentRotation = useRef(0);
    const popupScale = useRef(new Animated.Value(0)).current;
    const popupOpacity = useRef(new Animated.Value(0)).current;

    // Pad the segments so the selected item can be centered and create a continuous loop
    const paddedSegments = [
        // Add the last few segments at the beginning
        ...segments.slice(-Math.floor(VISIBLE_ITEMS / 2)),
        // Add the actual segments
        ...segments,
        // Add the first few segments at the end
        ...segments.slice(0, Math.floor(VISIBLE_ITEMS / 2)),
    ];

    // Check if game has ended
    React.useEffect(() => {
        if (gameState?.gameEnded && gameState?.winner) {
            // Navigate to game over screen or show winner
            alert(`Game Over! ${gameState.winner.name} wins with ${gameState.winner.points} points!`);
            navigation.goBack();
        }
    }, [gameState?.gameEnded, gameState?.winner, navigation]);

    const handleSpin = () => {
        if (isSpinning || segments.length === 0) return;

        // Notify backend about which player is spinning
        if (gameState?.currentPlayer) {
            spinWheel();
        }

        setIsSpinning(true);
        setShowExpandedPlaque(false);

        // 1. Randomly determine the scroll amount (40-50 segments)
        const randomSpins = 40 + Math.floor(Math.random() * 11);
        const scrollAmount = randomSpins * ITEM_HEIGHT;

        // 2. Calculate which result we end up on
        const finalIndex = (selectedIndex + randomSpins) % segments.length;
        setSelectedIndex(finalIndex);

        // Calculate duration with minimum and maximum bounds
        const minDuration = 2000; // 2 seconds minimum
        const maxDuration = 5000; // 5 seconds maximum
        const duration = Math.random() * (maxDuration - minDuration) + minDuration;

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
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
            onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                if (gestureState.dy > 30 && !isSpinning) {
                    handleSpin();
                }
            },
        })
    ).current;

    // Handle Up modifier - pass rule to player above
    const handleUpModifier = () => {
        if (!gameState?.currentPlayer || !gameState?.players) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (!currentPlayer || currentPlayer.isHost) {
            alert('Host players cannot use the Up modifier.');
            return;
        }

        // Find current player's index in the players array
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
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

        // Freeze the current segment to prevent content from changing during animation
        const selectedSegment = segments[selectedIndex];
        setFrozenSegment(selectedSegment);
        setIsClosingPopup(true);

        // Close the popup and navigate back
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
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            navigation.goBack();
        });
    };

    // Handle Down modifier - pass rule to player below
    const handleDownModifier = () => {
        if (!gameState?.currentPlayer || !gameState?.players) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (!currentPlayer || currentPlayer.isHost) {
            alert('Host players cannot use the Down modifier.');
            return;
        }

        // Find current player's index in the players array
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
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

        // Freeze the current segment to prevent content from changing during animation
        const selectedSegment = segments[selectedIndex];
        setFrozenSegment(selectedSegment);
        setIsClosingPopup(true);

        // Close the popup and navigate back
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
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            navigation.goBack();
        });
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
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            navigation.goBack();
        });

        // Reset flip state
        setSelectedRuleForFlip(null);
        setShowFlipTextInputModal(false);
    };

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <View style={{ paddingTop: 100, alignItems: 'center', flex: 1 }}>
                    <View style={{ height: 90 }} />
                    <View
                        ref={wheelContainerRef}
                        style={{
                            backgroundColor: 'black',
                            height: ITEM_HEIGHT * VISIBLE_ITEMS,
                            overflow: 'hidden',
                            marginVertical: 32,
                            width: '70%',
                            position: 'relative',
                            borderWidth: 8,
                            borderColor: '#000',
                            borderRadius: 8,
                        }}
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
                                        text={currentLayer ? (typeof currentLayer.content === 'string' ? currentLayer.content : currentLayer.content.text) : ''}
                                        isSelected={actualIndex === selectedIndex}
                                        color={segment?.color || '#8b5cf6'}
                                        plaqueColor={segment?.plaqueColor || '#fff'}
                                        index={actualIndex}
                                        currentLayer={currentLayer}
                                        layerCount={segment?.layers.length || 1}
                                        currentLayerIndex={segment?.currentLayerIndex || 0}
                                    />
                                );
                            }}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            getItemLayout={(_, idx) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * idx, index: idx })}
                        />

                        {/* Top fade overlay - gradient effect */}
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 100,
                                zIndex: 10,
                            }}
                        >
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 1.0 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.9 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.8 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.7 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.6 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.5 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.4 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.3 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.2 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.1 }} />
                        </View>

                        {/* Bottom fade overlay - gradient effect */}
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 100,
                                zIndex: 10,
                            }}
                        >
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.1 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.2 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.3 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.4 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.5 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.6 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.7 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.8 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 0.9 }} />
                            <View style={{ height: 12, backgroundColor: 'black', opacity: 1.0 }} />
                        </View>
                    </View>

                    {/* Tick mark positioned outside the wheel container */}
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '16%',
                            height: ITEM_HEIGHT,
                            width: 30,
                            zIndex: 1000,
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                        }}
                    >
                        <View
                            style={{
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
                            }}
                        />
                        <View
                            style={{
                                position: 'absolute',
                                width: 0,
                                height: 0,
                                borderTopWidth: 15,
                                borderBottomWidth: 15,
                                borderRightWidth: 30,
                                borderTopColor: 'transparent',
                                borderBottomColor: 'transparent',
                                borderRightColor: '#ff0000',
                            }}
                        />
                    </Animated.View>
                    <TouchableOpacity
                        style={[shared.button, { width: 180, marginTop: 16 }]}
                        onPress={handleSpin}
                        disabled={isSpinning || segments.length === 0}
                    >
                        <Text style={shared.buttonText}>{isSpinning ? 'Spinning...' : 'SPIN!'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Expanded plaque overlay */}
                {showExpandedPlaque && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 2000,
                        }}
                    >
                        <Animated.View
                            style={{
                                backgroundColor: (() => {
                                    const segment = segments[selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    return currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
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
                                        const segment = isClosingPopup ? frozenSegment : segments[selectedIndex];
                                        const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                        const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                    })(),
                                }}
                            >
                                {(() => {
                                    const segment = isClosingPopup ? frozenSegment : segments[selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    if (!currentLayer) return 'NO CONTENT';

                                    switch (currentLayer.type) {
                                        case 'rule': return 'RULE';
                                        case 'prompt': return 'PROMPT';
                                        case 'modifier': return 'MODIFIER';
                                        case 'end': return 'GAME OVER';
                                        default: return 'CONTENT';
                                    }
                                })()}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 18,
                                    textAlign: 'center',
                                    color: (() => {
                                        const segment = isClosingPopup ? frozenSegment : segments[selectedIndex];
                                        const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                        const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                    })(),
                                    lineHeight: 26,
                                }}
                            >
                                {(() => {
                                    const segment = isClosingPopup ? frozenSegment : segments[selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    if (!currentLayer) return 'No content available';

                                    if (typeof currentLayer.content === 'string') {
                                        return currentLayer.content;
                                    }
                                    return currentLayer.content.text || 'No content available';
                                })()}
                            </Text>
                            {(() => {
                                const selectedSegment = isClosingPopup ? frozenSegment : segments[selectedIndex];
                                const currentLayer = selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0];

                                if (currentLayer && currentLayer.type === 'prompt') {
                                    // Get current player's rules
                                    const currentPlayer = gameState?.players.find(p => p.id === gameState?.currentPlayer);
                                    const playerRules = gameState?.rules.filter(rule => rule.assignedTo === currentPlayer?.id && rule.isActive) || [];

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
                                                                style={{
                                                                    backgroundColor: rule.plaqueColor || '#fff',
                                                                    borderRadius: 12,
                                                                    padding: 12,
                                                                    marginHorizontal: 5,
                                                                    minWidth: 120,
                                                                    maxWidth: 150,
                                                                    borderWidth: 2,
                                                                    borderColor: '#000',
                                                                    shadowColor: '#000',
                                                                    shadowOffset: { width: 0, height: 2 },
                                                                    shadowOpacity: 0.3,
                                                                    shadowRadius: 4,
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontSize: 12,
                                                                        textAlign: 'center',
                                                                        color: (rule.plaqueColor === '#fbbf24' || rule.plaqueColor === '#fff' || rule.plaqueColor === '#ffffff') ? '#000' : '#fff',
                                                                        fontWeight: 'bold',
                                                                    }}
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
                                                        if (gameState?.currentPlayer) {
                                                            const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
                                                            if (currentPlayer) {
                                                                updatePoints(currentPlayer.id, currentPlayer.points + 2);
                                                            }
                                                        }

                                                        // Show shred modal instead of closing immediately
                                                        setShowShredModal(true);
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
                                                            popupScale.setValue(0);
                                                            popupOpacity.setValue(0);
                                                            navigation.goBack();
                                                        });
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                                                        FAILURE (0)
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                } else if (currentLayer && currentLayer.type === 'modifier' && typeof currentLayer.content === 'string') {
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
                                                    setShowCloneModal(true);
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
                                                    setShowFlipModal(true);
                                                }}
                                            >
                                                <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>
                                                    SELECT RULE TO FLIP
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    } else if (currentLayer.content === 'Up') {
                                        // Check if current player has rules to pass
                                        const currentPlayer = gameState?.players.find(p => p.id === gameState?.currentPlayer);
                                        const currentPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === currentPlayer?.id && rule.isActive);

                                        if (currentPlayerRules && currentPlayerRules.length > 0) {
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
                                                        // Handle Up modifier - pass rule to player above
                                                        handleUpModifier();
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                        PASS RULE UP
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        } else {
                                            // Player has no rules, show a message and close
                                            return (
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#6b7280',
                                                        paddingHorizontal: 30,
                                                        paddingVertical: 15,
                                                        borderRadius: 10,
                                                        marginTop: 30,
                                                        alignSelf: 'center',
                                                    }}
                                                    onPress={() => {
                                                        alert('You have no rules to pass up.');
                                                        // Freeze the current segment to prevent content from changing during animation
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
                                                            const selectedSegment = segments[selectedIndex];
                                                            if (selectedSegment) {
                                                                removeWheelLayer(selectedSegment.id);
                                                            }
                                                            setShowExpandedPlaque(false);
                                                            setIsClosingPopup(false);
                                                            setFrozenSegment(null);
                                                            popupScale.setValue(0);
                                                            popupOpacity.setValue(0);
                                                            navigation.goBack();
                                                        });
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                        NO RULES TO PASS UP
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }
                                    } else if (currentLayer.content === 'Down') {
                                        // Check if current player has rules to pass
                                        const currentPlayer = gameState?.players.find(p => p.id === gameState?.currentPlayer);
                                        const currentPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === currentPlayer?.id && rule.isActive);

                                        if (currentPlayerRules && currentPlayerRules.length > 0) {
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
                                                        // Handle Down modifier - pass rule to player below
                                                        handleDownModifier();
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                        PASS RULE DOWN
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        } else {
                                            // Player has no rules, show a message and close
                                            return (
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#6b7280',
                                                        paddingHorizontal: 30,
                                                        paddingVertical: 15,
                                                        borderRadius: 10,
                                                        marginTop: 30,
                                                        alignSelf: 'center',
                                                    }}
                                                    onPress={() => {
                                                        alert('You have no rules to pass down.');
                                                        // Freeze the current segment to prevent content from changing during animation
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
                                                            const selectedSegment = segments[selectedIndex];
                                                            if (selectedSegment) {
                                                                removeWheelLayer(selectedSegment.id);
                                                            }
                                                            setShowExpandedPlaque(false);
                                                            setIsClosingPopup(false);
                                                            setFrozenSegment(null);
                                                            popupScale.setValue(0);
                                                            popupOpacity.setValue(0);
                                                            navigation.goBack();
                                                        });
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                        NO RULES TO PASS DOWN
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }
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
                                                    // Handle Swap modifier - open swap modal
                                                    setShowSwapModal(true);
                                                    setSwapStep('selectOwnRule');
                                                    setSelectedOwnRule(null);
                                                    setSelectedOtherPlayer(null);
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    SWAP RULES
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }
                                } else {
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

                                                    // If the CURRENT layer is an end layer, end the game
                                                    if (currentLayer && currentLayer.type === 'end') {
                                                        // Find player with most points
                                                        const winner = gameState?.players.reduce((prev, current) =>
                                                            (prev.points > current.points) ? prev : current
                                                        );
                                                        if (winner) {
                                                            endGame();
                                                        }
                                                    } else if (currentLayer && currentLayer.type === 'rule') {
                                                        // Assign the rule to the current player
                                                        if (typeof currentLayer.content !== 'string' && currentLayer.content.id) {
                                                            assignRuleToCurrentPlayer(currentLayer.content.id);
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
                                                    popupScale.setValue(0);
                                                    popupOpacity.setValue(0);
                                                    // Navigate back to the game room
                                                    navigation.goBack();
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

                {/* Clone Rule Selection Modal */}
                <Modal
                    visible={showCloneModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowCloneModal(false)}
                >
                    <View style={{
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
                    }}>
                        <View style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 12,
                            padding: 20,
                            width: '80%',
                            maxHeight: '70%',
                        }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: 12,
                                textAlign: 'center',
                            }}>
                                Select Rule to Clone
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                marginBottom: 16,
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                {(() => {
                                    const currentPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === gameState?.currentPlayer && rule.isActive);
                                    if (currentPlayerRules && currentPlayerRules.length > 0) {
                                        return "Choose one of your rules to give to another player";
                                    } else {
                                        return "Choose any rule to give to another player";
                                    }
                                })()}
                            </Text>

                            <ScrollView style={{ maxHeight: 300 }}>
                                {(() => {
                                    const currentPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === gameState?.currentPlayer && rule.isActive);
                                    if (currentPlayerRules && currentPlayerRules.length > 0) {
                                        // Show current player's rules
                                        return currentPlayerRules.map((rule) => (
                                            <TouchableOpacity
                                                key={rule.id}
                                                style={{
                                                    backgroundColor: '#f3f4f6',
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    marginBottom: 8,
                                                }}
                                                onPress={() => {
                                                    setSelectedRuleForClone({ rule, player: gameState?.players.find(player => player.id === gameState?.currentPlayer) });
                                                    setShowCloneModal(false);
                                                    // Show player selection modal for the clone
                                                    setShowClonePlayerModal(true);
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: '#1f2937',
                                                    textAlign: 'center',
                                                }}>
                                                    {rule.text}
                                                </Text>
                                            </TouchableOpacity>
                                        ));
                                    } else {
                                        // Show all active rules assigned to any player
                                        return gameState?.rules
                                            .filter(rule => rule.assignedTo && rule.isActive)
                                            .map((rule) => {
                                                const ruleOwner = gameState?.players.find(player => player.id === rule.assignedTo);
                                                return (
                                                    <TouchableOpacity
                                                        key={rule.id}
                                                        style={{
                                                            backgroundColor: '#f3f4f6',
                                                            borderRadius: 8,
                                                            padding: 12,
                                                            marginBottom: 8,
                                                        }}
                                                        onPress={() => {
                                                            setSelectedRuleForClone({ rule, player: ruleOwner });
                                                            setShowCloneModal(false);
                                                            // Show player selection modal for the clone
                                                            setShowClonePlayerModal(true);
                                                        }}
                                                    >
                                                        <Text style={{
                                                            fontSize: 16,
                                                            color: '#1f2937',
                                                            textAlign: 'center',
                                                        }}>
                                                            {rule.text}
                                                        </Text>
                                                        <Text style={{
                                                            fontSize: 12,
                                                            color: '#6b7280',
                                                            textAlign: 'center',
                                                            fontStyle: 'italic',
                                                        }}>
                                                            (Owned by {ruleOwner?.name})
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            });
                                    }
                                })()}
                            </ScrollView>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#6b7280',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginTop: 16,
                                }}
                                onPress={() => setShowCloneModal(false)}
                            >
                                <Text style={{
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Clone Player Selection Modal */}
                <Modal
                    visible={showClonePlayerModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowClonePlayerModal(false)}
                >
                    <View style={{
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
                    }}>
                        <View style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 12,
                            padding: 20,
                            width: '80%',
                            maxHeight: '70%',
                        }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: 12,
                                textAlign: 'center',
                            }}>
                                Select Player to Give Rule To
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                marginBottom: 16,
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                Choose who to give "{selectedRuleForClone?.rule.text}" to
                            </Text>

                            <ScrollView style={{ maxHeight: 300 }}>
                                {gameState?.players
                                    .map((player) => (
                                        <TouchableOpacity
                                            key={player.id}
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                borderRadius: 8,
                                                padding: 12,
                                                marginBottom: 8,
                                            }}
                                            onPress={() => {
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
                                                    popupScale.setValue(0);
                                                    popupOpacity.setValue(0);
                                                    navigation.goBack();
                                                });
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 16,
                                                color: '#1f2937',
                                                textAlign: 'center',
                                            }}>
                                                {player.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#6b7280',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginTop: 16,
                                }}
                                onPress={() => setShowClonePlayerModal(false)}
                            >
                                <Text style={{
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Flip Rule Selection Modal */}
                <Modal
                    visible={showFlipModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowFlipModal(false)}
                >
                    <View style={{
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
                    }}>
                        <View style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 12,
                            padding: 20,
                            width: '80%',
                            maxHeight: '70%',
                        }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: 12,
                                textAlign: 'center',
                            }}>
                                Select Rule to Flip
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                marginBottom: 16,
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                Choose a rule to flip its meaning
                            </Text>

                            <ScrollView style={{ maxHeight: 300 }}>
                                {gameState?.rules
                                    .filter(rule => rule.assignedTo && rule.isActive)
                                    .map((rule) => (
                                        <TouchableOpacity
                                            key={rule.id}
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                borderRadius: 8,
                                                padding: 12,
                                                marginBottom: 8,
                                            }}
                                            onPress={() => {
                                                handleFlipRuleSelect(rule.id);
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 16,
                                                color: '#1f2937',
                                                textAlign: 'center',
                                            }}>
                                                {rule.text}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#6b7280',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginTop: 16,
                                }}
                                onPress={() => setShowFlipModal(false)}
                            >
                                <Text style={{
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Shred Rule Selection Modal */}
                <Modal
                    visible={showShredModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowShredModal(false)}
                >
                    <View style={{
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
                    }}>
                        <View style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 12,
                            padding: 20,
                            width: '80%',
                            maxHeight: '70%',
                        }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: 12,
                                textAlign: 'center',
                            }}>
                                Select Rule to Shred
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                marginBottom: 16,
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                Choose a rule to remove from your collection
                            </Text>

                            <ScrollView style={{ maxHeight: 300 }}>
                                {gameState?.rules
                                    .filter(rule => rule.assignedTo === gameState?.currentPlayer)
                                    .map((rule) => (
                                        <TouchableOpacity
                                            key={rule.id}
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                borderRadius: 8,
                                                padding: 12,
                                                marginBottom: 8,
                                            }}
                                            onPress={() => {
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
                                                    popupScale.setValue(0);
                                                    popupOpacity.setValue(0);
                                                    navigation.goBack();
                                                });
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 16,
                                                color: '#1f2937',
                                                textAlign: 'center',
                                            }}>
                                                {rule.text}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#6b7280',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginTop: 16,
                                }}
                                onPress={() => setShowShredModal(false)}
                            >
                                <Text style={{
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Swap Rules Modal */}
                <Modal
                    visible={showSwapModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowSwapModal(false)}
                >
                    <View style={{
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
                    }}>
                        <View style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 12,
                            padding: 20,
                            width: '80%',
                            maxHeight: '70%',
                        }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: 12,
                                textAlign: 'center',
                            }}>
                                {swapStep === 'selectOwnRule' ? 'Select Your Rule to Swap' : 'Select Other Player\'s Rule'}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                marginBottom: 16,
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                {swapStep === 'selectOwnRule'
                                    ? 'Choose one of your rules to swap with another player'
                                    : `Choose a rule from ${selectedOtherPlayer?.name} to swap with "${selectedOwnRule?.text}"`
                                }
                            </Text>

                            <ScrollView style={{ maxHeight: 300 }}>
                                {swapStep === 'selectOwnRule' ? (
                                    // Step 1: Select own rule
                                    <>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: 'bold',
                                            color: '#1f2937',
                                            marginBottom: 8,
                                            textAlign: 'center',
                                        }}>
                                            Your Rules:
                                        </Text>
                                        {gameState?.rules
                                            .filter(rule => rule.assignedTo === gameState?.currentPlayer && rule.isActive)
                                            .map((rule) => (
                                                <TouchableOpacity
                                                    key={rule.id}
                                                    style={{
                                                        backgroundColor: '#f3f4f6',
                                                        borderRadius: 8,
                                                        padding: 12,
                                                        marginBottom: 8,
                                                    }}
                                                    onPress={() => {
                                                        setSelectedOwnRule(rule);
                                                        setSwapStep('selectOtherRule');
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: 16,
                                                        color: '#1f2937',
                                                        textAlign: 'center',
                                                    }}>
                                                        {rule.text}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}

                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: 'bold',
                                            color: '#1f2937',
                                            marginTop: 16,
                                            marginBottom: 8,
                                            textAlign: 'center',
                                        }}>
                                            Other Players:
                                        </Text>
                                        {gameState?.players
                                            .filter(player => player.id !== gameState?.currentPlayer && !player.isHost)
                                            .map((player) => {
                                                const playerRules = gameState?.rules.filter(rule => rule.assignedTo === player.id && rule.isActive);
                                                if (playerRules && playerRules.length > 0) {
                                                    return (
                                                        <TouchableOpacity
                                                            key={player.id}
                                                            style={{
                                                                backgroundColor: '#e5e7eb',
                                                                borderRadius: 8,
                                                                padding: 12,
                                                                marginBottom: 8,
                                                            }}
                                                            onPress={() => {
                                                                setSelectedOtherPlayer(player);
                                                                setSwapStep('selectOtherRule');
                                                            }}
                                                        >
                                                            <Text style={{
                                                                fontSize: 16,
                                                                color: '#1f2937',
                                                                textAlign: 'center',
                                                            }}>
                                                                {player.name} ({playerRules.length} rules)
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                }
                                                return null;
                                            })}
                                    </>
                                ) : (
                                    // Step 2: Select other player's rule
                                    <>
                                        {selectedOtherPlayer && (
                                            <>
                                                <Text style={{
                                                    fontSize: 16,
                                                    fontWeight: 'bold',
                                                    color: '#1f2937',
                                                    marginBottom: 8,
                                                    textAlign: 'center',
                                                }}>
                                                    {selectedOtherPlayer.name}'s Rules:
                                                </Text>
                                                {gameState?.rules
                                                    .filter(rule => rule.assignedTo === selectedOtherPlayer.id && rule.isActive)
                                                    .map((rule) => (
                                                        <TouchableOpacity
                                                            key={rule.id}
                                                            style={{
                                                                backgroundColor: '#f3f4f6',
                                                                borderRadius: 8,
                                                                padding: 12,
                                                                marginBottom: 8,
                                                            }}
                                                            onPress={() => {
                                                                // Perform the swap
                                                                if (selectedOwnRule && gameState?.currentPlayer) {
                                                                    // Swap the rules
                                                                    assignRule(selectedOwnRule.id, selectedOtherPlayer.id);
                                                                    assignRule(rule.id, gameState.currentPlayer);

                                                                    alert(`${gameState.players.find(p => p.id === gameState.currentPlayer)?.name} swapped "${selectedOwnRule.text}" with ${selectedOtherPlayer.name}'s "${rule.text}"!`);

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
                                                                        popupScale.setValue(0);
                                                                        popupOpacity.setValue(0);
                                                                        navigation.goBack();
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Text style={{
                                                                fontSize: 16,
                                                                color: '#1f2937',
                                                                textAlign: 'center',
                                                            }}>
                                                                {rule.text}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#6b7280',
                                        borderRadius: 8,
                                        padding: 16,
                                        flex: 1,
                                        marginRight: 8,
                                    }}
                                    onPress={() => {
                                        if (swapStep === 'selectOtherRule') {
                                            setSwapStep('selectOwnRule');
                                            setSelectedOwnRule(null);
                                            setSelectedOtherPlayer(null);
                                        } else {
                                            setShowSwapModal(false);
                                        }
                                    }}
                                >
                                    <Text style={{
                                        color: '#ffffff',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                    }}>
                                        {swapStep === 'selectOtherRule' ? 'Back' : 'Cancel'}
                                    </Text>
                                </TouchableOpacity>

                                {swapStep === 'selectOtherRule' && (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#dc3545',
                                            borderRadius: 8,
                                            padding: 16,
                                            flex: 1,
                                            marginLeft: 8,
                                        }}
                                        onPress={() => {
                                            setShowSwapModal(false);
                                            setSwapStep('selectOwnRule');
                                            setSelectedOwnRule(null);
                                            setSelectedOtherPlayer(null);
                                        }}
                                    >
                                        <Text style={{
                                            color: '#ffffff',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                        }}>
                                            Cancel Swap
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>

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
            </SafeAreaView>
        </StripedBackground>
    );
} 