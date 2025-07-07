import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
} from 'react-native';
import { Player } from '../../types/game';

interface HostActionModalProps {
    visible: boolean;
    onClose: () => void;
    onEndGame: () => void;
    onSelectNewHost: () => void;
}

export default function HostActionModal({
    visible,
    onClose,
    onEndGame,
    onSelectNewHost,
}: HostActionModalProps) {
    const handleEndGame = () => {
        Alert.alert(
            'End Game',
            'Are you sure you want to end the game?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End Game', style: 'destructive', onPress: onEndGame }
            ]
        );
        onClose();
    };

    const handleSelectNewHost = () => {
        onSelectNewHost();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Host Options</Text>

                    <TouchableOpacity
                        style={[styles.button, styles.endGameButton]}
                        onPress={handleEndGame}
                    >
                        <Text style={styles.buttonText}>End Game</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.selectHostButton]}
                        onPress={handleSelectNewHost}
                    >
                        <Text style={styles.buttonText}>Select New Host</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        margin: 20,
        alignItems: 'center',
        minWidth: 280,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 24,
        textAlign: 'center',
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 12,
        minWidth: 200,
        alignItems: 'center',
    },
    endGameButton: {
        backgroundColor: '#ed5c5d',
    },
    selectHostButton: {
        backgroundColor: '#3b82f6',
    },
    cancelButton: {
        backgroundColor: '#6b7280',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
}); 