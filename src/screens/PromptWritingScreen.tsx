import React, { useState } from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../shared/styles';
import StripedBackground from '../components/Backdrop';
import InputPlaque from '../modals/InputPlaque';
import { render2ColumnPlaqueList } from '../components/PlaqueList';
import { Plaque } from '../types/game';

export default function PromptWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, currentUser, getPromptsByAuthor, getBalancedColor, addPrompt, updatePrompt, markPromptsCompletedForUser } = useGame();
    const [showInputPlaque, setShowInputPlaque] = useState(false);
    const [showEditPlaque, setShowEditPlaque] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaqueColor, setCurrentPlaqueColor] = useState('#fff');
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
    const [editingPlaqueColor, setEditingPlaqueColor] = useState('#fff');

    const isHost = currentUser?.isHost;
    const numPrompts = Number(gameState?.numPrompts) || 3;

    const closePromptWritingPopup = () => {
        setInputValue('');
        setShowInputPlaque(false);
        setShowEditPlaque(false);
        setEditingPromptId(null);
        setEditingPlaqueColor('#fff');
    }

    const handleAddPrompt = () => {
        setInputValue('');
        setCurrentPlaqueColor(getBalancedColor('prompt'));
        setShowInputPlaque(true);
    };

    const handleConfirmPrompt = () => {
        const validatedInput = inputValue.trim();

        if (validatedInput) {
            addPrompt(currentUser?.id ?? 'system', validatedInput, currentPlaqueColor);
            closePromptWritingPopup();
        }
    };

    const handleEditPrompt = (prompt: Plaque) => {
        setEditingPromptId(prompt.id);
        setInputValue(prompt.text);
        setEditingPlaqueColor(prompt.plaqueColor || '#fff');
        setShowEditPlaque(true);
    };

    const handleConfirmEdit = () => {
        const validatedInput = inputValue.trim();

        if (validatedInput && editingPromptId) {
            updatePrompt(editingPromptId, validatedInput);
            closePromptWritingPopup();
        }
    };

    const handleDone = () => {
        // Mark prompts as completed for this player
        if (!currentUser?.id) {
            throw new Error('User ID is required to mark prompts as completed');
        }

        markPromptsCompletedForUser(currentUser.id);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Game' }],
        });
    };

    // Determine if player can add more prompts
    const visiblePromptCount = getPromptsByAuthor(currentUser?.id ?? 'system').length;
    const canAddPrompt = currentUser?.isHost || visiblePromptCount < numPrompts;
    const canContinue = currentUser?.isHost || visiblePromptCount === numPrompts;

    const promptsToDisplay = isHost ? gameState?.prompts : getPromptsByAuthor(currentUser?.id ?? 'system');

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingTop: 100, alignItems: 'center', paddingBottom: 50, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[canContinue ? shared.button : shared.disabledButton]}
                        onPress={handleAddPrompt}
                        disabled={!canAddPrompt}>
                        <Text style={shared.buttonText}>
                            {canAddPrompt ? 'Add Prompt' : `Max Prompts (${numPrompts})`}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20, flex: 1 }}>
                        {render2ColumnPlaqueList({
                            plaques: promptsToDisplay || [],
                            onPress: handleEditPrompt,
                        })}
                    </View>

                    {/* Spacer to push Done button to bottom */}
                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                        style={[canContinue ? shared.button : shared.disabledButton]}
                        onPress={canContinue ? handleDone : undefined}
                        disabled={!canContinue}>
                        <Text style={shared.buttonText}>Done</Text>
                    </TouchableOpacity>
                </ScrollView>

                <InputPlaque
                    visible={showInputPlaque}
                    title="ADD PROMPT"
                    placeholder="Enter a prompt..."
                    value={inputValue}
                    onChangeText={setInputValue}
                    onConfirm={handleConfirmPrompt}
                    onCancel={closePromptWritingPopup}
                    maxLength={100}
                    plaqueColor={currentPlaqueColor}
                />

                <InputPlaque
                    visible={showEditPlaque}
                    title="EDIT PROMPT"
                    placeholder="Edit the prompt..."
                    value={inputValue}
                    onChangeText={setInputValue}
                    onConfirm={handleConfirmEdit}
                    onCancel={closePromptWritingPopup}
                    maxLength={100}
                    plaqueColor={editingPlaqueColor}
                />
            </SafeAreaView>
        </StripedBackground>
    );
} 