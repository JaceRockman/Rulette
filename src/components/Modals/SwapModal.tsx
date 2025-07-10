import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Rule, Player } from '../../types/game';

interface SwapModalProps {
    visible: boolean;
    onClose: () => void;
    onOwnRuleSelect: (rule: Rule) => void;
    onOtherPlayerSelect: (player: Player) => void;
    onOtherRuleSelect: (rule: Rule) => void;
    swapStep: 'selectOwnRule' | 'selectOtherRule';
    selectedOwnRule: Rule | null;
    selectedOtherPlayer: Player | null;
    gameState: any;
    activePlayerId: string;
}

export default function SwapModal({
    visible,
    onClose,
    onOwnRuleSelect,
    onOtherPlayerSelect,
    onOtherRuleSelect,
    swapStep,
    selectedOwnRule,
    selectedOtherPlayer,
    gameState,
    activePlayerId
}: SwapModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {swapStep === 'selectOwnRule' ? 'Select Your Rule to Swap' : 'Select Other Player\'s Rule'}
                    </Text>
                    <Text style={styles.modalDescription}>
                        {swapStep === 'selectOwnRule'
                            ? 'Choose one of your rules to swap with another player'
                            : `Choose a rule from ${selectedOtherPlayer?.name} to swap with "${selectedOwnRule?.text}"`
                        }
                    </Text>

                    <ScrollView style={styles.scrollView}>
                        {swapStep === 'selectOwnRule' ? (
                            // Step 1: Select own rule
                            <>
                                <Text style={styles.sectionTitle}>
                                    Your Rules:
                                </Text>
                                {gameState?.rules
                                    .filter((rule: Rule) => rule.assignedTo === activePlayerId && rule.isActive)
                                    .map((rule: Rule) => (
                                        <TouchableOpacity
                                            key={rule.id}
                                            style={styles.ruleButton}
                                            onPress={() => onOwnRuleSelect(rule)}
                                        >
                                            <Text style={styles.ruleButtonText}>
                                                {rule.text}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                <Text style={styles.sectionTitle}>
                                    Other Players:
                                </Text>
                                {gameState?.players
                                    .filter((player: Player) => player.id !== activePlayerId && !player.isHost)
                                    .map((player: Player) => {
                                        const playerRules = gameState?.rules.filter((rule: Rule) => rule.assignedTo === player.id && rule.isActive);
                                        if (playerRules && playerRules.length > 0) {
                                            return (
                                                <TouchableOpacity
                                                    key={player.id}
                                                    style={styles.playerButton}
                                                    onPress={() => onOtherPlayerSelect(player)}
                                                >
                                                    <Text style={styles.playerButtonText}>
                                                        {player.name} ({playerRules.length} rules)
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }
                                        return null;
                                    })}
                            </>
                        ) : (
                            // Step 2: Select other player's rule
                            <>
                                {selectedOtherPlayer && (
                                    <>
                                        <Text style={styles.sectionTitle}>
                                            {selectedOtherPlayer.name}'s Rules:
                                        </Text>
                                        {gameState?.rules
                                            .filter((rule: Rule) => rule.assignedTo === selectedOtherPlayer.id && rule.isActive)
                                            .map((rule: Rule) => (
                                                <TouchableOpacity
                                                    key={rule.id}
                                                    style={styles.ruleButton}
                                                    onPress={() => onOtherRuleSelect(rule)}
                                                >
                                                    <Text style={styles.ruleButtonText}>
                                                        {rule.text}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </>
                                )}
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onClose}
                        >
                            <Text style={styles.modalButtonText}>
                                {swapStep === 'selectOtherRule' ? 'Back' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>

                        {swapStep === 'selectOtherRule' && (
                            <TouchableOpacity
                                style={styles.cancelSwapButton}
                                onPress={onClose}
                            >
                                <Text style={styles.modalButtonText}>
                                    Cancel Swap
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    scrollView: {
        maxHeight: 300,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    ruleButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    ruleButtonText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    playerButton: {
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    playerButtonText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    modalButton: {
        backgroundColor: '#6b7280',
        borderRadius: 8,
        padding: 16,
        flex: 1,
        marginRight: 8,
    },
    cancelSwapButton: {
        backgroundColor: '#dc3545',
        borderRadius: 8,
        padding: 16,
        flex: 1,
        marginLeft: 8,
    },
    modalButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 