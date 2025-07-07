import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Player } from '../../types/game';
import { colors } from '../../styles/shared';

interface HostPlayerActionModalProps {
    visible: boolean;
    selectedPlayerForAction: Player | null;
    onGiveRule: () => void;
    onSuccessfulPrompt: () => void;
    onSuccessfulAccusation: () => void;
    onCloneRule: () => void;
    onFlipRule: () => void;
    onUpAction: () => void;
    onDownAction: () => void;
    onSwapAction: () => void;
    onClose: () => void;
}

export default function HostPlayerActionModal({
    visible,
    selectedPlayerForAction,
    onGiveRule,
    onSuccessfulPrompt,
    onSuccessfulAccusation,
    onCloneRule,
    onFlipRule,
    onUpAction,
    onDownAction,
    onSwapAction,
    onClose
}: HostPlayerActionModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Host Actions for {selectedPlayerForAction?.name}</Text>
                    <Text style={styles.modalRuleText}>
                        Select an action for this player to perform:
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerRed }]}
                            onPress={onGiveRule}
                        >
                            <Text style={styles.actionButtonText}>Give Rule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerYellow }]}
                            onPress={onSuccessfulPrompt}
                        >
                            <Text style={styles.actionButtonText}>Successful Prompt (+2 points)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerOrange }]}
                            onPress={onSuccessfulAccusation}
                        >
                            <Text style={styles.actionButtonText}>Successful Accusation (+1 point)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerBlue }]}
                            onPress={onCloneRule}
                        >
                            <Text style={styles.actionButtonText}>Clone Rule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerMaroon }]}
                            onPress={onFlipRule}
                        >
                            <Text style={styles.actionButtonText}>Flip Rule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerBlue }]}
                            onPress={onUpAction}
                        >
                            <Text style={styles.actionButtonText}>Up</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerOrange }]}
                            onPress={onDownAction}
                        >
                            <Text style={styles.actionButtonText}>Down</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gameChangerYellow }]}
                            onPress={onSwapAction}
                        >
                            <Text style={styles.actionButtonText}>Swap</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: colors.gameChangerRed }]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
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
    modalRuleText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
    },
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