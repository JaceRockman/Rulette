import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { showAlert } from '../shared/alert';
import { Player } from '../types/game';
import { shared } from '../shared/styles';

interface PlayerSelectionModalProps {
    visible: boolean;
    title: string;
    description: string;
    players: Player[];
    onSelectPlayer: (player: Player) => void;
    onClose?: () => void;
    cancelButtonText?: string;
}

export default function PlayerSelectionModal({
    visible,
    title,
    description,
    players,
    onSelectPlayer,
    onClose,
    cancelButtonText = 'Cancel'
}: PlayerSelectionModalProps) {
    // Error handler for empty content
    useEffect(() => {
        if (visible && (!players || players.length === 0)) {
            showAlert('No Players Available', 'There are no players available for selection. This might be due to a game state error.');
            onClose?.();
        }
    }, [visible, players, onClose]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose || (() => { })}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>{title}</Text>
                    <Text style={shared.modalDescription}>{description}</Text>

                    <ScrollView style={styles.modalPlayerList}>
                        {players.map((player) => (
                            <TouchableOpacity
                                key={player.id}
                                style={styles.modalPlayerItem}
                                onPress={() => onSelectPlayer(player)}
                            >
                                <Text style={styles.modalPlayerName}>{player.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {onClose && (
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.modalCancelText}>{cancelButtonText}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalPlayerList: {
        maxHeight: 200,
    },
    modalPlayerItem: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        width: '100%',
    },
    modalPlayerName: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#6b7280',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 