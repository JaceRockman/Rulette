import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Player } from '../../types/game';

interface PlayerSelectionModalProps {
    visible: boolean;
    title: string;
    description: string;
    players: Player[];
    onSelectPlayer: (player: Player) => void;
    onClose: () => void;
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
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalRuleText}>{description}</Text>

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

                    <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCancelText}>{cancelButtonText}</Text>
                    </TouchableOpacity>
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
    modalRuleText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalPlayerList: {
        maxHeight: 200,
    },
    modalPlayerItem: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
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