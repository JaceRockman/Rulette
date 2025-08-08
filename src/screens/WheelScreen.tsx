import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, FlatList, SafeAreaView, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import WheelSegment from '../components/WheelSegment';
import socketService from '../services/socketService';
import SimpleModal from '../modals/SimpleModal';
import shared from '../shared/styles';
import ModifierModals, { initiateClone, initiateFlip, initiateSwap, initiateUpDown } from '../modals/ModifierModals';
import Backdrop from '../components/Backdrop';
import { Modifier, Prompt, Rule, WheelSegment as WheelSegmentType, WheelSpinDetails } from '../types/game';
import Plaque from '../components/Plaque';
import PromptAndAccusationModals from '../modals/PromptAndAccusationModals';
import { useIsFocused, useNavigation } from '@react-navigation/native';

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList<WheelSegmentType>;

export default function WheelScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    // if (!isFocused) return null;

    const { gameState, currentUser, assignRule, givePrompt, endGame,
        triggerCloneModifier, triggerFlipModifier, triggerSwapModifier, triggerUpDownModifier } = useGame();
    const [currentWheelIndex, setCurrentWheelIndex] = useState<number>(0);
    const flatListRef = useRef<FlatList<WheelSegmentType>>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const currentScrollOffset = useRef(0);

    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    const currentModal = gameState?.players.find(player => player.id === currentUser?.id)?.currentModal;
    const setCurrentModal = (modal: string | null) => {
        socketService.setPlayerModal(currentUser!.id, modal);
    }

    const logSetCurrentModal = (modal: string | null) => {
        console.log('WheelScreen: currentModal', modal);
        setCurrentModal(modal);
    }


    // Wheel segments from game state
    const segments = gameState?.wheelSegments || [];
    const paddedSegments = segments.length > 0
        ? [
            ...segments.slice(-Math.floor(VISIBLE_ITEMS / 2)),
            ...segments,
            ...segments.slice(0, Math.floor(VISIBLE_ITEMS / 2)),
        ]
        : [];

    // Initiate a spin (only active player or host)
    const initiateSpin = () => {
        if (!segments.length) return;

        // Generate random final index
        const randomSpins = 40 + Math.floor(Math.random() * 10);
        const scrollAmount = (randomSpins * ITEM_HEIGHT);
        const finalIndex = (currentWheelIndex + randomSpins) % segments.length;
        const duration = 300 + Math.random() * 200; // 3-5 seconds

        const newWheelSpinDetails: WheelSpinDetails = {
            spinningPlayerId: gameState?.activePlayer || '',
            finalIndex,
            scrollAmount,
            duration,
            spunSegmentId: segments[finalIndex]?.id,
            spinCompleted: false,
        };

        // Broadcast the synchronized spin to all players
        socketService.updateWheelSpinDetails(newWheelSpinDetails);
    };

    // Listen for synchronized wheel spin events
    useEffect(() => {
        if (gameState?.wheelSpinDetails !== null && gameState?.wheelSpinDetails?.spinCompleted !== true) {
            // Ensure we only run when visible on web to avoid stale offsets
            if (Platform.OS === 'web' && !isFocused) return;
            performSynchronizedSpin();
        }
    }, [gameState?.wheelSpinDetails, isFocused]);

    const performSynchronizedSpin = () => {
        if (!gameState || gameState.wheelSpinDetails === null || gameState.wheelSpinDetails?.spinCompleted === true) return;

        const { finalIndex, scrollAmount, duration } = gameState.wheelSpinDetails as WheelSpinDetails;

        // Animate the scroll with a "spin" effect - always go top to bottom
        Animated.timing(scrollY, {
            toValue: currentScrollOffset.current + scrollAmount,
            duration: duration,
            // Must be false on web because we read the value in JS to drive scroll
            useNativeDriver: Platform.OS !== 'web' ? true : false,
            easing: t => 1 - Math.pow(1 - t, 3), // ease out
        }).start(() => {
            console.log('performSynchronizedSpin');
            setCurrentWheelIndex(finalIndex);
            socketService.updateWheelSpinDetails({ ...gameState.wheelSpinDetails, spinCompleted: true } as WheelSpinDetails);

            // Snap to the final position, centered in the wheel
            // const centerOffset = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
            // const finalScroll = (finalIndex * ITEM_HEIGHT) + centerOffset;
            // flatListRef.current?.scrollToOffset({ offset: finalScroll, animated: false });

            const activePlayer = gameState?.players.find(player => player.id === gameState?.activePlayer);
            const spunSegmentId = gameState?.wheelSpinDetails?.spunSegmentId;
            const spunSegment = segments.find(seg => seg.id === spunSegmentId);
            const selectedPlaque = spunSegment?.layers[spunSegment?.currentLayerIndex || 0];

            if (gameState && activePlayer && selectedPlaque) {
                switch (selectedPlaque?.type) {
                    case 'rule':
                        handleRuleSpun(selectedPlaque as Rule);
                        break;
                    case 'prompt':
                        handlePromptSpun(selectedPlaque as Prompt);
                        break;
                    case 'modifier':
                        handleModifierSpun(selectedPlaque as Modifier);
                        break;
                    case 'end':
                        handleEndSpun();
                        break;
                }
            }
        });
    };

    const handleRuleSpun = (rule: Rule) => {
        console.log('handleRuleSpun', rule);
        if (currentUser?.isHost) {
            assignRule(rule?.id || '', gameState?.activePlayer || '');
        }
        // logSetSelectedRule(rule);
        logSetCurrentModal('RuleModal');
    }

    const handlePromptSpun = (prompt: Prompt) => {
        console.log('handlePromptSpun', prompt);
        if (currentUser?.isHost) {
            givePrompt(prompt?.id || '', gameState?.activePlayer || '');
        }
        logSetCurrentModal('PromptPerformance');
    }

    const handleModifierSpun = (modifier: Modifier) => {
        console.log('handleModifierSpun', modifier);
        const activePlayer = gameState?.players.find(player => player.id === gameState?.activePlayer);
        const playerRules = gameState?.rules.filter(rule => rule.assignedTo === activePlayer?.id);
        if (!activePlayer || !currentUser) return;
        if (!gameState) return;
        switch (modifier?.text) {
            case 'Clone':
                if (initiateClone({ cloningPlayer: activePlayer, playerRules: playerRules || [], triggerCloneModifier: triggerCloneModifier }) === 'failed') {
                    finishWheelSpin();
                } else if (currentUser?.id === activePlayer?.id) {
                    socketService.setPlayerModal(currentUser.id, "CloneActionRuleSelection");
                } else {
                    socketService.setPlayerModal(currentUser.id, "AwaitCloneRuleSelection");
                }
                break;
            case 'Flip':
                if (initiateFlip({ flippingPlayer: activePlayer, playerRules: playerRules || [], triggerFlipModifier: triggerFlipModifier }) === 'failed') {
                    finishWheelSpin();
                } else if (currentUser?.id === activePlayer?.id) {
                    socketService.setPlayerModal(currentUser.id, "FlipActionRuleSelection");
                } else {
                    socketService.setPlayerModal(currentUser.id, "AwaitFlipRuleSelection");
                }
                break;
            case 'Swap':
                if (initiateSwap({ swappingPlayer: activePlayer, playerRules: playerRules || [], triggerSwapModifier: triggerSwapModifier }) === 'failed') {
                    finishWheelSpin();
                } else if (currentUser?.id === activePlayer?.id) {
                    socketService.setPlayerModal(currentUser.id, "SwapperRuleSelection");
                } else {
                    socketService.setPlayerModal(currentUser.id, "AwaitSwapRuleSelection");
                }
                break;
            case 'Up':
                const nonHostPlayers = gameState.players.filter(p => !p.isHost);
                const nonHostPlayersWithRules = nonHostPlayers.filter(player => gameState.rules.some(rule => rule.assignedTo === player.id));
                if (nonHostPlayersWithRules.length === 0) {
                    Alert.alert('Not Enough Players with rules', `Need at least 1 player with rules for up action.`);
                    finishWheelSpin();
                } else {
                    initiateUpDown({ direction: 'up', triggerUpDownModifier: triggerUpDownModifier });
                    const playerHasRules = gameState.rules.some(rule => rule.assignedTo === currentUser?.id);
                    if (playerHasRules && !currentUser?.isHost) {
                        socketService.setPlayerModal(currentUser.id, "UpDownRuleSelection");
                    } else {
                        socketService.setPlayerModal(currentUser.id, "AwaitUpDownRuleSelection");
                    }
                }
                break;
            case 'Down':
                const nonHostPlayersDown = gameState.players.filter(p => !p.isHost);
                const nonHostPlayersWithRulesDown = nonHostPlayersDown.filter(player => gameState.rules.some(rule => rule.assignedTo === player.id));
                if (nonHostPlayersWithRulesDown.length < 1) {
                    Alert.alert('Not Enough Players with rules', `Need at least 1 player with rules for down action.`);
                    finishWheelSpin();
                } else {
                    initiateUpDown({ direction: 'down', triggerUpDownModifier: triggerUpDownModifier });
                    const playerHasRules = gameState.rules.some(rule => rule.assignedTo === currentUser?.id);
                    if (playerHasRules && !currentUser?.isHost) {
                        socketService.setPlayerModal(currentUser.id, "UpDownRuleSelection");
                    } else {
                        socketService.setPlayerModal(currentUser.id, "AwaitUpDownRuleSelection");
                    }
                }
                break;
        }
    }

    const handleEndSpun = () => {
        console.log('handleEndSpun');
        if (currentUser?.isHost) {
            setCurrentModal('EndGameDecision');
        } else {
            setCurrentModal('AwaitEndGameDecision');
        }
    }

    // Sync the FlatList scroll position with the animation
    React.useEffect(() => {
        // console.log('UseEffect: sync scroll position')
        const id = scrollY.addListener(({ value }) => {
            currentScrollOffset.current = value;

            // Use a smoother offset calculation to prevent flickering
            const wheelHeight = segments.length * ITEM_HEIGHT;
            let offset = value % wheelHeight;
            if (offset < 0) offset += wheelHeight;

            flatListRef.current?.scrollToOffset({ offset, animated: false });

            // Reset scrollY when it gets too large, but only when not spinning
            if (gameState?.wheelSpinDetails === null && value > segments.length * ITEM_HEIGHT * 10) {
                const resetValue = value % (segments.length * ITEM_HEIGHT);
                scrollY.setValue(resetValue);
                currentScrollOffset.current = resetValue;
            }
        });
        return () => scrollY.removeListener(id);
    }, [scrollY, gameState?.wheelSpinDetails?.spinCompleted]);

    const finishWheelSpin = (sideEffects?: () => void) => {

        socketService.setAllPlayerModals(null);
        socketService.broadcastNavigateToScreen('Game');
        socketService.completeWheelSpin(gameState?.wheelSpinDetails?.spunSegmentId || null);
        setCurrentWheelIndex(0);

        if (typeof sideEffects === 'function') {
            sideEffects();
        }
    };

    const shredRule = (ruleId: string) => {
        console.log('shredRule', ruleId);
        finishWheelSpin(() => {
            socketService.setAllPlayerModals(null);
            socketService.shredRule(ruleId);
            socketService.endPrompt();
        });
    }

    const getPlaqueForCurrentSegment = () => {
        if (!gameState || !gameState.wheelSpinDetails || !gameState.wheelSegments) return null;
        const spunSegment = gameState.wheelSegments.find(seg => seg.id === gameState.wheelSpinDetails?.spunSegmentId);
        if (!spunSegment) return null;
        return spunSegment.layers[spunSegment.currentLayerIndex || 0];
    }

    // Only allow spin if current user is host or active player
    const canSpin = currentUser && (currentUser.isHost || gameState?.activePlayer === currentUser.id);

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
                        scrollEnabled={canSpin && gameState?.wheelSpinDetails === null || false}
                        style={{
                            height: ITEM_HEIGHT * VISIBLE_ITEMS,
                            width: '100%',
                            overflow: 'hidden',
                        }}
                        contentContainerStyle={{ alignItems: 'stretch', padding: 0, margin: 0, paddingHorizontal: 0 }}
                        showsVerticalScrollIndicator={false}
                        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                        onScrollEndDrag={initiateSpin}
                        // RN Web doesn't always fire onScrollEndDrag reliably; provide a fallback
                        onMomentumScrollEnd={Platform.OS === 'web' ? initiateSpin : undefined}
                    />
                    {/* No spin button! */}
                </View>

                <SimpleModal
                    visible={currentModal === 'RuleModal'}
                    title={'RULE'}
                    description={`${gameState.players.find(player => player.id === gameState.activePlayer)?.name || ''} has received the following rule:`}
                    content={<Plaque
                        plaque={getPlaqueForCurrentSegment()}
                    />}
                    onAccept={finishWheelSpin}
                    acceptButtonDisplayed={currentUser.id === gameState.activePlayer}
                    cancelButtonDisplayed={false}
                />

                {/* Prompt and Accusation Modals */}
                <PromptAndAccusationModals
                    setCurrentModal={setCurrentModal}
                    currentModal={currentModal || ''}
                    setSelectedRule={setSelectedRule}
                    selectedRule={selectedRule}
                    currentUser={currentUser}
                    selectedPlayerForAction={gameState?.players.find(player => player.id === gameState?.activePlayer) || null}
                    onShredRule={shredRule}
                    onFinishPrompt={finishWheelSpin}
                />

                {/* Modal Popup */}
                <ModifierModals
                    setCurrentModal={setCurrentModal}
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
                        socketService.broadcastNavigateToScreen('GameOver');
                    }}
                    onClose={() => {
                        socketService.setAllPlayerModals(null);
                        socketService.updateWheelSpinDetails(null);
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
