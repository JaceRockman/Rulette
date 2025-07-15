import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Rule, Player, ActiveAccusationDetails } from '../types/game';
import Plaque from '../components/Plaque';
import { colors, shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

interface AccusationJudgementModalProps {
    visible: boolean;
    activeAccusationDetails: ActiveAccusationDetails | null;
    currentUser: Player;
    onAccept: () => void;
    onDecline: () => void;
}

export default function AccusationJudgementModal({
    visible,
    activeAccusationDetails,
    currentUser,
    onAccept,
    onDecline,
}: AccusationJudgementModalProps) {
    if (!activeAccusationDetails) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>Rule Violation</Text>
                    <Text style={shared.modalDescription}>
                        {activeAccusationDetails.accuser.name} has accused {activeAccusationDetails.accused?.name} of breaking rule:
                    </Text>
                    <Plaque text={activeAccusationDetails.rule.text} plaqueColor={activeAccusationDetails.rule.plaqueColor} />

                    {currentUser?.isHost && (
                        <View style={shared.buttonContainer}>
                            <PrimaryButton title="Accept" onPress={onAccept} />
                            <SecondaryButton title="Decline" onPress={onDecline} />
                        </View>)}
                    {!currentUser?.isHost && (
                        <Text style={shared.modalDescription}>Waiting for host to decide...</Text>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}