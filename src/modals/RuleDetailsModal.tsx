import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Rule, Player, ActiveAccusationDetails } from '../types/game';
import { colors } from '../shared/styles';
import { shared } from '../shared/styles';
import Plaque from '../components/Plaque';
import { SecondaryButton } from '../components/Buttons';

interface RuleDetailsModalProps {
    visible: boolean;
    rule: Rule | null;
    viewingPlayer: Player | null;
    viewedPlayer: Player | null;
    isAccusationInProgress: boolean;
    onAccuse: (accusationDetails: ActiveAccusationDetails) => void;
    onClose: () => void;
}

export default function RuleDetailsModal({
    visible,
    rule,
    viewingPlayer,
    viewedPlayer,
    isAccusationInProgress,
    onAccuse,
    onClose
}: RuleDetailsModalProps) {
    if (!visible || !rule) return null;

    const plaqueColor = rule.plaqueColor || colors.gameChangerWhite;

    const playerIsViewingOwnRule = viewingPlayer === viewedPlayer;

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
                    <Plaque plaque={rule} />

                    {!playerIsViewingOwnRule && (
                        <SecondaryButton
                            title="Accuse!"
                            onPress={() => onAccuse({ rule, accuser: viewingPlayer!, accused: viewedPlayer! })}
                            disabled={isAccusationInProgress}
                            buttonStyle={{ width: '40%', opacity: isAccusationInProgress ? 0.5 : 1 }}
                        />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}