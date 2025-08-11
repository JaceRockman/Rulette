import React, { useState } from 'react';
import { Modal, View, Text, SafeAreaView, ScrollView } from 'react-native';

import { shared } from '../shared/styles';
import { PrimaryButton } from '../components/Buttons';
import { useGame } from '../context/GameContext';
import { Plaque as PlaqueType, Player, Rule } from '../types/game';
import { render2ColumnPlaqueList } from '../components/PlaqueList';
import ExitModalButton from '../components/ExitModalButton';


interface SwapSelectionModalProps {
    visible: boolean;
    onAccept: (player: Player, rule: Rule) => void;
}

export default function SwapSelectionModal({
    visible,
    onAccept,
}: SwapSelectionModalProps) {

    const { gameState } = useGame();

    const swappablePlayers = gameState?.settings?.hostIsValidTarget ?
        gameState?.players.filter(player => player.id !== gameState?.activeSwapRuleDetails?.swapper.id) :
        gameState?.players.filter(player => player.id !== gameState?.activeSwapRuleDetails?.swapper.id && !player.isHost);
    const playersWithRules = swappablePlayers?.filter(player => gameState?.rules.some(rule => rule.assignedTo === player.id));

    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    const toggleRuleSelection = (player: Player, rule: PlaqueType) => {
        if (selectedRule?.id === rule.id) {
            setSelectedRule(null);
            setSelectedPlayer(null);
        } else {
            setSelectedRule(rule as Rule);
            setSelectedPlayer(player);
        }
    }

    function playerRuleSelectSection(player: Player) {
        const playerRules = gameState?.rules.filter(rule => rule.assignedTo === player.id);

        return (
            <View style={{ flexShrink: 1, alignItems: 'center', justifyContent: 'center' }} key={player.id}>
                <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>{player.name}</Text>
                {render2ColumnPlaqueList({
                    plaques: playerRules || [],
                    onPress: (plaque: PlaqueType) => {
                        toggleRuleSelection(player, plaque);
                    },
                    selectedPlaque: selectedRule
                })}
            </View>
        );
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <ExitModalButton />
                    <Text style={shared.modalTitle}>SWAP</Text>
                    <Text style={shared.modalDescription}>Choose a player's rule to swap with one of your own:</Text>

                    <ScrollView style={shared.scrollView}>
                        {playersWithRules?.map(player => playerRuleSelectSection(player))}
                    </ScrollView>

                    <View style={shared.buttonContainer}>
                        <PrimaryButton
                            title={'Accept'}
                            onPress={() => onAccept(selectedPlayer!, selectedRule!)}
                            disabled={selectedRule === null || selectedPlayer === null}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}