import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule, Player } from '../types/game';
import Plaque from '../components/Plaque';
import { colors } from '../shared/styles';

interface SwapWorkflowModalProps {
    visible: boolean;
    onClose: () => void;
    onSwapComplete: (ownRule: Rule, targetRule: Rule, targetPlayer: Player) => void;
    gameState: any;
    sourcePlayerId?: string; // If provided, only show rules for this player
    title?: string;
    description?: string;
}

type SwapStep = 'selectOwnRule' | 'selectTargetPlayer' | 'selectTargetRule';

export default function SwapWorkflowModal({
    visible,
    onClose,
    onSwapComplete,
    gameState,
    sourcePlayerId,
    title = 'Swap Rules',
    description = 'Choose a rule to swap with another player'
}: SwapWorkflowModalProps) {
    const [currentStep, setCurrentStep] = useState<SwapStep>('selectOwnRule');
    const [selectedOwnRule, setSelectedOwnRule] = useState<Rule | null>(null);
    const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<Player | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setCurrentStep('selectOwnRule');
            setSelectedOwnRule(null);
            setSelectedTargetPlayer(null);
        }
    }, [visible]);

    // Get available rules for the source player
    const getSourceRules = (): Rule[] => {
        if (!gameState?.rules) return [];

        const playerId = sourcePlayerId || gameState?.activePlayer;
        return gameState.rules.filter((rule: Rule) =>
            rule.assignedTo === playerId && rule.isActive
        );
    };

    // Get available target players
    const getTargetPlayers = (): Player[] => {
        if (!gameState?.players) return [];

        const sourceId = sourcePlayerId || gameState?.activePlayer;
        return gameState.players.filter((player: Player) =>
            player.id !== sourceId && !player.isHost
        );
    };

    // Get rules for a specific player
    const getPlayerRules = (playerId: string): Rule[] => {
        if (!gameState?.rules) return [];
        return gameState.rules.filter((rule: Rule) =>
            rule.assignedTo === playerId && rule.isActive
        );
    };

    const handleOwnRuleSelect = (rule: Rule) => {
        setSelectedOwnRule(rule);
        setCurrentStep('selectTargetPlayer');
    };

    const handleTargetPlayerSelect = (player: Player) => {
        const playerRules = getPlayerRules(player.id);
        if (playerRules.length === 0) {
            Alert.alert('No Rules Available', `${player.name} has no rules to swap.`);
            return;
        }
        setSelectedTargetPlayer(player);
        setCurrentStep('selectTargetRule');
    };

    const handleTargetRuleSelect = (rule: Rule) => {
        if (selectedOwnRule && selectedTargetPlayer) {
            onSwapComplete(selectedOwnRule, rule, selectedTargetPlayer);
        }
    };

    const handleBack = () => {
        if (currentStep === 'selectTargetRule') {
            setCurrentStep('selectTargetPlayer');
            setSelectedTargetPlayer(null);
        } else if (currentStep === 'selectTargetPlayer') {
            setCurrentStep('selectOwnRule');
            setSelectedOwnRule(null);
        } else {
            onClose();
        }
    };

    const sourceRules = getSourceRules();
    const targetPlayers = getTargetPlayers();

    // Show error if no source rules available
    useEffect(() => {
        if (visible && currentStep === 'selectOwnRule' && sourceRules.length === 0) {
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
                Alert.alert(
                    'No Rules Available',
                    'You have no rules available for swapping.',
                    [{ text: 'OK', onPress: onClose }]
                );
            }, 0);
        }
    }, [visible, currentStep, sourceRules, onClose]);

    // Show error if no target players available
    useEffect(() => {
        if (visible && currentStep === 'selectTargetPlayer' && targetPlayers.length === 0) {
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
                Alert.alert(
                    'No Target Players',
                    'No other players available for swapping.',
                    [{ text: 'OK', onPress: onClose }]
                );
            }, 0);
        }
    }, [visible, currentStep, targetPlayers, onClose]);

    const getStepTitle = (): string => {
        switch (currentStep) {
            case 'selectOwnRule':
                return 'Select Your Rule';
            case 'selectTargetPlayer':
                return 'Select Target Player';
            case 'selectTargetRule':
                return `Select ${selectedTargetPlayer?.name}'s Rule`;
            default:
                return title;
        }
    };

    const getStepDescription = (): string => {
        switch (currentStep) {
            case 'selectOwnRule':
                return description;
            case 'selectTargetPlayer':
                return 'Choose a player to swap rules with';
            case 'selectTargetRule':
                return `Choose a rule from ${selectedTargetPlayer?.name} to swap with "${selectedOwnRule?.text}"`;
            default:
                return '';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{getStepTitle()}</Text>
                    <Text style={styles.modalDescription}>{getStepDescription()}</Text>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {currentStep === 'selectOwnRule' && (
                            <View>
                                {sourceRules.map((rule) => (
                                    <TouchableOpacity
                                        key={rule.id}
                                        style={styles.ruleItem}
                                        onPress={() => handleOwnRuleSelect(rule)}
                                    >
                                        <Plaque
                                            text={rule.text}
                                            plaqueColor={rule.plaqueColor || '#fff'}
                                            style={styles.rulePlaque}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {currentStep === 'selectTargetPlayer' && (
                            <View>
                                {targetPlayers.map((player) => {
                                    const playerRules = getPlayerRules(player.id);
                                    if (playerRules.length === 0) return null;

                                    return (
                                        <TouchableOpacity
                                            key={player.id}
                                            style={styles.playerItem}
                                            onPress={() => handleTargetPlayerSelect(player)}
                                        >
                                            <Text style={styles.playerName}>
                                                {player.name} ({playerRules.length} rules)
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {currentStep === 'selectTargetRule' && selectedTargetPlayer && (
                            <View>
                                {getPlayerRules(selectedTargetPlayer.id).map((rule) => (
                                    <TouchableOpacity
                                        key={rule.id}
                                        style={styles.ruleItem}
                                        onPress={() => handleTargetRuleSelect(rule)}
                                    >
                                        <Plaque
                                            text={rule.text}
                                            plaqueColor={rule.plaqueColor || '#fff'}
                                            style={styles.rulePlaque}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleBack}
                        >
                            <Text style={styles.cancelButtonText}>
                                {currentStep === 'selectOwnRule' ? 'Cancel' : 'Back'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxHeight: '85%',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 16,
        color: colors.text.secondary,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    scrollView: {
        maxHeight: 350,
        marginBottom: 20,
    },
    ruleItem: {
        marginBottom: 12,
    },
    rulePlaque: {
        minHeight: 80,
    },
    playerItem: {
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    playerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: colors.gameChangerRed,
        borderRadius: 12,
        padding: 16,
        minWidth: 120,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    cancelButtonText: {
        color: colors.text.light,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 