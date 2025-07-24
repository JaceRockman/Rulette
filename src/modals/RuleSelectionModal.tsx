import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule } from '../types/game';
import { Plaque } from '../types/game';

import styles, { colors, shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

interface RuleSelectionModalProps {
    visible: boolean;
    title: string;
    description: string;
    rules: Rule[];
    description2?: string;
    rules2?: Rule[];
    onAccept: (rule1: Rule, rule2: Rule | null) => void;
    onClose?: () => void;
    cancelButtonText?: string;
}

export default function RuleSelectionModal({
    visible,
    title,
    description,
    rules,
    description2,
    rules2,
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

    const [selectedRule2, setSelectedRule2] = useState<Rule | null>(null);

    const toggleSelectedRule2 = (rule: Plaque) => {
        if (selectedRule2?.id === rule.id) {
            setSelectedRule2(null);
        } else {
            setSelectedRule2(rule as Rule);
        }
    }

    const allChoicesSelected = selectedRule && (selectedRule2 || !rules2);

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

                    <ScrollView style={styles.scrollView}
                        showsVerticalScrollIndicator={false} >
                        {render2ColumnPlaqueList({
                            plaques: rules,
                            selectedPlaque: selectedRule,
                            onPress: (rule: Plaque) => toggleSelectedRule(rule)
                        })}
                        {rules2 && (
                            <>
                                {description2 && <Text style={shared.modalDescription}>{description2}</Text>}
                                {render2ColumnPlaqueList({
                                    plaques: rules2,
                                    selectedPlaque: selectedRule2,
                                    onPress: (rule: Plaque) => toggleSelectedRule2(rule)
                                })}
                            </>
                        )}
                    </ScrollView>
                    <View style={shared.buttonContainer}>
                        {onClose && (
                            <SecondaryButton title={cancelButtonText} onPress={() => {
                                setSelectedRule(null)
                                onClose()
                            }}
                            />
                        )}

                        <PrimaryButton
                            title="Accept"
                            onPress={() => {
                                onAccept(selectedRule as Rule, selectedRule2 as Rule)
                                setSelectedRule(null)
                                setSelectedRule2(null)
                            }}
                            disabled={!allChoicesSelected} />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}