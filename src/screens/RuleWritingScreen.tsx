import React, { useState } from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared, { LAYER_PLAQUE_COLORS } from '../shared/styles';
import StripedBackground from '../components/Backdrop';
import InputPlaque from '../modals/InputPlaque';
import Plaque from '../components/Plaque';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

export default function RuleWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addRule, updatePlaque, currentUser, markRulesCompletedForUser, getRulesByAuthor } = useGame();
    const [showInputPlaque, setShowInputPlaque] = useState(false);
    const [showEditPlaque, setShowEditPlaque] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaqueColor, setCurrentPlaqueColor] = useState('#fff');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingPlaqueColor, setEditingPlaqueColor] = useState('#fff');

    const numRules = Number(gameState?.numRules) || 3;

    const closeRuleWritingPopup = () => {
        setInputValue('');
        setShowInputPlaque(false);
        setShowEditPlaque(false);
        setEditingRuleId(null);
        setEditingPlaqueColor('#fff');
    }

    const handleWriteRule = () => {
        setInputValue('');

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

    const handleAddRule = () => {
        if (inputValue.trim()) {
            addRule(currentUser?.id ?? 'system', inputValue.trim(), currentPlaqueColor);
            closeRuleWritingPopup();
        }
    };

    const handleEditRule = (ruleId: string, currentText: string, plaqueColor: string) => {
        setEditingRuleId(ruleId);
        setInputValue(currentText);
        setEditingPlaqueColor(plaqueColor);
        setShowEditPlaque(true);
    };

    const handleConfirmEdit = () => {
        if (inputValue.trim() && editingRuleId) {
            updatePlaque(editingRuleId, inputValue.trim(), 'rule');
            closeRuleWritingPopup();
        }
    };

    const handleContinue = () => {
        // Mark rules as completed for this player
        if (!currentUser?.id) {
            throw new Error('User ID is required to mark rules as completed');
        }

        markRulesCompletedForUser(currentUser.id);
        navigation.navigate('PromptWriting');
    };

    // Determine if player can add more rules
    const visibleRuleCount = getRulesByAuthor(currentUser?.id ?? 'system').length;
    const canAddRule = currentUser?.isHost || visibleRuleCount < numRules;
    const canContinue = currentUser?.isHost || visibleRuleCount === numRules;

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
                        onPress={handleWriteRule}
                        disabled={!canAddRule}
                    >
                        <Text style={shared.buttonText}>
                            {canAddRule ? 'Add Rule' : `Max Rules (${numRules})`}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20, flex: 1 }}>
                        {render2ColumnPlaqueList({
                            plaques: getRulesByAuthor(currentUser?.id ?? 'system'),
                            onPress: handleEditRule,
                            authorId: currentUser?.id ?? 'system'
                        })}
                    </View>

                    {/* Spacer to push Done button to bottom */}
                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                        style={[canContinue ? shared.button : shared.disabledButton]}
                        onPress={canContinue ? handleContinue : undefined}
                        disabled={!canContinue}
                    >
                        <Text style={shared.buttonText}>Done</Text>
                    </TouchableOpacity>
                </ScrollView>

                <InputPlaque
                    visible={showInputPlaque}
                    title="ADD RULE"
                    placeholder="Enter a rule..."
                    value={inputValue}
                    onChangeText={setInputValue}
                    onConfirm={handleAddRule}
                    onCancel={closeRuleWritingPopup}
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
                    onCancel={closeRuleWritingPopup}
                    maxLength={100}
                    plaqueColor={editingPlaqueColor}
                />
            </SafeAreaView>
        </StripedBackground>
    );
} 