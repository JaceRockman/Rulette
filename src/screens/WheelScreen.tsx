import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { StackItem } from '../types/game';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Text as SvgText, Path } from 'react-native-svg';


type WheelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wheel'>;

const { width, height } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width, height) * 0.85;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 30;

export default function WheelScreen() {
    const navigation = useNavigation<WheelScreenNavigationProp>();
    const { gameState, assignRuleToCurrentPlayer } = useGame();
    const [isSpinning, setIsSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [landedSegment, setLandedSegment] = useState<number | null>(null);
    const [segmentStacks, setSegmentStacks] = useState<{ [key: number]: StackItem[] }>({});
    const [currentWheelAngle, setCurrentWheelAngle] = useState(0); // Track cumulative wheel rotation
    const [currentRotation, setCurrentRotation] = useState(0); // Track current rotation display

    const spinAnimation = useRef(new Animated.Value(0)).current;
    const resultOpacity = useRef(new Animated.Value(0)).current;

    // Initialize segment stacks when component mounts or game state changes
    useEffect(() => {
        // For testing: Create test data if no game state
        if (!gameState) {
            const testRules = [
                { id: 'rule-a', text: 'Rule A', isActive: true },
                { id: 'rule-b', text: 'Rule B', isActive: true },
                { id: 'rule-c', text: 'Rule C', isActive: true },
                { id: 'rule-d', text: 'Rule D', isActive: true },
                { id: 'rule-e', text: 'Rule E', isActive: true },
            ];

            const testPrompts = [
                { id: 'prompt-1', text: 'Prompt 1' },
                { id: 'prompt-2', text: 'Prompt 2' },
                { id: 'prompt-3', text: 'Prompt 3' },
                { id: 'prompt-4', text: 'Prompt 4' },
                { id: 'prompt-5', text: 'Prompt 5' },
                { id: 'prompt-6', text: 'Prompt 6' },
                { id: 'prompt-7', text: 'Prompt 7' },
                { id: 'prompt-8', text: 'Prompt 8' },
            ];

            const newSegmentStacks: { [key: number]: StackItem[] } = {};

            // Create a stack for each test rule
            testRules.forEach((rule, index) => {
                const stack: StackItem[] = [
                    { type: 'rule', content: rule },
                    { type: 'prompt', content: testPrompts[Math.floor(Math.random() * testPrompts.length)] },
                    { type: 'modifier', content: ['swap', 'clone', 'invert'][Math.floor(Math.random() * 3)] },
                    { type: 'modifier', content: 'end' }
                ];
                newSegmentStacks[index] = stack;
            });

            // Only update if we don't already have stacks (to preserve existing state)
            if (Object.keys(segmentStacks).length === 0) {
                setSegmentStacks(newSegmentStacks);
            }
            return;
        }

        const activeRules = gameState.rules.filter(r => r.isActive);
        const availablePrompts = gameState.prompts;

        const newSegmentStacks: { [key: number]: StackItem[] } = {};

        // Create a stack for each active rule
        activeRules.forEach((rule, index) => {
            const stack: StackItem[] = [
                { type: 'rule', content: rule },
                { type: 'prompt', content: availablePrompts[Math.floor(Math.random() * availablePrompts.length)] || { id: '1', text: 'Sample Prompt' } },
                { type: 'modifier', content: ['swap', 'clone', 'invert'][Math.floor(Math.random() * 3)] },
                { type: 'modifier', content: 'end' }
            ];
            newSegmentStacks[index] = stack;
        });

        // Only update if we don't already have stacks (to preserve existing state)
        if (Object.keys(segmentStacks).length === 0) {
            setSegmentStacks(newSegmentStacks);
        }
    }, [gameState]);

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Step 1: Generate a random spin
        const spinDuration = 4000 + Math.random() * 2000; // 4-6 seconds
        const minRotations = 5;
        const maxRotations = 8;
        const rotations = minRotations + Math.random() * (maxRotations - minRotations);
        const spinDegrees = rotations * 360; // 5-8 full rotations (1800-2880 degrees)

        // Step 2: Calculate where the wheel will end up (counterclockwise)
        const newWheelAngle = currentWheelAngle + spinDegrees;

        // Step 3: Determine which segment is at the right (where the tick mark points)
        const segments = getWheelSegments();
        const segmentCount = segments.length;
        const anglePerSegment = 360 / segmentCount;

        // The tick mark is at the right (0 degrees), so we need to find which segment
        // is at the right when the wheel stops spinning
        const finalPosition = newWheelAngle;
        const selectedSegmentIndex = Math.floor(finalPosition / anglePerSegment) % segmentCount;



        // Set the rotation display
        setCurrentRotation(spinDegrees);

        Animated.timing(spinAnimation, {
            toValue: newWheelAngle,
            duration: spinDuration,
            useNativeDriver: true,
        }).start(() => {
            setIsSpinning(false);
            setLandedSegment(selectedSegmentIndex);
            setCurrentWheelAngle(newWheelAngle); // Update the current wheel position
            setShowResult(true);

            // Animate result appearance
            Animated.timing(resultOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        });
    };



    const onSpinButtonPress = () => {
        handleSpin();
    };

    const handleNext = () => {
        if (landedSegment === null) return;

        // Get the current stack for the landed segment
        const currentStack = segmentStacks[landedSegment] || [];

        if (currentStack.length > 0) {
            const topItem = currentStack[0];

            // Check if we landed on "end" - if so, end the game
            if (topItem.type === 'modifier' && topItem.content === 'end') {
                navigation.goBack();
                return;
            }

            // If current item is a rule and it's not assigned yet, assign it to current player
            if (topItem.type === 'rule' && !(topItem.content as any).assignedTo) {
                assignRuleToCurrentPlayer((topItem.content as any).id);
            }

            // Remove the top item from the stack (peel it away)
            const newStack = currentStack.slice(1);
            setSegmentStacks(prev => ({
                ...prev,
                [landedSegment]: newStack
            }));

            // If stack is empty (reached "end"), check if game should end
            if (newStack.length === 0) {
                // Check if all segments are empty
                const allSegmentsEmpty = Object.values({ ...segmentStacks, [landedSegment]: newStack }).every(stack => stack.length === 0);
                if (allSegmentsEmpty) {
                    // Game is over, go back to game screen
                    navigation.goBack();
                    return;
                }
            }
        }

        setShowResult(false);
        setLandedSegment(null);
        resultOpacity.setValue(0);
    };

    const handleBackToGame = () => {
        navigation.goBack();
    };

    const getWheelSegments = () => {
        const segments = [];

        // Each segment represents a stack of 4 layers: Rule -> Prompt/Modifier -> Prompt/Modifier -> End
        // Number of segments = number of active rules (regardless of assignment status)
        let activeRules = gameState?.rules.filter(r => r.isActive) || [];

        // For testing: Use test rules if no game state
        if (!gameState) {
            activeRules = [
                { id: 'rule-a', text: 'Rule A', isActive: true },
                { id: 'rule-b', text: 'Rule B', isActive: true },
                { id: 'rule-c', text: 'Rule C', isActive: true },
                { id: 'rule-d', text: 'Rule D', isActive: true },
                { id: 'rule-e', text: 'Rule E', isActive: true },
            ];
        }

        // If no rules, create one default segment
        const segmentCount = Math.max(activeRules.length, 1);
        const anglePerSegment = 360 / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
            const startAngle = (i * anglePerSegment) * (Math.PI / 180);
            const endAngle = ((i + 1) * anglePerSegment) * (Math.PI / 180);

            const x1 = CENTER + RADIUS * Math.cos(startAngle);
            const y1 = CENTER + RADIUS * Math.sin(startAngle);
            const x2 = CENTER + RADIUS * Math.cos(endAngle);
            const y2 = CENTER + RADIUS * Math.sin(endAngle);

            const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

            // Get the current top layer of this segment's stack
            const currentStack = segmentStacks[i] || [];
            const topItem = currentStack[0];

            let color = '#ef4444'; // Default rule color
            let text = 'RULE';
            let type = 'rule';

            if (topItem) {
                switch (topItem.type) {
                    case 'prompt':
                        color = '#10b981';
                        text = 'PROMPT';
                        type = 'prompt';
                        break;
                    case 'modifier':
                        if (topItem.content === 'end') {
                            color = '#6b7280';
                            text = 'END';
                            type = 'end';
                        } else {
                            color = '#f59e0b';
                            text = 'MODIFIER';
                            type = 'modifier';
                        }
                        break;
                    default:
                        color = '#ef4444';
                        text = 'RULE';
                        type = 'rule';
                }
            }

            segments.push({
                path: `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
                color,
                text,
                type,
                textAngle: (i * anglePerSegment + anglePerSegment / 2) * (Math.PI / 180),
                anglePerSegment,
                segmentIndex: i,
            });
        }

        return segments;
    };

    const getResultText = () => {
        if (landedSegment === null) return 'No result';

        const currentStack = segmentStacks[landedSegment] || [];
        if (currentStack.length === 0) return 'No result';

        const topItem = currentStack[0];

        switch (topItem.type) {
            case 'prompt':
                return `Prompt: ${(topItem.content as any).text}`;
            case 'rule':
                const rule = topItem.content as any;
                if (rule.assignedTo) {
                    const assignedPlayer = gameState?.players?.find(p => p.id === rule.assignedTo);
                    return `Rule: ${rule.text}\n(Already assigned to ${assignedPlayer?.name || 'Unknown'})`;
                } else {
                    return `Rule: ${rule.text}\n(Will be assigned to you!)`;
                }
            case 'modifier':
                if (topItem.content === 'end') {
                    return 'Game Over!';
                }
                return `Modifier: ${topItem.content}`;
            default:
                return 'Unknown result';
        }
    };

    const getResultColor = () => {
        if (landedSegment === null) return '#6b7280';

        const currentStack = segmentStacks[landedSegment] || [];
        if (currentStack.length === 0) return '#6b7280';

        const topItem = currentStack[0];

        switch (topItem.type) {
            case 'prompt':
                return '#10b981';
            case 'rule':
                return '#ef4444';
            case 'modifier':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const segments = getWheelSegments();

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#ec4899']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {/* Wheel */}
                    <View style={styles.wheelContainer}>


                        {/* Selected Segment Display */}
                        {landedSegment !== null && (
                            <View style={styles.selectedSegmentDisplay}>
                                <Text style={styles.selectedSegmentText}>
                                    Selected: Segment {landedSegment + 1}
                                </Text>
                            </View>
                        )}

                        <View style={styles.wheelWrapper}>
                            <Animated.View
                                style={[
                                    styles.wheel,
                                    {
                                        transform: [{
                                            rotate: spinAnimation.interpolate({
                                                inputRange: [0, 3600],
                                                outputRange: ['0deg', '-3600deg'],
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                                    {segments.map((segment, index) => (
                                        <View key={index}>
                                            {/* Segment path */}
                                            <Path
                                                d={segment.path}
                                                fill={segment.color}
                                                stroke="#ffffff"
                                                strokeWidth={3}
                                            />
                                            {/* Segment text */}
                                            <SvgText
                                                x={CENTER + (RADIUS * 0.7) * Math.cos(segment.textAngle)}
                                                y={CENTER + (RADIUS * 0.7) * Math.sin(segment.textAngle)}
                                                fill="#ffffff"
                                                fontSize="16"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                                transform={`rotate(${(segment.textAngle * 180 / Math.PI) + 90}, ${CENTER + (RADIUS * 0.7) * Math.cos(segment.textAngle)}, ${CENTER + (RADIUS * 0.7) * Math.sin(segment.textAngle)})`}
                                            >
                                                {segment.text}
                                            </SvgText>
                                        </View>
                                    ))}


                                </Svg>
                            </Animated.View>

                            {/* Tick mark indicator */}
                            <View style={styles.tickMark}>
                                <View style={styles.tickTriangle} />
                            </View>
                        </View>





                        {/* Spin Button */}
                        <TouchableOpacity
                            style={[styles.spinButton, isSpinning && styles.spinningButton]}
                            onPress={onSpinButtonPress}
                            disabled={isSpinning}
                        >
                            <Text style={styles.spinButtonText}>
                                {isSpinning ? 'Spinning...' : 'SPIN!'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Result Display */}
                    {showResult && (
                        <Animated.View
                            style={[
                                styles.resultContainer,
                                {
                                    opacity: resultOpacity,
                                    borderColor: getResultColor(),
                                }
                            ]}
                        >
                            <Text style={styles.resultTitle}>Result:</Text>
                            <Text style={[styles.resultText, { color: getResultColor() }]}>
                                {getResultText()}
                            </Text>

                            <View style={styles.resultActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleNext}
                                >
                                    <Text style={styles.actionButtonText}>
                                        Next
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.backButton]}
                                    onPress={handleBackToGame}
                                >
                                    <Text style={styles.actionButtonText}>Back to Game</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}


                </View>
            </LinearGradient>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    wheelContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },

    selectedSegmentDisplay: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 10,
    },
    selectedSegmentText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
    },
    wheel: {
        marginBottom: 20,
    },
    wheelWrapper: {
        position: 'relative',
    },
    tickMark: {
        position: 'absolute',
        right: -10,
        top: '50%',
        transform: [{ translateY: -10 }],
        zIndex: 10,
    },
    tickTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 0,
        borderRightWidth: 20,
        borderBottomWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: '#ffffff',
        borderBottomColor: 'transparent',
        borderTopColor: 'transparent',
    },
    spinButton: {
        backgroundColor: '#f59e0b',
        borderRadius: 50,
        paddingHorizontal: 30,
        paddingVertical: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    spinningButton: {
        backgroundColor: '#6b7280',
    },
    spinButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 3,
        alignItems: 'center',
        minWidth: 300,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
    },
    resultText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    resultActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        backgroundColor: '#10b981',
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        backgroundColor: '#6b7280',
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },


}); 