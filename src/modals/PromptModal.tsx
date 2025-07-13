import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Player, Prompt, Plaque as PlaqueType } from '../types/game';
import { colors, shared } from '../shared/styles';
import Plaque from '../components/Plaque';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

interface PromptModalProps {
    visible: boolean;
    selectedPlayerForAction: Player | null;
    prompt: Prompt | null;
    onClose: () => void;
    onPressRule: (plaque: PlaqueType) => void;
}

export default function PromptModal({
    visible,
    selectedPlayerForAction,
    prompt,
    onPressRule,
    onClose
}: PromptModalProps) {
    const { gameState } = useGame();
    const promptedPlayerRules = gameState?.rules.filter(rule => rule.assignedTo?.id === selectedPlayerForAction?.id) || [];
    const currentUser = gameState?.players.find(p => p.id === socketService.getCurrentUserId());
    const isPromptedPlayer = currentUser?.id === selectedPlayerForAction?.id;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>Prompt for {selectedPlayerForAction?.name}</Text>
                    <Plaque text={prompt?.text || ''} plaqueColor={prompt?.plaqueColor || colors.gameChangerWhite} />

                    <View style={{ width: '100%' }}>
                        {/* Rules Reminder Section */}
                        {promptedPlayerRules.length > 0 && (
                            <View style={{ marginTop: 20, marginBottom: 20 }}>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        marginBottom: 15,
                                        color: (() => {
                                            return colors.gameChangerWhite;
                                        })(),
                                    }}
                                >
                                    Rules assigned to {isPromptedPlayer ? 'you' : selectedPlayerForAction?.name}:
                                </Text>
                                {render2ColumnPlaqueList({
                                    plaques: promptedPlayerRules,
                                    onPress: (plaque: PlaqueType) => {
                                        onPressRule(plaque);
                                    }
                                })}
                            </View>
                        )}

                        {/* Success/Failure Buttons */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 }}>
                            {/* Only show buttons for the host */}
                            {(() => {
                                const currentClientId = socketService.getCurrentUserId();
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
                                            <Text style={{ color: colors.gameChangerWhite, fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
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
                                            <Text style={{ color: colors.gameChangerWhite, fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                                                FAILURE (0)
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                );
                            })()}
                        </View>
                    </View>
                </View>
            </View>
        </View>
        </Modal >
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        gap: 12,
        marginTop: 20,
    },
    actionButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 