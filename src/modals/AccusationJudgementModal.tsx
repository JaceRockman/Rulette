import React from 'react';
import { Modal, View, Text, SafeAreaView } from 'react-native';
import { Player, ActiveAccusationDetails } from '../types/game';
import Plaque from '../components/Plaque';
import { shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ExitModalButton from '../components/ExitModalButton';

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
                    <ExitModalButton />
                    <Text style={shared.modalTitle}>Rule Violation</Text>
                    <Text style={shared.modalDescription}>
                        {activeAccusationDetails.accuser.name} has accused {activeAccusationDetails.accused?.name} of breaking rule:
                    </Text>
                    <Plaque plaque={activeAccusationDetails.rule} />

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