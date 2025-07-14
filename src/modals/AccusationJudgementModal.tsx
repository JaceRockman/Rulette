import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Rule, Player, ActiveAccusationDetails } from '../types/game';
import Plaque from '../components/Plaque';
import { colors } from '../shared/styles';
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
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Rule Violation</Text>
                    <Text style={styles.modalRuleText}>
                        {activeAccusationDetails.accuser.name} has accused {activeAccusationDetails.accused?.name} of breaking rule:
                    </Text>
                    <Plaque text={activeAccusationDetails.rule.text} plaqueColor={activeAccusationDetails.rule.plaqueColor} />

                    {currentUser?.isHost && (
                        <View style={styles.buttonContainer}>
                            <PrimaryButton title="Accept" onPress={onAccept} />
                            <SecondaryButton title="Decline" onPress={onDecline} />
                        </View>)}
                    {!currentUser?.isHost && (
                        <Text style={styles.modalRuleText}>Waiting for host to decide...</Text>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: colors.gameChangerWhite,
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
    }
}); 