import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, FlatList, Dimensions, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGame } from '../context/GameContext';
import WheelSegment from '../components/WheelSegment';
import socketService from '../services/socketService';
import SimpleModal from '../modals/SimpleModal';
import shared from '../shared/styles';
import ModifierModals, { initiateClone, initiateFlip, initiateSwap, initiateUpDown } from '../modals/ModifierModals';
import Backdrop from '../components/Backdrop';
import { ActiveAccusationDetails, Rule, WheelSegment as WheelSegmentType, WheelSpinDetails } from '../types/game';
import { RootStackParamList } from '../../App';
import Plaque from '../components/Plaque';
import { PromptPerformanceModal, PromptResolutionModal, RuleDetailsModal } from '../modals';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList<WheelSegmentType>;

type WheelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wheel'>;

export default function WheelScreen2() {
    const navigation = useNavigation<WheelScreenNavigationProp>();
    const { gameState, currentUser, removeWheelLayer, assignRule, initiateAccusation, acceptPrompt, endPrompt, shredRule, endGame } = useGame();
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentWheelIndex, setCurrentWheelIndex] = useState<number>(0);
    const flatListRef = useRef<FlatList<WheelSegmentType>>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const currentScrollOffset = useRef(0);

    const [currentModal, setCurrentModal] = useState<string | undefined>(undefined);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [hasProcessedEndSegment, setHasProcessedEndSegment] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState<WheelSegmentType | null>(null);

    // Wheel segments from game state
    const segments = gameState?.wheelSegments || [];
    const paddedSegments = [
        ...segments.slice(-Math.floor(VISIBLE_ITEMS / 2)),
        ...segments,
        ...segments.slice(0, Math.floor(VISIBLE_ITEMS / 2)),
    ];

    // Update local state to current modal based on game state
    React.useEffect(() => {
        const playerModal = gameState?.players.find(player => player.id === currentUser?.id)?.currentModal;
        const globalModal = gameState?.globalModal;
        setCurrentModal(playerModal || globalModal);
    }, [gameState?.players.find(player => player.id === currentUser?.id)?.currentModal, gameState?.globalModal]);

    // Function to animate the wheel spin
    const performSynchronizedSpin = () => {
        if (!gameState || !gameState.wheelSpinDetails) return;
        setIsSpinning(true);
        const { finalIndex, scrollAmount, duration } = gameState.wheelSpinDetails;

        // Animate the scroll with a "spin" effect - always go top to bottom
        Animated.timing(scrollY, {
            toValue: currentScrollOffset.current + scrollAmount,
            duration: duration,
            useNativeDriver: true,
            easing: t => 1 - Math.pow(1 - t, 3), // ease out
        }).start(() => {
            setIsSpinning(false);
            setCurrentWheelIndex(finalIndex);

            // Snap to the final position, centered in the wheel
            // const centerOffset = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
            // const finalScroll = (finalIndex * ITEM_HEIGHT) + centerOffset;
            // flatListRef.current?.scrollToOffset({ offset: finalScroll, animated: false });

            // Store the selected segment for later processing
            const selectedSegment = segments[finalIndex];
            const selectedPlaque = selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0];
            const activePlayer = gameState?.players.find(player => player.id === gameState?.activePlayer);

            console.log('WheelScreen2: segments', segments);
            console.log('WheelScreen2: finalIndex', finalIndex);
            console.log('WheelScreen2: selectedSegment', selectedSegment);
            console.log('WheelScreen2: selectedPlaque', selectedPlaque);

            if (gameState && activePlayer) {
                switch (selectedPlaque?.type) {
                    case 'rule':
                        console.log('WheelScreen2: spun rule', selectedPlaque);
                        if (currentUser?.isHost) {
                            assignRule(selectedPlaque?.id || '', activePlayer?.id || '');
                        }
                        setCurrentModal('RuleModal');
                        break;
                    case 'prompt':

                        break;
                    case 'modifier':
                        switch (selectedPlaque?.text) {
                            case 'Clone':
                                initiateClone({ gameState, cloningPlayer: activePlayer });
                                break;
                            case 'Flip':
                                initiateFlip({ gameState, flippingPlayer: activePlayer });
                                break;
                            case 'Swap':
                                initiateSwap({ gameState, swappingPlayer: activePlayer });
                                break;
                            case 'Up':
                                initiateUpDown({ gameState, direction: 'up' });
                                break;
                            case 'Down':
                                initiateUpDown({ gameState, direction: 'down' });
                                break;
                        }
                        break;
                    case 'end':
                        endGame();
                        break;
                }
            }

            socketService.updateWheelSpinDetails(undefined);
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
    }, [scrollY, isSpinning]);

    // Listen for synchronized wheel spin events
    useEffect(() => {
        console.log('WheelScreen2: wheelSpinDetails for wheelSpin?', gameState?.wheelSpinDetails);
        if (gameState?.wheelSpinDetails !== undefined) {
            performSynchronizedSpin();
        } else {
            setIsSpinning(false);
        }
    }, [gameState?.wheelSpinDetails]);

    // Initiate a spin (only active player or host)
    const initiateSpin = () => {
        if (!segments.length || isSpinning) return;
        // Generate random final index
        const randomSpins = 40 + Math.floor(Math.random() * 11);
        const scrollAmount = (randomSpins * ITEM_HEIGHT);
        const finalIndex = (currentWheelIndex + randomSpins) % segments.length;
        const duration = 3000 + Math.random() * 2000; // 3-5 seconds

        const wheelSpinDetails: WheelSpinDetails = {
            spinningPlayerId: gameState?.activePlayer || '',
            finalIndex,
            scrollAmount,
            duration,
        };

        // Broadcast the synchronized spin to all players
        socketService.updateWheelSpinDetails(wheelSpinDetails);
    };

    // Only allow spin if current user is host or active player
    const canSpin = currentUser && (currentUser.isHost || gameState?.activePlayer === currentUser.id);

    // Handler for scroll gesture to trigger spin
    const handleScrollEndDrag = (event: any) => {
        if (canSpin && !isSpinning) {
            initiateSpin();
        }
    };

    const handlePromptRulePress = (rule: Rule) => {
        setCurrentModal('RuleDetails');
        setSelectedRule(rule);
    };

    const handleInitiateAccusation = (accusationDetails: ActiveAccusationDetails) => {
        initiateAccusation(accusationDetails);
        setSelectedRule(null);
    };

    if (!gameState || !currentUser) {
        return (
            <Backdrop>
                <SafeAreaView style={shared.container}>
                    <ScrollView style={shared.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
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
            <SafeAreaView style={styles.mainContainer}>
                <View style={styles.wheelContainer}>
                    {/* Wheel */}
                    <AnimatedFlatList
                        ref={flatListRef}
                        data={paddedSegments as WheelSegmentType[]}
                        keyExtractor={(_, idx) => idx.toString()}
                        renderItem={({ item }) => (
                            <WheelSegment plaque={item.layers[item.currentLayerIndex]} color={item.segmentColor} />
                        )}
                        scrollEnabled={canSpin && !isSpinning || false}
                        style={{
                            height: ITEM_HEIGHT * VISIBLE_ITEMS,
                            width: '100%',
                            overflow: 'hidden',
                        }}
                        contentContainerStyle={{ alignItems: 'stretch', padding: 0, margin: 0, paddingHorizontal: 0 }}
                        showsVerticalScrollIndicator={false}
                        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                        onScrollEndDrag={handleScrollEndDrag}
                    />
                    {/* No spin button! */}
                </View>

                <SimpleModal
                    visible={currentModal === 'RuleModal'}
                    title={'RULE'}
                    description={`${gameState.players.find(player => player.id === gameState.activePlayer)?.name || ''} has received the following rule:`}
                    content={<Plaque
                        plaque={selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0]}
                    />}
                    onAccept={() => socketService.broadcastNavigateToScreen('Game')}
                    acceptButtonDisplayed={currentUser.id === gameState.activePlayer}
                    cancelButtonDisplayed={false}
                />

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
                        setCurrentModal(undefined);
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

                {/* Modal Popup */}
                <ModifierModals
                    currentModal={currentModal || ''}
                    gameState={gameState}
                    currentUser={currentUser}
                />
            </SafeAreaView>
        </Backdrop>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '70%',
    },
    wheelContainer: {
        backgroundColor: 'black',
        overflow: 'hidden',
        marginVertical: 32,
        width: '70%',
        position: 'relative',
        justifyContent: 'center',
    },
    spinButton: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000000',
        marginTop: 30,
    },
    spinButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 20,
        color: '#ffffff',
    },
});
