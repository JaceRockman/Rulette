import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule } from '../types/game';
import Plaque from '../components/Plaque';
import { colors } from '../shared/styles';
import FlipTextInputModal from './FlipTextInputModal';

interface FlipWorkflowModalProps {
    visible: boolean;
    onClose: () => void;
    onFlipComplete: (originalRule: Rule, flippedText: string) => void;
    gameState: any;
    sourcePlayerId?: string; // If provided, only show rules for this player
    title?: string;
    description?: string;
}

export default function FlipWorkflowModal({
    visible,
    onClose,
    onFlipComplete,
    gameState,
    sourcePlayerId,
    title = 'Flip Rule',
    description = 'Choose a rule to flip its meaning'
}: FlipWorkflowModalProps) {
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [showTextInput, setShowTextInput] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setSelectedRule(null);
            setShowTextInput(false);
        }
    }, [visible]);

    // Get available rules for flipping
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

    const handleRuleSelect = (rule: Rule) => {
        setSelectedRule(rule);
        setShowTextInput(true);
    };

    const handleFlipTextSubmit = (flippedText: string) => {
        if (selectedRule) {
            onFlipComplete(selectedRule, flippedText);
        }
    };

    const handleTextInputClose = () => {
        setShowTextInput(false);
        setSelectedRule(null);
    };

    const availableRules = getAvailableRules();

    // Show error if no rules available
    useEffect(() => {
        if (visible && availableRules.length === 0) {
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
                Alert.alert(
                    'No Rules Available',
                    'There are no rules available for flipping.',
                    [{ text: 'OK', onPress: onClose }]
                );
            }, 0);
        }
    }, [visible, availableRules, onClose]);

    return (
        <>
            <Modal
                visible={visible && !showTextInput}
                transparent={true}
                animationType="fade"
                onRequestClose={onClose}
                statusBarTranslucent={true}
            >
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <Text style={styles.modalDescription}>{description}</Text>

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

            <FlipTextInputModal
                visible={showTextInput}
                selectedRule={selectedRule}
                onFlipRule={handleFlipTextSubmit}
                onClose={handleTextInputClose}
            />
        </>
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