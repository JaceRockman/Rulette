import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Rule, Player } from '../../types/game';

interface RuleAccusationPopupProps {
    visible: boolean;
    selectedRuleForAccusation: { rule: Rule; accusedPlayer: Player } | null;
    currentPlayer: Player | null;
    isAccusationInProgress: boolean;
    onAccuse: () => void;
    onClose: () => void;
}

export default function RuleAccusationPopup({
    visible,
    selectedRuleForAccusation,
    currentPlayer,
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
        <SafeAreaView style={styles.overlay}>
            <TouchableOpacity
                style={styles.overlayTouchable}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: plaqueColor,
                            borderWidth: 2,
                            borderColor: '#000000',
                        }
                    ]}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text style={[styles.modalTitle, { color: textColor }]}>
                        Rule Details
                    </Text>
                    <Text style={[styles.modalRuleText, { color: textColor }]}>
                        {selectedRuleForAccusation?.rule.text}
                    </Text>
                    {(!currentPlayer || selectedRuleForAccusation?.accusedPlayer.id !== currentPlayer.id) && (
                        <Text style={[styles.modalSubtitle, { color: textColor }]}>
                            Accusing {selectedRuleForAccusation?.accusedPlayer.name} of breaking this rule
                        </Text>
                    )}

                    {(!currentPlayer || selectedRuleForAccusation?.accusedPlayer.id !== currentPlayer.id) && (
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
                </TouchableOpacity>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouchable: {
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