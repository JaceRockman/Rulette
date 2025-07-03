import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, FlatList, Dimensions, SafeAreaView, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../context/GameContext';
import shared from '../styles/shared';
import StripedBackground from '../components/StripedBackground';
import OutlinedText from '../components/OutlinedText';
import WheelSegment from '../components/WheelSegment';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SEGMENT_COLORS = ['#8b5cf6', '#ef4444', '#fbbf24', '#3b82f6']; // purple, red, yellow, blue
const PLAQUE_COLORS = ['#8b5cf6', '#ef4444', '#fbbf24', '#3b82f6', '#fff']; // purple, red, yellow, blue, white

export default function WheelScreen() {
    const navigation = useNavigation();
    const { gameState } = useGame();
    // Combine rules and prompts for the wheel
    const segments = [
        ...(gameState?.rules || []).map(r => ({ type: 'rule', text: "RULE" })),
        ...(gameState?.prompts || []).map(p => ({ type: 'prompt', text: "PROMPT" })),
    ];
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [showExpandedPlaque, setShowExpandedPlaque] = useState(false);
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

    // Generate random plaque colors for each segment (keep stable during a spin)
    const [plaqueColors, setPlaqueColors] = React.useState<string[]>([]);
    React.useEffect(() => {
        if (segments.length > 0) {
            setPlaqueColors(
                Array.from({ length: segments.length }, () =>
                    PLAQUE_COLORS[Math.floor(Math.random() * PLAQUE_COLORS.length)]
                )
            );
        }
        // eslint-disable-next-line
    }, [segments.length]);

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
                            console.log('Wheel height:', height);
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

                                return (
                                    <WheelSegment
                                        text={item.text}
                                        isSelected={actualIndex === selectedIndex}
                                        color={SEGMENT_COLORS[actualIndex % SEGMENT_COLORS.length]}
                                        plaqueColor={plaqueColors[actualIndex]}
                                        index={actualIndex}
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
                                backgroundColor: plaqueColors[selectedIndex] || '#fff',
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
                                    color: (plaqueColors[selectedIndex] === '#fbbf24' || plaqueColors[selectedIndex] === '#fff') ? '#000' : '#fff',
                                }}
                            >
                                {segments[selectedIndex]?.type === 'rule' ? 'RULE' : 'PROMPT'}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 18,
                                    textAlign: 'center',
                                    color: (plaqueColors[selectedIndex] === '#fbbf24' || plaqueColors[selectedIndex] === '#fff') ? '#000' : '#fff',
                                    lineHeight: 26,
                                }}
                            >
                                {(() => {
                                    const segment = segments[selectedIndex];
                                    if (segment?.type === 'rule') {
                                        const ruleIndex = selectedIndex;
                                        const rule = gameState?.rules?.[ruleIndex];
                                        return rule?.text || 'No rule available';
                                    } else if (segment?.type === 'prompt') {
                                        const promptIndex = selectedIndex - (gameState?.rules?.length || 0);
                                        const prompt = gameState?.prompts?.[promptIndex];
                                        return prompt?.text || 'No prompt available';
                                    }
                                    return 'No content available';
                                })()}
                            </Text>
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
                        </Animated.View>
                    </View>
                )}
            </SafeAreaView>
        </StripedBackground>
    );
} 