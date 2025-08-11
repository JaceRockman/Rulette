import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Plaque as PlaqueType, Rule } from '../types/game';
import { shared } from '../shared/styles';
import Plaque from '../components/Plaque';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';
import { render2ColumnPlaqueList } from '../components/PlaqueList';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ExitModalButton from '../components/ExitModalButton';

interface PromptPerformanceModalProps {
    visible: boolean;
    onPressRule: (rule: Rule) => void;
    onSuccess: () => void;
    onFailure: () => void;
}

export default function PromptPerformanceModal({
    visible,
    onPressRule,
    onSuccess,
    onFailure
}: PromptPerformanceModalProps) {
    const { gameState } = useGame();
    const { selectedPlayer, selectedPrompt } = gameState?.activePromptDetails || {};

    const promptedPlayerRules = gameState?.rules.filter(rule => rule.assignedTo === selectedPlayer?.id) || [];
    const currentUser = gameState?.players.find(p => p.id === socketService.getCurrentUserId());
    const isPromptedPlayer = currentUser?.id === selectedPlayer?.id;
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
                    <ExitModalButton />
                    <Text style={shared.modalTitle}>Prompt for {selectedPlayer?.name}</Text>
                    <Plaque plaque={selectedPrompt as PlaqueType} />

                    {/* Rules Reminder Section */}
                    {promptedPlayerRules.length > 0 && (
                        <Text style={shared.modalDescription}>
                            Rules assigned to {isPromptedPlayer ? 'you' : selectedPlayer?.name}:
                        </Text>
                    )}

                    {promptedPlayerRules.length > 0 && (
                        render2ColumnPlaqueList({
                            plaques: promptedPlayerRules,
                            onPress: (plaque: PlaqueType) => onPressRule(plaque as Rule)
                        })
                    )}


                    {/* Success/Failure Buttons */}
                    <View style={isHost ? styles.buttonContainerHost : styles.buttonContainer}>
                        {isHost ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 }}>
                                <PrimaryButton title="Success!" onPress={onSuccess} />
                                <SecondaryButton title="Failure" onPress={onFailure} />
                            </View>
                        ) : (
                            <Text style={shared.modalDescription}>
                                Waiting for host to judge the prompt...
                            </Text>
                        )}

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