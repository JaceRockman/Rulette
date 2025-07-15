import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule } from '../types/game';
import { Plaque } from '../types/game';

import { colors, shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

interface RuleSelectionModalProps {
    visible: boolean;
    title: string;
    description: string;
    rules: Rule[];
    onAccept: (rule: Rule) => void;
    onClose: () => void;
    cancelButtonText?: string;
}

export default function RuleSelectionModal({
    visible,
    title,
    description,
    rules,
    onAccept,
    onClose,
    cancelButtonText = 'Cancel'
}: RuleSelectionModalProps) {

    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    const toggleSelectedRule = (rule: Plaque) => {
        if (selectedRule?.id === rule.id) {
            setSelectedRule(null);
        } else {
            setSelectedRule(rule as Rule);
        }
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>{title}</Text>
                    <Text style={shared.modalDescription}>{description}</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {render2ColumnPlaqueList({
                            plaques: rules,
                            selectedPlaque: selectedRule,
                            onPress: (rule: Plaque) => toggleSelectedRule(rule)
                        })}
                    </ScrollView>
                    <View style={shared.buttonContainer}>
                        <SecondaryButton title={cancelButtonText} onPress={() => {
                            setSelectedRule(null)
                            onClose()
                        }} />

                        <PrimaryButton
                            title="Accept"
                            onPress={() => {
                                onAccept(selectedRule as Rule)
                                setSelectedRule(null)
                            }}
                            disabled={!selectedRule} />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}