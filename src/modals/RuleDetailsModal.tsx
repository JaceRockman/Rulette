import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Rule, Player } from '../types/game';
import { colors } from '../shared/styles';
import { shared } from '../shared/styles';
import Plaque from '../components/Plaque';

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

    const getTextColor = (plaqueColor: string) => {
        return (plaqueColor === colors.gameChangerWhite) ? colors.gameChangerBlack : colors.gameChangerWhite;
    };

    const plaqueColor = rule.plaqueColor || colors.gameChangerWhite;

    const playerIsViewingOwnRule = currentUser?.id === rule.assignedTo;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        Rule Details
                    </Text>
                    <Plaque plaqueColor={plaqueColor} text={rule.text} />

                    {isAccusationInProgress && !playerIsViewingOwnRule && (
                        <TouchableOpacity
                            style={[
                                shared.button,
                                {
                                    opacity: isAccusationInProgress ? 0.5 : 1
                                }
                            ]}
                            onPress={() => onAccuse}
                            disabled={isAccusationInProgress}
                        >
                            <Text style={shared.buttonText}>Accuse!</Text>
                        </TouchableOpacity>
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
        alignItems: 'center',
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
        marginBottom: 12,
        textAlign: 'center',
    },
}); 