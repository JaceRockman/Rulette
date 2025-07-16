import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Player, Prompt, Plaque as PlaqueType, Rule } from '../types/game';
import { colors, shared } from '../shared/styles';
import Plaque from '../components/Plaque';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';
import { render2ColumnPlaqueList } from '../components/PlaqueList';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

interface PromptResolutionModalProps {
    visible: boolean;
    selectedPlayerForAction: Player | null;
    prompt: Prompt | null;
    onShredRule: (ruleId: string) => void;
    onSkip: () => void;
}

export default function PromptResolutionModal({
    visible,
    selectedPlayerForAction,
    prompt,
    onShredRule,
    onSkip
}: PromptResolutionModalProps) {
    const { gameState } = useGame();
    const promptedPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id) || [];
    const currentUser = gameState?.players.find(p => p.id === socketService.getCurrentUserId());
    const isPromptedPlayer = currentUser?.id === selectedPlayerForAction?.id;
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    const toggleSelectedRule = (rule: Rule) => {
        if (selectedRule?.id === rule.id) {
            setSelectedRule(null);
        } else {
            setSelectedRule(rule);
        }
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>Prompt Succeeded!</Text>
                    <Plaque plaque={prompt as PlaqueType} />

                    {isPromptedPlayer && (
                        <View>
                            <Text style={shared.modalDescription}>
                                You successfully completed the prompt! You have been awarded 2 points and may shred one of your rules to remove it from the game.
                            </Text>
                            {render2ColumnPlaqueList({
                                plaques: promptedPlayerRules,
                                selectedPlaque: selectedRule,
                                onPress: (plaque: PlaqueType) => toggleSelectedRule(plaque as Rule)
                            })}
                            <View style={shared.buttonContainer}>
                                <PrimaryButton
                                    title="Shred Rule"
                                    onPress={() => onShredRule(selectedRule?.id!)}
                                    buttonStyle={{ opacity: selectedRule ? 1 : 0.3 }}
                                    disabled={!selectedRule}
                                />

                                <SecondaryButton title="Skip" onPress={() => onSkip()} />
                            </View>
                        </View>
                    )}
                    {!isPromptedPlayer && (
                        <Text style={shared.modalDescription}>
                            Waiting for {selectedPlayerForAction?.name} to shred a rule...
                        </Text>
                    )}
                </View>
            </View>
        </Modal >
    );
}