import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule, Player } from '../types/game';
import Plaque from '../components/Plaque';
import { colors } from '../styles/shared';

interface UpDownWorkflowModalProps {
    visible: boolean;
    onClose: () => void;
    onUpDownComplete: (sourceRule: Rule, targetPlayer: Player, direction: 'up' | 'down') => void;
    gameState: any;
    sourcePlayerId?: string; // If provided, only show rules for this player
    direction: 'up' | 'down';
    title?: string;
    description?: string;
}

export default function UpDownWorkflowModal({
    visible,
    onClose,
    onUpDownComplete,
    gameState,
    sourcePlayerId,
    direction,
    title,
    description
}: UpDownWorkflowModalProps) {
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setSelectedRule(null);
            setTargetPlayer(null);
        }
    }, [visible]);

    // Get available rules for up/down
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

    // Get target player based on direction and source player
    const getTargetPlayer = (sourcePlayer: Player): Player | null => {
        if (!gameState?.players) return null;

        const sourceIndex = gameState.players.findIndex((p: Player) => p.id === sourcePlayer.id);
        if (sourceIndex === -1) return null;

        let targetIndex: number;
        if (direction === 'up') {
            targetIndex = sourceIndex - 1;
            while (targetIndex >= 0 && gameState.players[targetIndex].isHost) {
                targetIndex--;
            }
            if (targetIndex < 0) {
                targetIndex = gameState.players.length - 1;
                while (targetIndex >= 0 && gameState.players[targetIndex].isHost) {
                    targetIndex--;
                }
            }
        } else {
            targetIndex = sourceIndex + 1;
            while (targetIndex < gameState.players.length && gameState.players[targetIndex].isHost) {
                targetIndex++;
            }
            if (targetIndex >= gameState.players.length) {
                targetIndex = 0;
                while (targetIndex < gameState.players.length && gameState.players[targetIndex].isHost) {
                    targetIndex++;
                }
            }
        }

        if (targetIndex < 0 || targetIndex >= gameState.players.length) return null;
        return gameState.players[targetIndex];
    };

    const handleRuleSelect = (rule: Rule) => {
        setSelectedRule(rule);

        // Find the source player
        const sourcePlayer = gameState?.players.find((p: Player) => p.id === rule.assignedTo);
        if (sourcePlayer) {
            const target = getTargetPlayer(sourcePlayer);
            if (target) {
                setTargetPlayer(target);
                onUpDownComplete(rule, target, direction);
            } else {
                Alert.alert('No Target Player', `No valid target player found for ${direction} action.`);
            }
        }
    };

    const availableRules = getAvailableRules();
    const defaultTitle = direction === 'up' ? 'Pass Rule Up' : 'Pass Rule Down';
    const defaultDescription = direction === 'up'
        ? 'Choose a rule to pass to the player above you'
        : 'Choose a rule to pass to the player below you';

    // Show error if no rules available
    useEffect(() => {
        if (visible && availableRules.length === 0) {
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
                Alert.alert(
                    'No Rules Available',
                    `There are no rules available to pass ${direction}.`,
                    [{ text: 'OK', onPress: onClose }]
                );
            }, 0);
        }
    }, [visible, availableRules, onClose, direction]);

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
                    <Text style={styles.modalTitle}>{title || defaultTitle}</Text>
                    <Text style={styles.modalDescription}>{description || defaultDescription}</Text>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                    </ScrollView>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
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