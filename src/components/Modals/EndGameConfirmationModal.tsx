import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors } from '../../styles/shared';

interface EndGameConfirmationModalProps {
    visible: boolean;
    onContinue: () => void;
    onEnd: () => void;
    onClose: () => void;
}

export default function EndGameConfirmationModal({
    visible,
    onContinue,
    onEnd,
    onClose
}: EndGameConfirmationModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>GAME OVER SEGMENT!</Text>
                    <Text style={styles.description}>
                        The wheel landed on the end segment. As the host, you can choose to continue the game or end it now.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.continueButton]}
                            onPress={onContinue}
                        >
                            <Text style={styles.continueButtonText}>Continue Game</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.endButton]}
                            onPress={onEnd}
                        >
                            <Text style={styles.endButtonText}>End Game</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 40,
        margin: 20,
        width: '90%',
        maxWidth: 400,
        borderWidth: 4,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#000',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    continueButton: {
        backgroundColor: '#28a745',
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    endButton: {
        backgroundColor: '#dc3545',
    },
    endButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 