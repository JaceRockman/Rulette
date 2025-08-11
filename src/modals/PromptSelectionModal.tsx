import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { showAlert } from '../shared/alert';
import { Plaque, Prompt } from '../types/game';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

import { colors, shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ExitModalButton from '../components/ExitModalButton';

interface PromptSelectionModalProps {
    visible: boolean;
    title: string;
    description: string;
    prompts: Prompt[];
    onAccept: (prompt: Prompt | null) => void;
    onClose: () => void;
    cancelButtonText?: string;
}

export default function PromptSelectionModal({
    visible,
    title,
    description,
    prompts,
    onAccept,
    onClose,
    cancelButtonText = 'Cancel'
}: PromptSelectionModalProps) {
    // Error handler for empty content
    useEffect(() => {
        if (visible && (!prompts || prompts.length === 0)) {
            showAlert('No Prompts Available', 'There are no prompts available for selection. This might be due to a game state error.');
            onClose();
        }
    }, [visible, prompts, onClose]);

    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

    const toggleSelectedPrompt = (prompt: Plaque) => {
        if (selectedPrompt?.id === prompt.id) {
            setSelectedPrompt(null);
        } else {
            setSelectedPrompt(prompt as Prompt);
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
                    <ExitModalButton />
                    <Text style={shared.modalTitle}>{title}</Text>
                    <Text style={shared.modalDescription}>{description}</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={shared.modalSubtitle}>Prompts</Text>
                        {render2ColumnPlaqueList({
                            plaques: prompts,
                            selectedPlaque: selectedPrompt,
                            onPress: (prompt: Plaque) => toggleSelectedPrompt(prompt as Prompt)
                        })}
                    </ScrollView>

                    <View style={shared.buttonContainer}>
                        <SecondaryButton title={cancelButtonText} onPress={() => {
                            setSelectedPrompt(null);
                            onClose();
                        }} />

                        <PrimaryButton title="Accept"
                            onPress={() => {
                                onAccept(selectedPrompt || null);
                                setSelectedPrompt(null);
                            }}
                            buttonStyle={{ opacity: selectedPrompt ? 1 : 0.3 }}
                            disabled={!selectedPrompt} />
                    </View>
                </View>
            </SafeAreaView>
        </Modal >
    );
}