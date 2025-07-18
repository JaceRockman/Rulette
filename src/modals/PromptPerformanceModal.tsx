import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Player, Prompt, Plaque as PlaqueType, Rule } from '../types/game';
import { colors, shared } from '../shared/styles';
import Plaque from '../components/Plaque';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';
import { render2ColumnPlaqueList } from '../components/PlaqueList';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

interface PromptPerformanceModalProps {
    visible: boolean;
    selectedPlayerForAction: Player | null;
    prompt: Prompt | null;
    onPressRule: (rule: Rule) => void;
    onSuccess: () => void;
    onFailure: () => void;
}

export default function PromptPerformanceModal({
    visible,
    selectedPlayerForAction,
    prompt,
    onPressRule,
    onSuccess,
    onFailure
}: PromptPerformanceModalProps) {
    const { gameState } = useGame();
    const promptedPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === selectedPlayerForAction?.id) || [];
    const currentUser = gameState?.players.find(p => p.id === socketService.getCurrentUserId());
    const isPromptedPlayer = currentUser?.id === selectedPlayerForAction?.id;
    const isHost = currentUser?.isHost;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>Prompt for {selectedPlayerForAction?.name}</Text>
                    <Plaque plaque={prompt as PlaqueType} />

                    <View>
                        {/* Rules Reminder Section */}
                        {promptedPlayerRules.length > 0 && (
                            <View>
                                <Text style={shared.modalDescription}>
                                    Rules assigned to {isPromptedPlayer ? 'you' : selectedPlayerForAction?.name}:
                                </Text>
                                {render2ColumnPlaqueList({
                                    plaques: promptedPlayerRules,
                                    onPress: (plaque: PlaqueType) => onPressRule(plaque as Rule)
                                })}
                            </View>
                        )}


                        {/* Success/Failure Buttons */}
                        <View style={isHost ? styles.buttonContainerHost : styles.buttonContainer}>
                            {isHost ? (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 }}>
                                    <PrimaryButton title="Success!" onPress={() => {
                                        console.log('success pressed');
                                        onSuccess();
                                    }} />
                                    <SecondaryButton title="Failure" onPress={() => {
                                        console.log('failure pressed');
                                        console.log('onFailure', onFailure);
                                        onFailure();
                                    }} />
                                </View>
                            ) : (
                                <Text style={shared.modalDescription}>
                                    Waiting for host to judge the prompt...
                                </Text>
                            )}

                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        gap: 12,
        marginTop: 20,
    },
    buttonContainerHost: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
    }
}); 