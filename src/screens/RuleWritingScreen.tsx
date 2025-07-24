import React, { useEffect, useState } from 'react';
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
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

export default function RuleWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, currentUser, getRulesByAuthor, getBalancedColor, addRule, updateRule, markRulesCompletedForUser } = useGame();
    const [showInputPlaque, setShowInputPlaque] = useState(false);
    const [showEditPlaque, setShowEditPlaque] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaqueColor, setCurrentPlaqueColor] = useState('#fff');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingPlaqueColor, setEditingPlaqueColor] = useState('#fff');

    const isHost = currentUser?.isHost;
    const numRulesPerPlayer = Number(gameState?.settings?.customRulesAndPrompts) || 0;

    const closeRuleWritingPopup = () => {
        setInputValue('');
        setShowInputPlaque(false);
        setShowEditPlaque(false);
        setEditingRuleId(null);
        setEditingPlaqueColor('#fff');
    }

    const handleWriteRule = () => {
        setInputValue('');
        setCurrentPlaqueColor(getBalancedColor('rule'));
        setShowInputPlaque(true);
    };

    const handleAddRule = () => {
        const validatedInput = inputValue.trim();

        if (validatedInput) {
            addRule(currentUser?.id ?? 'system', validatedInput, currentPlaqueColor);
            closeRuleWritingPopup();
        }
    };

    const handleEditRule = (rule: Plaque) => {
        setEditingRuleId(rule.id);
        setInputValue(rule.text);
        setEditingPlaqueColor(rule.plaqueColor || '#fff');
        setShowEditPlaque(true);
    };

    const handleConfirmEditRule = () => {
        const validatedInput = inputValue.trim();

        if (validatedInput && editingRuleId) {
            updateRule(editingRuleId, validatedInput);
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
    const canAddRule = currentUser?.isHost || visibleRuleCount < numRulesPerPlayer;
    const canContinue = currentUser?.isHost || visibleRuleCount === numRulesPerPlayer;

    const rulesToDisplay = isHost ? gameState?.rules : getRulesByAuthor(currentUser?.id ?? 'system');

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <ScrollView
                    style={{ width: '100%' }}
                    contentContainerStyle={{ paddingTop: 120, alignItems: 'center', paddingBottom: 50, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}>
                    <PrimaryButton
                        title={canAddRule ? "Add Rule" : `Max Rules (${numRulesPerPlayer})`}
                        onPress={handleWriteRule}
                        disabled={!canAddRule}
                        buttonStyle={{ width: '40%', height: "10%", opacity: canAddRule ? 1 : 0.5 }}
                    />

                    <View style={{ marginVertical: 16, width: '100%', paddingHorizontal: 20, flex: 1 }}>
                        {render2ColumnPlaqueList({
                            plaques: rulesToDisplay || [],
                            onPress: handleEditRule,
                        })}
                    </View>

                    {/* Spacer to push Done button to bottom */}
                    <View style={{ flex: 1 }} />

                    <PrimaryButton
                        title="Done"
                        onPress={handleContinue}
                        disabled={!canContinue}
                        buttonStyle={{ width: '40%', height: "10%", opacity: canContinue ? 1 : 0.5 }}
                    />
                </ScrollView>

                <InputPlaque
                    visible={showInputPlaque}
                    title="ADD RULE"
                    placeholder="Enter rule..."
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
                    placeholder="Edit rule..."
                    value={inputValue}
                    onChangeText={setInputValue}
                    onConfirm={handleConfirmEditRule}
                    onCancel={closeRuleWritingPopup}
                    maxLength={100}
                    plaqueColor={editingPlaqueColor}
                />
            </SafeAreaView>
        </StripedBackground>
    );
} 