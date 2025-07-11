import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Rule, Player } from '../types/game';

interface RuleAccusationPopupProps {
    visible: boolean;
    selectedRuleForAccusation: { rule: Rule; accusedPlayer: Player } | null;
    currentUser: Player | null;
    isAccusationInProgress: boolean;
    onAccuse: () => void;
    onClose: () => void;
}

export default function RuleAccusationPopup({
    visible,
    selectedRuleForAccusation,
    currentUser,
    isAccusationInProgress,
    onAccuse,
    onClose
}: RuleAccusationPopupProps) {
    if (!visible) return null;

    const getTextColor = (plaqueColor: string) => {
        return (plaqueColor === '#fbbf24' || plaqueColor === '#fff' || plaqueColor === '#ffffff') ? '#000' : '#fff';
    };

    const plaqueColor = selectedRuleForAccusation?.rule.plaqueColor || '#ffffff';
    const textColor = getTextColor(plaqueColor);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={styles.modalOverlay}>
                <View style={[
                    styles.modalContent,
                    {
                        backgroundColor: plaqueColor,
                        borderWidth: 2,
                        borderColor: '#000000',
                    }
                ]}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>
                        Rule Details
                    </Text>
                    <Text style={[styles.modalRuleText, { color: textColor }]}>
                        {selectedRuleForAccusation?.rule.text}
                    </Text>
                    {(!currentUser || selectedRuleForAccusation?.accusedPlayer.id !== currentUser.id) && (
                        <Text style={[styles.modalSubtitle, { color: textColor }]}>
                            Accusing {selectedRuleForAccusation?.accusedPlayer.name} of breaking this rule
                        </Text>
                    )}

                    {(!currentUser || selectedRuleForAccusation?.accusedPlayer.id !== currentUser.id) && (
                        <TouchableOpacity
                            style={[
                                styles.accuseButton,
                                {
                                    opacity: isAccusationInProgress ? 0.5 : 1
                                }
                            ]}
                            onPress={onAccuse}
                            disabled={isAccusationInProgress}
                        >
                            <Text style={styles.accuseButtonText}>Accuse!</Text>
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
        backgroundColor: '#ffffff',
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
    modalRuleText: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    modalSubtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    accuseButton: {
        backgroundColor: '#cba84b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 20,
    },
    accuseButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 