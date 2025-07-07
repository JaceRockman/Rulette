import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Rule, Player } from '../../types/game';

interface AccusationDecisionModalProps {
    visible: boolean;
    accusationDetails: { accuser: Player; accused: Player; rule: Rule } | null;
    onAccept: () => void;
    onDecline: () => void;
}

export default function AccusationDecisionModal({
    visible,
    accusationDetails,
    onAccept,
    onDecline
}: AccusationDecisionModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onDecline}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Rule Violation Accusation</Text>
                    <Text style={styles.modalRuleText}>
                        {accusationDetails?.accuser.name} has accused {accusationDetails?.accused.name} of breaking rule:
                    </Text>
                    <Text style={[styles.modalRuleText, { fontStyle: 'italic', marginTop: 10 }]}>
                        "{accusationDetails?.rule.text}"
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.modalCancelButton, { flex: 1, marginRight: 10 }]}
                            onPress={onDecline}
                        >
                            <Text style={styles.modalCancelText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.acceptButton, { flex: 1, marginLeft: 10 }]}
                            onPress={onAccept}
                        >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
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
    modalRuleText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
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
    acceptButton: {
        backgroundColor: '#cba84b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 