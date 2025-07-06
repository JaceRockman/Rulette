import React, { useState } from 'react';
import { View, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../styles/shared';
import StripedBackground from '../components/StripedBackground';
import OutlinedText from '../components/OutlinedText';
import InputPlaque from '../components/InputPlaque';
import Plaque from '../components/Plaque';

export default function PromptWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addPrompt, updatePrompt, dispatch } = useGame();
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
        if (inputValue.trim() && (gameState?.prompts?.length || 0) < numPrompts) {
            addPrompt(inputValue.trim(), undefined, currentPlaqueColor);
            setInputValue('');
            setShowInputPlaque(false);
        }
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
        if (inputValue.trim() && editingPromptId) {
            updatePrompt(editingPromptId, inputValue.trim());
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
        // Create wheel segments after all prompts are entered
        dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });

        navigation.reset({
            index: 0,
            routes: [{ name: 'Game' }],
        });
    };

    // Create 2-column grid layout
    const renderPromptsGrid = () => {
        if (!gameState?.prompts) return null;

        const rows = [];
        for (let i = 0; i < gameState.prompts.length; i += 2) {
            const hasSecondItem = gameState.prompts[i + 1];
            const row = (
                <View key={i} style={{
                    flexDirection: 'row',
                    marginBottom: 24,
                    justifyContent: 'flex-start',
                    marginLeft: '5%'
                }}>
                    <View style={{ width: '45%' }}>
                        <Plaque
                            text={gameState.prompts[i].text}
                            plaqueColor={gameState.prompts[i].plaqueColor || '#fff'}
                            onPress={() => handleEditPrompt(gameState.prompts[i].id, gameState.prompts[i].text, gameState.prompts[i].plaqueColor || '#fff')}
                            style={{ minHeight: 100 }}
                        />
                    </View>
                    {hasSecondItem && (
                        <View style={{ width: '45%', marginLeft: '5%' }}>
                            <Plaque
                                text={gameState.prompts[i + 1].text}
                                plaqueColor={gameState.prompts[i + 1].plaqueColor || '#fff'}
                                onPress={() => handleEditPrompt(gameState.prompts[i + 1].id, gameState.prompts[i + 1].text, gameState.prompts[i + 1].plaqueColor || '#fff')}
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

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <View style={{ paddingTop: 100, alignItems: 'center' }}>
                    <TouchableOpacity
                        style={[shared.button, { marginTop: 30, width: 180 }]}
                        onPress={handleAddPrompt}
                        disabled={(gameState?.prompts?.length || 0) >= numPrompts}
                    >
                        <Text style={shared.buttonText}>Add Prompt</Text>
                    </TouchableOpacity>

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20 }}>
                        {renderPromptsGrid()}
                    </View>

                    {(gameState?.prompts?.length || 0) === numPrompts && (
                        <TouchableOpacity
                            style={[shared.button, { width: 180 }]}
                            onPress={handleDone}
                        >
                            <Text style={shared.buttonText}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>

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