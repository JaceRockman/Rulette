import React, { useState } from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../shared/styles';
import StripedBackground from '../components/Backdrop';
import OutlinedText from '../components/OutlinedText';
import InputPlaque from '../modals/InputPlaque';
import Plaque from '../components/Plaque';

export default function PromptWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addPrompt, updatePlaque, dispatch, currentUser, markPromptsCompleted, getWrittenPrompts } = useGame();
    const [showInputPlaque, setShowInputPlaque] = useState(false);
    const [showEditPlaque, setShowEditPlaque] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaqueColor, setCurrentPlaqueColor] = useState('#fff');
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
    const [editingPlaqueColor, setEditingPlaqueColor] = useState('#fff');
    const numPrompts = Number(gameState?.numPrompts) || 3;

    const handleAddPrompt = () => {
        setInputValue('');
        // Use balanced color selection for better distribution
        const LAYER_PLAQUE_COLORS = ['#6bb9d3', '#a861b3', '#ed5c5d', '#fff'];

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
        const trimmedValue = inputValue.trim();

        if (!trimmedValue) {
            // This shouldn't happen due to InputPlaque validation, but just in case
            return;
        }

        // Check if current player has reached their prompt limit
        const visiblePromptCount = getWrittenPrompts().length;
        if (visiblePromptCount >= numPrompts) {
            // This shouldn't happen due to button disabled state, but just in case
            return;
        }

        addPrompt(trimmedValue, currentPlaqueColor);
        setInputValue('');
        setShowInputPlaque(false);
    };

    const handleCancelPrompt = () => {
        setInputValue('');
        setShowInputPlaque(false);
    };

    const handleEditPrompt = (promptId: string, currentText: string, plaqueColor: string) => {
        setEditingPromptId(promptId);
        setInputValue(currentText);
        setEditingPlaqueColor(plaqueColor);
        setShowEditPlaque(true);
    };

    const handleConfirmEdit = () => {
        const trimmedValue = inputValue.trim();

        if (!trimmedValue) {
            // This shouldn't happen due to InputPlaque validation, but just in case
            return;
        }

        if (editingPromptId) {
            updatePlaque(editingPromptId, trimmedValue, 'prompt');
            setInputValue('');
            setShowEditPlaque(false);
            setEditingPromptId(null);
        }
    };

    const handleCancelEdit = () => {
        setInputValue('');
        setShowEditPlaque(false);
        setEditingPromptId(null);
    };

    const handleDone = () => {
        // Mark prompts as completed for this player
        markPromptsCompleted();

        navigation.reset({
            index: 0,
            routes: [{ name: 'Game' }],
        });
    };

    // Create 2-column grid layout
    const renderPromptsGrid = () => {
        const visiblePrompts = getWrittenPrompts();

        const rows = [];
        for (let i = 0; i < visiblePrompts.length; i += 2) {
            const hasSecondItem = visiblePrompts[i + 1];
            const row = (
                <View key={i} style={{
                    flexDirection: 'row',
                    marginBottom: 24,
                    justifyContent: 'flex-start',
                    marginLeft: '5%'
                }}>
                    <View style={{ width: '45%' }}>
                        <Plaque
                            text={visiblePrompts[i].text}
                            plaqueColor={visiblePrompts[i].plaqueColor || '#fff'}
                            onPress={() => handleEditPrompt(visiblePrompts[i].id, visiblePrompts[i].text, visiblePrompts[i].plaqueColor || '#fff')}
                            style={{ minHeight: 100 }}
                        />
                    </View>
                    {hasSecondItem && (
                        <View style={{ width: '45%', marginLeft: '5%' }}>
                            <Plaque
                                text={visiblePrompts[i + 1].text}
                                plaqueColor={visiblePrompts[i + 1].plaqueColor || '#fff'}
                                onPress={() => handleEditPrompt(visiblePrompts[i + 1].id, visiblePrompts[i + 1].text, visiblePrompts[i + 1].plaqueColor || '#fff')}
                                style={{ minHeight: 100 }}
                            />
                        </View>
                    )}
                </View>
            );
            rows.push(row);
        }
        return rows;
    };

    // Determine if player can add more prompts
    const visiblePromptCount = getWrittenPrompts().length;
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
                        style={[
                            shared.button,
                            { marginTop: 30, width: 180 },
                            !canAddPrompt && { opacity: 0.5 }
                        ]}
                        onPress={handleAddPrompt}
                        disabled={!canAddPrompt}
                    >
                        <Text style={shared.buttonText}>
                            {canAddPrompt ? 'Add Prompt' : `Max Prompts (${numPrompts})`}
                        </Text>
                    </TouchableOpacity>

                    {!canAddPrompt && (
                        <Text style={{
                            fontSize: 14,
                            color: '#666',
                            textAlign: 'center',
                            marginTop: 10,
                            fontStyle: 'italic'
                        }}>
                            You've reached the maximum number of prompts
                        </Text>
                    )}

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20, flex: 1 }}>
                        {renderPromptsGrid()}
                    </View>

                    {/* Spacer to push Done button to bottom */}
                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                        style={[
                            shared.button,
                            { width: 180, marginBottom: 30 },
                            !canContinue && { opacity: 0.5 }
                        ]}
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
                    onCancel={handleCancelPrompt}
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
                    onCancel={handleCancelEdit}
                    maxLength={100}
                    plaqueColor={editingPlaqueColor}
                />
            </SafeAreaView>
        </StripedBackground>
    );
} 