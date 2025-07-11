import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule, Player } from '../types/game';
import Plaque from '../components/Plaque';
import { colors } from '../styles/shared';

interface CloneWorkflowModalProps {
    visible: boolean;
    onClose: () => void;
    onCloneComplete: (sourceRule: Rule, targetPlayer: Player) => void;
    gameState: any;
    sourcePlayerId?: string; // If provided, only show rules for this player
    title?: string;
    description?: string;
}

type CloneStep = 'selectRule' | 'selectTarget';

export default function CloneWorkflowModal({
    visible,
    onClose,
    onCloneComplete,
    gameState,
    sourcePlayerId,
    title = 'Clone Rule',
    description = 'Choose a rule to clone to another player'
}: CloneWorkflowModalProps) {
    const [currentStep, setCurrentStep] = useState<CloneStep>('selectRule');
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setCurrentStep('selectRule');
            setSelectedRule(null);
        }
    }, [visible]);

    // Get available rules for cloning
    const getAvailableRules = (): Rule[] => {
        if (!gameState?.rules) return [];

        if (sourcePlayerId) {
            // If source player is specified, only show their rules
            return gameState.rules.filter((rule: Rule) =>
                rule.assignedTo === sourcePlayerId && rule.isActive
            );
        } else {
            // Show all assigned rules
            return gameState.rules.filter((rule: Rule) =>
                rule.assignedTo && rule.isActive
            );
        }
    };

    // Get available target players
    const getAvailableTargets = (): Player[] => {
        if (!gameState?.players) return [];

        const sourceId = sourcePlayerId || selectedRule?.assignedTo;
        return gameState.players.filter((player: Player) =>
            player.id !== sourceId && !player.isHost
        );
    };

    const handleRuleSelect = (rule: Rule) => {
        setSelectedRule(rule);
        setCurrentStep('selectTarget');
    };

    const handleTargetSelect = (targetPlayer: Player) => {
        if (selectedRule) {
            onCloneComplete(selectedRule, targetPlayer);
        }
    };

    const handleBack = () => {
        if (currentStep === 'selectTarget') {
            setCurrentStep('selectRule');
            setSelectedRule(null);
        } else {
            onClose();
        }
    };

    const availableRules = getAvailableRules();
    const availableTargets = getAvailableTargets();

    // Show error if no rules available
    useEffect(() => {
        if (visible && currentStep === 'selectRule' && availableRules.length === 0) {
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
                Alert.alert(
                    'No Rules Available',
                    'There are no rules available for cloning.',
                    [{ text: 'OK', onPress: onClose }]
                );
            }, 0);
        }
    }, [visible, currentStep, availableRules, onClose]);

    // Show error if no targets available
    useEffect(() => {
        if (visible && currentStep === 'selectTarget' && availableTargets.length === 0) {
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
                Alert.alert(
                    'No Target Players',
                    'No other players available for cloning.',
                    [{ text: 'OK', onPress: onClose }]
                );
            }, 0);
        }
    }, [visible, currentStep, availableTargets, onClose]);

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
                    <Text style={styles.modalTitle}>
                        {currentStep === 'selectRule' ? title : 'Select Target Player'}
                    </Text>
                    <Text style={styles.modalDescription}>
                        {currentStep === 'selectRule'
                            ? description
                            : `Choose who to give "${selectedRule?.text}" to`
                        }
                    </Text>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {currentStep === 'selectRule' ? (
                            // Step 1: Select rule to clone
                            <View>
                                {availableRules.map((rule) => (
                                    <TouchableOpacity
                                        key={rule.id}
                                        style={styles.ruleItem}
                                        onPress={() => handleRuleSelect(rule)}
                                    >
                                        <Plaque
                                            text={rule.text}
                                            plaqueColor={rule.plaqueColor || '#fff'}
                                            style={styles.rulePlaque}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            // Step 2: Select target player
                            <View>
                                {availableTargets.map((player) => (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={styles.playerItem}
                                        onPress={() => handleTargetSelect(player)}
                                    >
                                        <Text style={styles.playerName}>{player.name}</Text>
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
                                {currentStep === 'selectTarget' ? 'Back' : 'Cancel'}
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