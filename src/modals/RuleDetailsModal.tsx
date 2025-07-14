import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Rule, Player } from '../types/game';
import { colors } from '../shared/styles';
import { shared } from '../shared/styles';
import Plaque from '../components/Plaque';
import { SecondaryButton } from '../components/Buttons';

interface RuleDetailsModalProps {
    visible: boolean;
    rule: Rule | null;
    currentUser: Player | null;
    isAccusationInProgress: boolean;
    onAccuse: () => void;
    onClose: () => void;
}

export default function RuleDetailsModal({
    visible,
    rule,
    currentUser,
    isAccusationInProgress,
    onAccuse,
    onClose
}: RuleDetailsModalProps) {
    if (!visible || !rule) return null;
    console.log('rule', rule);

    const plaqueColor = rule.plaqueColor || colors.gameChangerWhite;

    const playerIsViewingOwnRule = currentUser?.id === rule.assignedTo;
    console.log('playerIsViewingOwnRule', playerIsViewingOwnRule);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <TouchableOpacity style={shared.modalOverlay} onPress={onClose}>
                <TouchableOpacity style={shared.modalContent} onPress={() => { }} activeOpacity={1}>
                    <Text style={shared.modalTitle}>
                        Rule Details
                    </Text>
                    <Plaque plaqueColor={plaqueColor}
                        text={rule.text}
                        style={{ width: '50%' }}
                    />

                    {!playerIsViewingOwnRule && (
                        <SecondaryButton
                            title="Accuse!"
                            onPress={onAccuse}
                            disabled={isAccusationInProgress}
                            buttonStyle={{ width: '40%', opacity: isAccusationInProgress ? 0.5 : 1 }}
                        />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}