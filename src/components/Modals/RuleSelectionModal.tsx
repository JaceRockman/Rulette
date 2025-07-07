import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule, Player } from '../../types/game';

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

                    <ScrollView style={styles.modalPlayerList}>
                        {rules.map((rule) => (
                            <TouchableOpacity
                                key={rule.id}
                                style={styles.modalPlayerItem}
                                onPress={() => onSelectRule(rule.id)}
                            >
                                <Text style={styles.modalPlayerName}>{rule.text}</Text>
                            </TouchableOpacity>
                        ))}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
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
    modalPlayerList: {
        maxHeight: 200,
    },
    modalPlayerItem: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    modalPlayerName: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#6b7280',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 