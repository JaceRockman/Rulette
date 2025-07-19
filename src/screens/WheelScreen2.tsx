import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, FlatList, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGame } from '../context/GameContext';
import WheelSegment from '../components/WheelSegment';
import socketService from '../services/socketService';
import SimpleModal from '../modals/SimpleModal';
import shared from '../shared/styles';
import ModifierModals, { initiateClone, initiateFlip, initiateSwap, initiateUpDown } from '../modals/ModifierModals';
import Backdrop from '../components/Backdrop';
import { ActiveAccusationDetails, Player, Rule, WheelSegment as WheelSegmentType, WheelSpinDetails } from '../types/game';
import { RootStackParamList } from '../../App';
import Plaque from '../components/Plaque';
import { AccusationJudgementModal, PromptPerformanceModal, PromptResolutionModal, RuleDetailsModal, RuleSelectionModal } from '../modals';
import PromptAndAccusationModals from '../modals/PromptAndAccusationModals';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList<WheelSegmentType>;

export default function WheelScreen2() {
    const { gameState, currentUser, assignRule, givePrompt, initiateAccusation, acceptPrompt, shredRule, endPrompt, endGame, endAccusation, acceptAccusation, updatePoints,
        triggerCloneModifier, triggerFlipModifier, triggerSwapModifier, triggerUpDownModifier } = useGame();
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentWheelIndex, setCurrentWheelIndex] = useState<number>(0);
    const flatListRef = useRef<FlatList<WheelSegmentType>>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const currentScrollOffset = useRef(0);

    const [currentModal, setCurrentModal] = useState<string | undefined>(undefined);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [selectedSegment, setSelectedSegment] = useState<WheelSegmentType | null>(null);
    const selectedSegmentRef = useRef<WheelSegmentType | null>(null); // Preserve selectedSegment during prompt workflow

    console.log('segments', gameState?.wheelSegments);
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

    // Handler for scroll gesture to trigger spin
    const handleScrollEndDrag = (event: any) => {
        if (canSpin && !isSpinning) {
            initiateSpin();
        }
    };

    // Initiate a spin (only active player or host)
    const initiateSpin = () => {
        if (!segments.length || isSpinning || gameState?.wheelSpinDetails !== undefined) return;
        // Generate random final index
        const randomSpins = 41;
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

    // Listen for synchronized wheel spin events
    useEffect(() => {
        console.log('UseEffect: wheelSpinDetails updated')
        if (gameState?.wheelSpinDetails !== undefined) {
            performSynchronizedSpin();
        } else {
            setIsSpinning(false);
        }
    }, [gameState?.wheelSpinDetails]);

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
            setCurrentWheelIndex(finalIndex);

            // Snap to the final position, centered in the wheel
            // const centerOffset = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
            // const finalScroll = (finalIndex * ITEM_HEIGHT) + centerOffset;
            // flatListRef.current?.scrollToOffset({ offset: finalScroll, animated: false });

            // Store the selected segment for later processing
            const spunSegment = segments[finalIndex];
            const selectedPlaque = spunSegment?.layers[spunSegment?.currentLayerIndex || 0];
            const activePlayer = gameState?.players.find(player => player.id === gameState?.activePlayer);

            setSelectedSegment(spunSegment);
            selectedSegmentRef.current = spunSegment; // Store in ref to preserve during prompt workflow

            if (gameState && activePlayer) {
                switch (selectedPlaque?.type) {
                    case 'rule':
                        if (currentUser?.isHost) {
                            assignRule(selectedPlaque?.id || '', activePlayer?.id || '');
                        }
                        setCurrentModal('RuleModal');
                        break;
                    case 'prompt':
                        if (currentUser?.isHost) {
                            givePrompt(selectedPlaque?.id || '', gameState?.activePlayer || '');
                        }
                        setCurrentModal('PromptPerformance');
                        break;
                    case 'modifier':
                        switch (selectedPlaque?.text) {
                            case 'Clone':
                                initiateClone({ cloningPlayer: activePlayer, playerRules: gameState.rules.filter(rule => rule.assignedTo === activePlayer.id), triggerCloneModifier: triggerCloneModifier });
                                break;
                            case 'Flip':
                                initiateFlip({ flippingPlayer: activePlayer, playerRules: gameState.rules.filter(rule => rule.assignedTo === activePlayer.id), triggerFlipModifier: triggerFlipModifier });
                                break;
                            case 'Swap':
                                initiateSwap({ swappingPlayer: activePlayer, playerRules: gameState.rules.filter(rule => rule.assignedTo === activePlayer.id), triggerSwapModifier: triggerSwapModifier });
                                break;
                            case 'Up':
                                initiateUpDown({ direction: 'up', triggerUpDownModifier: triggerUpDownModifier });
                                break;
                            case 'Down':
                                initiateUpDown({ direction: 'down', triggerUpDownModifier: triggerUpDownModifier });
                                break;
                        }
                        break;
                    case 'end':
                        if (currentUser?.isHost) {
                            setCurrentModal('EndGameDecision');
                        } else {
                            setCurrentModal('AwaitEndGameDecision');
                        }
                        break;
                }
            }

            if (currentUser?.isHost) {
                socketService.updateWheelSpinDetails(undefined);
            }

        });
    };

    // Sync the FlatList scroll position with the animation
    React.useEffect(() => {
        console.log('UseEffect: sync scroll position')
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


    const finishWheelSpin = () => {
        console.log('finishWheelSpin');
        console.log('wheel state', { isSpinning, currentWheelIndex, scrollY, currentScrollOffset, currentModal, selectedRule, selectedSegment });
        // Use the centralized server-side approach
        if (selectedSegment || selectedSegmentRef.current) {
            const segmentToUse = selectedSegment || selectedSegmentRef.current;
            socketService.completeWheelSpin(segmentToUse?.id);
        }

        // Reset local state
        setSelectedSegment(null);
        selectedSegmentRef.current = null;
        setCurrentWheelIndex(0);
        setCurrentModal(undefined);
    };


    // Interrupt prompts with accusations but be able to return to the prompt performance modal
    React.useEffect(() => {
        console.log('UseEffect: prompt, accusation, or rule updated')
        if (selectedRule) {
            setCurrentModal('RuleDetails');
            return;
        }
        if (gameState?.activePromptDetails !== undefined && gameState?.activeAccusationDetails === undefined) {
            if (!gameState?.activePromptDetails?.isPromptAccepted) {
                setCurrentModal('PromptPerformance');
            } else {
                setCurrentModal('PromptResolution');
            }
        }
    }, [gameState?.activePromptDetails, gameState?.activeAccusationDetails, selectedRule]);

    useEffect(() => {
        console.log('UseEffect: accusation updated')
        if (gameState?.activeAccusationDetails?.accusationAccepted) {
            if (gameState?.activeAccusationDetails?.accuser?.id === currentUser?.id) {
                setCurrentModal('SuccessfulAccusationRuleSelection');
            } else {
                setCurrentModal('AwaitAccusationRuleSelection');
            }
        }
    }, [gameState?.activeAccusationDetails?.accusationAccepted]);

    // Only allow spin if current user is host or active player
    const canSpin = currentUser && (currentUser.isHost || gameState?.activePlayer === currentUser.id);

    const handlePromptRulePress = (rule: Rule) => {
        setSelectedRule(rule);
        setCurrentModal('RuleDetails');
    };

    const handleInitiateAccusation = (accusationDetails: ActiveAccusationDetails) => {
        initiateAccusation(accusationDetails);
        setSelectedRule(null);
    };

    const promptFailure = () => {
        endPrompt();
        finishWheelSpin();
    }

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

                {/* <SimpleModal
                    visible={currentModal === 'RuleModal'}
                    title={'RULE'}
                    description={`${gameState.players.find(player => player.id === gameState.activePlayer)?.name || ''} has received the following rule:`}
                    content={<Plaque
                        plaque={selectedSegment?.layers[selectedSegment?.currentLayerIndex || 0]}
                    />}
                    onAccept={finishWheelSpin}
                    acceptButtonDisplayed={currentUser.id === gameState.activePlayer}
                    cancelButtonDisplayed={false}
                /> */}


                {/* Prompt Initiated Modal */}
                {/* <PromptPerformanceModal
                    visible={currentModal === 'PromptPerformance'}
                    selectedPlayerForAction={gameState?.activePromptDetails?.selectedPlayer || null}
                    prompt={gameState?.activePromptDetails?.selectedPrompt || null}
                    onPressRule={handlePromptRulePress}
                    onSuccess={() => {
                        acceptPrompt();
                        updatePoints(gameState?.activePlayer || '', 2);
                    }}
                    onFailure={() => {
                        promptFailure();
                    }}
                /> */}

                {/* Prompt Resolution Modal */}
                {/* <PromptResolutionModal
                    visible={currentModal === 'PromptResolution'}
                    selectedPlayerForAction={gameState?.activePromptDetails?.selectedPlayer || null}
                    prompt={gameState?.activePromptDetails?.selectedPrompt || null}
                    onShredRule={(ruleId: string) => {
                        shredRule(ruleId);
                        endPrompt();
                        finishWheelSpin();
                    }}
                    onSkip={() => {
                        finishWheelSpin();
                        endPrompt();
                    }}
                /> */}

                {/* Rule Details Popup */}
                {/* <RuleDetailsModal
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
                /> */}


                {/* Accusation Judgement Popup */}
                {/* <AccusationJudgementModal
                    visible={currentModal === 'AccusationJudgement'}
                    activeAccusationDetails={gameState?.activeAccusationDetails || null}
                    currentUser={currentUser!}
                    onAccept={() => {
                        acceptAccusation();
                        setSelectedRule(null);
                    }}
                    onDecline={() => {
                        endAccusation();
                        setSelectedRule(null);

                    }}
                /> */}

                {/* Accusation Rule Passing Modal */}
                {/* <RuleSelectionModal
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
                /> */}

                {/* Accusation Rule Passing Awaiting Modal */}
                {/* <SimpleModal
                    visible={currentModal === 'AwaitAccusationRuleSelection'}
                    title={`Rule Passing Awaiting`}
                    description={`Waiting for ${gameState?.activeAccusationDetails?.accuser?.name} to select a rule to give to ${gameState?.activeAccusationDetails?.accused?.name}...`}
                /> */}

                {/* Prompt and Accusation Modals */}
                <PromptAndAccusationModals
                    setCurrentModal={setCurrentModal}
                    currentModal={currentModal || ''}
                    currentUser={currentUser}
                    selectedPlayerForAction={gameState?.players.find(player => player.id === gameState?.activePlayer) || null}
                    onFinishModifier={finishWheelSpin}
                />

                {/* Modal Popup */}
                <ModifierModals
                    currentModal={currentModal || ''}
                    currentUser={currentUser}
                    onFinishModifier={finishWheelSpin}
                />


                {/* End Game Modals */}
                {/* End Game Decision Modal */}
                <SimpleModal
                    visible={currentModal === 'EndGameDecision'}
                    title={`End Game?`}
                    description={`Would you like to end the game?`}
                    onAccept={() => {
                        finishWheelSpin();
                        endGame();
                    }}
                    onClose={() => {
                        setCurrentModal(undefined);
                    }}
                />

                {/* Await End Game Decision Modal */}
                <SimpleModal
                    visible={currentModal === 'AwaitEndGameDecision'}
                    title={`Game Over`}
                    description={`Waiting for host to end the game...`}
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
