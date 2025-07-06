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

export default function RuleWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addRule, updateRule } = useGame();
    const [showInputPlaque, setShowInputPlaque] = useState(false);
    const [showEditPlaque, setShowEditPlaque] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaqueColor, setCurrentPlaqueColor] = useState('#fff');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingPlaqueColor, setEditingPlaqueColor] = useState('#fff');
    const numRules = Number(gameState?.numRules) || 3;

    const handleAddRule = () => {
        setInputValue('');
        // Use balanced color selection for better distribution
        const LAYER_PLAQUE_COLORS = ['#6bb9d3', '#a861b3', '#ed5c5d', '#fff'];

        // Count existing rule colors
        const colorCount: { [color: string]: number } = {};
        LAYER_PLAQUE_COLORS.forEach(color => colorCount[color] = 0);

        gameState?.rules?.forEach(rule => {
            if (rule.plaqueColor && colorCount[rule.plaqueColor] !== undefined) {
                colorCount[rule.plaqueColor]++;
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

    const handleConfirmRule = () => {
        if (inputValue.trim()) {
            addRule(inputValue.trim(), currentPlaqueColor);
            setInputValue('');
            setShowInputPlaque(false);
        }
    };

    const handleCancelRule = () => {
        setInputValue('');
        setShowInputPlaque(false);
    };

    const handleEditRule = (ruleId: string, currentText: string, plaqueColor: string) => {
        setEditingRuleId(ruleId);
        setInputValue(currentText);
        setEditingPlaqueColor(plaqueColor);
        setShowEditPlaque(true);
    };

    const handleConfirmEdit = () => {
        if (inputValue.trim() && editingRuleId) {
            updateRule(editingRuleId, inputValue.trim());
            setInputValue('');
            setShowEditPlaque(false);
            setEditingRuleId(null);
        }
    };

    const handleCancelEdit = () => {
        setInputValue('');
        setShowEditPlaque(false);
        setEditingRuleId(null);
    };

    const handleContinue = () => {
        navigation.navigate('PromptWriting');
    };

    // Create 2-column grid layout
    const renderRulesGrid = () => {
        if (!gameState?.rules) return null;

        const rows = [];
        for (let i = 0; i < gameState.rules.length; i += 2) {
            const hasSecondItem = gameState.rules[i + 1];
            const row = (
                <View key={i} style={{
                    flexDirection: 'row',
                    marginBottom: 24,
                    justifyContent: 'flex-start',
                    marginLeft: '5%'
                }}>
                    <View style={{ width: '45%' }}>
                        <Plaque
                            text={gameState.rules[i].text}
                            plaqueColor={gameState.rules[i].plaqueColor || '#fff'}
                            onPress={() => handleEditRule(gameState.rules[i].id, gameState.rules[i].text, gameState.rules[i].plaqueColor || '#fff')}
                            style={{ minHeight: 100 }}
                        />
                    </View>
                    {hasSecondItem && (
                        <View style={{ width: '45%', marginLeft: '5%' }}>
                            <Plaque
                                text={gameState.rules[i + 1].text}
                                plaqueColor={gameState.rules[i + 1].plaqueColor || '#fff'}
                                onPress={() => handleEditRule(gameState.rules[i + 1].id, gameState.rules[i + 1].text, gameState.rules[i + 1].plaqueColor || '#fff')}
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
                        onPress={handleAddRule}
                        disabled={(gameState?.rules?.length || 0) >= numRules}
                    >
                        <Text style={shared.buttonText}>Add Rule</Text>
                    </TouchableOpacity>

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20 }}>
                        {renderRulesGrid()}
                    </View>

                    {(gameState?.rules?.length || 0) === numRules && (
                        <TouchableOpacity
                            style={[shared.button, { width: 180 }]}
                            onPress={handleContinue}
                        >
                            <Text style={shared.buttonText}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <InputPlaque
                    visible={showInputPlaque}
                    title="ADD RULE"
                    placeholder="Enter a rule..."
                    value={inputValue}
                    onChangeText={setInputValue}
                    onConfirm={handleConfirmRule}
                    onCancel={handleCancelRule}
                    maxLength={100}
                    plaqueColor={currentPlaqueColor}
                />

                <InputPlaque
                    visible={showEditPlaque}
                    title="EDIT RULE"
                    placeholder="Edit the rule..."
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