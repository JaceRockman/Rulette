import React, { useState } from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../shared/styles';
import StripedBackground from '../components/Backdrop';
import InputPlaque from '../modals/InputPlaque';
import Plaque from '../components/Plaque';
import { LAYER_PLAQUE_COLORS } from '../shared/styles';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

export default function PromptWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addPrompt, updatePlaque, dispatch, currentUser, markPromptsCompletedForUser, getPromptsByAuthor } = useGame();
    const [showInputPlaque, setShowInputPlaque] = useState(false);
    const [showEditPlaque, setShowEditPlaque] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaqueColor, setCurrentPlaqueColor] = useState('#fff');
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
    const [editingPlaqueColor, setEditingPlaqueColor] = useState('#fff');
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

        // Count existing prompt colors
        const colorCount: { [color: string]: number } = {};
        LAYER_PLAQUE_COLORS.forEach(color => colorCount[color] = 0);

        gameState?.prompts?.forEach(prompt => {
            if (prompt.plaqueColor && colorCount[prompt.plaqueColor] !== undefined) {
                colorCount[prompt.plaqueColor]++;
            }
        });

        // Find colors with minimum usage
        const minCount = Math.min(...Object.values(colorCount));
        const availableColors = LAYER_PLAQUE_COLORS.filter(color => colorCount[color] === minCount);

        // Randomly select from available colors
        const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        setCurrentPlaqueColor(selectedColor);
        setShowInputPlaque(true);
    };

    const handleConfirmPrompt = () => {
        if (inputValue.trim()) {
            addPrompt(currentUser?.id ?? 'system', inputValue.trim(), currentPlaqueColor);
            closePromptWritingPopup();
        }
    };

    const handleEditPrompt = (promptId: string, currentText: string, plaqueColor: string) => {
        setEditingPromptId(promptId);
        setInputValue(currentText);
        setEditingPlaqueColor(plaqueColor);
        setShowEditPlaque(true);
    };

    const handleConfirmEdit = () => {
        if (inputValue.trim() && editingPromptId) {
            updatePlaque(editingPromptId, inputValue.trim(), 'prompt');
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

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingTop: 100, alignItems: 'center', paddingBottom: 50, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity
                        style={[canContinue ? shared.button : shared.disabledButton]}
                        onPress={handleAddPrompt}
                        disabled={!canAddPrompt}
                    >
                        <Text style={shared.buttonText}>
                            {canAddPrompt ? 'Add Prompt' : `Max Prompts (${numPrompts})`}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20, flex: 1 }}>
                        {render2ColumnPlaqueList({
                            plaques: getPromptsByAuthor(currentUser?.id ?? 'system'),
                            onPress: handleEditPrompt,
                            authorId: currentUser?.id ?? 'system'
                        })}
                    </View>

                    {/* Spacer to push Done button to bottom */}
                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                        style={[canContinue ? shared.button : shared.disabledButton]}
                        onPress={canContinue ? handleDone : undefined}
                        disabled={!canContinue}
                    >
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