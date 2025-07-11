import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule } from '../types/game';
import Plaque from '../components/Plaque';

import { colors } from '../shared/styles';

interface RuleSelectionModalProps {
    visible: boolean;
    title: string;
    description: string;
    rules: Rule[];
    onSelectRule: (ruleId: string) => void;
    onClose: () => void;
    cancelButtonText?: string;
}

export default function RuleSelectionModal({
    visible,
    title,
    description,
    rules,
    onSelectRule,
    onClose,
    cancelButtonText = 'Cancel'
}: RuleSelectionModalProps) {
    // Error handler for empty content
    useEffect(() => {
        if (visible && (!rules || rules.length === 0)) {
            Alert.alert(
                'No Rules Available',
                'There are no rules available for selection. This might be due to a game state error.',
                [
                    {
                        text: 'OK',
                        onPress: onClose
                    }
                ]
            );
        }
    }, [visible, rules, onClose]);

    // Create 2-column grid layout
    const renderRulesGrid = () => {
        if (!rules || rules.length === 0) return null;

        const rows = [];
        for (let i = 0; i < rules.length; i += 2) {
            const hasSecondItem = rules[i + 1];
            const row = (
                <View key={i} style={styles.ruleRow}>
                    <View style={styles.ruleColumn}>
                        <Plaque
                            text={rules[i].text}
                            plaqueColor={rules[i].plaqueColor || '#fff'}
                            onPress={() => onSelectRule(rules[i].id)}
                            style={styles.rulePlaque}
                        />
                    </View>
                    {hasSecondItem && (
                        <View style={styles.ruleColumn}>
                            <Plaque
                                text={rules[i + 1].text}
                                plaqueColor={rules[i + 1].plaqueColor || '#fff'}
                                onPress={() => onSelectRule(rules[i + 1].id)}
                                style={styles.rulePlaque}
                            />
                        </View>
                    )}
                </View>
            );
            rows.push(row);
        }
        return rows;
    };

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
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalRuleText}>{description}</Text>

                    <ScrollView style={styles.modalRuleList} showsVerticalScrollIndicator={false}>
                        {renderRulesGrid()}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCancelText}>{cancelButtonText}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxHeight: '85%',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalRuleText: {
        fontSize: 16,
        color: colors.text.secondary,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalRuleList: {
        maxHeight: 350,
        marginBottom: 20,
    },
    ruleRow: {
        flexDirection: 'row',
        marginBottom: 16,
        justifyContent: 'space-between',
        width: '100%',
    },
    ruleColumn: {
        width: '48%',
    },
    rulePlaque: {
        minHeight: 80,
    },
    modalCancelButton: {
        backgroundColor: colors.gameChangerRed,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    modalCancelText: {
        color: colors.text.light,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 