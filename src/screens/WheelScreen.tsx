import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, FlatList, Dimensions, SafeAreaView, PanResponder, GestureResponderEvent, PanResponderGestureState, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../context/GameContext';
import shared from '../styles/shared';
import StripedBackground from '../components/StripedBackground';
import OutlinedText from '../components/OutlinedText';
import WheelSegment from '../components/WheelSegment';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WheelScreen() {
    const navigation = useNavigation();
    const { gameState, removeWheelLayer, endGame, assignRuleToCurrentPlayer, updatePoints, cloneRuleToPlayer, flipRule, shredRule, dispatch } = useGame();
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showClonePlayerModal, setShowClonePlayerModal] = useState(false);
    const [showFlipModal, setShowFlipModal] = useState(false);
    const [showShredModal, setShowShredModal] = useState(false);
    const [selectedRuleForClone, setSelectedRuleForClone] = useState<{ rule: any; player: any } | null>(null);

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
        dispatch({ type: 'UPDATE_RULE', payload: { ...randomRule, assignedTo: targetPlayer.id } });

        alert(`${currentPlayer.name} passed the rule "${randomRule.text}" up to ${targetPlayer.name}!`);

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
            const selectedSegment = segments[selectedIndex];
            if (selectedSegment) {
                removeWheelLayer(selectedSegment.id);
            }
            setShowExpandedPlaque(false);
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
        dispatch({ type: 'UPDATE_RULE', payload: { ...randomRule, assignedTo: targetPlayer.id } });

        alert(`${currentPlayer.name} passed the rule "${randomRule.text}" down to ${targetPlayer.name}!`);

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
            const selectedSegment = segments[selectedIndex];
            if (selectedSegment) {
                removeWheelLayer(selectedSegment.id);
            }
            setShowExpandedPlaque(false);
            popupScale.setValue(0);
            popupOpacity.setValue(0);
            navigation.goBack();
        });
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
                                        const segment = segments[selectedIndex];
                                        const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                        const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                    })(),
                                }}
                            >
                                {(() => {
                                    const segment = segments[selectedIndex];
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
                                        const segment = segments[selectedIndex];
                                        const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                        const plaqueColor = currentLayer?.plaqueColor || segment?.plaqueColor || '#fff';
                                        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff') ? '#000' : '#fff';
                                    })(),
                                    lineHeight: 26,
                                }}
                            >
                                {(() => {
                                    const segment = segments[selectedIndex];
                                    const currentLayer = segment?.layers[segment?.currentLayerIndex || 0];
                                    if (!currentLayer) return 'No content available';

                                    if (typeof currentLayer.content === 'string') {
                                        return currentLayer.content;
                                    }
                                    return currentLayer.content.text || 'No content available';
                                })()}
                            </Text>
                            {(() => {
                                const selectedSegment = segments[selectedIndex];
                                const currentLayer = selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0];

                                if (currentLayer && currentLayer.type === 'prompt') {
                                    return (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 30 }}>
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
                                                    // Handle Down modifier - pass rule to player below
                                                    handleDownModifier();
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    PASS RULE DOWN
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
                                                        }
                                                    }
                                                }

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
                                                    if (selectedSegment) {
                                                        const currentLayer = selectedSegment.layers[selectedSegment.currentLayerIndex];
                                                        if (currentLayer && currentLayer.type !== 'end') {
                                                            removeWheelLayer(selectedSegment.id);
                                                        }
                                                    }
                                                    setShowExpandedPlaque(false);
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
                                                flipRule(rule.id);
                                                setShowFlipModal(false);

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
            </SafeAreaView>
        </StripedBackground>
    );
} 