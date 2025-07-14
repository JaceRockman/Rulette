import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Plaque, Prompt } from '../types/game';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

import { colors, shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

interface PromptListModalProps {
    visible: boolean;
    title: string;
    description: string;
    prompts: Prompt[];
    onAccept: (prompt: Prompt | null) => void;
    onClose: () => void;
    cancelButtonText?: string;
}

export default function PromptListModal({
    visible,
    title,
    description,
    prompts,
    onAccept,
    onClose,
    cancelButtonText = 'Cancel'
}: PromptListModalProps) {
    // Error handler for empty content
    useEffect(() => {
        if (visible && (!prompts || prompts.length === 0)) {
            Alert.alert(
                'No Prompts Available',
                'There are no prompts available for selection. This might be due to a game state error.',
                [
                    {
                        text: 'OK',
                        onPress: onClose
                    }
                ]
            );
        }
    }, [visible, prompts, onClose]);

    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const performedPrompts = prompts.filter(prompt => !prompt.isActive);
    const unperformedPrompts = prompts.filter(prompt => prompt.isActive);

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
                        <Text style={shared.modalSubtitle}>Performed Prompts</Text>
                        {render2ColumnPlaqueList({
                            plaques: performedPrompts,
                            selectedPlaque: selectedPrompt,
                            onPress: (prompt: Plaque) => setSelectedPrompt(prompt as Prompt)
                        })}
                        <Text style={shared.modalSubtitle}>Unperformed Prompts</Text>
                        {render2ColumnPlaqueList({
                            plaques: unperformedPrompts,
                            selectedPlaque: selectedPrompt,
                            onPress: (prompt: Plaque) => setSelectedPrompt(prompt as Prompt)
                        })}
                    </ScrollView>

                    <PrimaryButton title="Accept"
                        onPress={() => onAccept(selectedPrompt || null)}
                        buttonStyle={{ opacity: selectedPrompt ? 1 : 0.5 }}
                        disabled={!selectedPrompt} />

                    <SecondaryButton title={cancelButtonText} onPress={onClose} />
                </View>
            </SafeAreaView>
        </Modal>
    );
}