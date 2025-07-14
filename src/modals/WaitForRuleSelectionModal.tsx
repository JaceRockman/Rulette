import React from 'react';
import { Modal, View, Text } from 'react-native';
import { Player } from '../types/game';
import { shared } from '../shared/styles';

interface WaitForRuleSelectionModalProps {
    visible: boolean;
    accuser: Player | null;
    accused: Player | null;
}

export default function WaitForRuleSelectionModal({
    visible,
    accuser,
    accused,
}: WaitForRuleSelectionModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>Accusation Accepted!</Text>
                    <Text style={shared.modalDescription}>
                        Waiting for {accuser?.name} to select a rule to give to {accused?.name}...
                    </Text>
                </View>
            </View>
        </Modal >
    );
}