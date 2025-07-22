import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Player } from '../types/game';
import { colors, shared } from '../shared/styles';

interface HostActionModalProps {
    visible: boolean;
    selectedPlayerForAction: Player | null;
    onGiveRule: () => void;
    onGivePrompt: () => void;
    onCloneRule: () => void;
    onFlipRule: () => void;
    onUpAction: () => void;
    onDownAction: () => void;
    onSwapAction: () => void;
    onClose: () => void;
}

export default function HostActionModal({
    visible,
    selectedPlayerForAction,
    onGiveRule,
    onGivePrompt,
    onCloneRule,
    onFlipRule,
    onUpAction,
    onDownAction,
    onSwapAction,
    onClose
}: HostActionModalProps) {
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
                    <Text style={shared.modalTitle}>Host Actions for {selectedPlayerForAction?.name}</Text>
                    <Text style={shared.modalDescription}>
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
                            onPress={onGivePrompt}
                        >
                            <Text style={styles.actionButtonText}>Give Prompt</Text>
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