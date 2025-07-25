import React from "react";
import { GameState, Player, Rule } from "../types/game";
import Plaque from "../components/Plaque";
import SimpleModal from "./SimpleModal";
import PlayerSelectionModal from "./PlayerSelectionModal";
import { Alert, Text, View } from "react-native";
import RuleSelectionModal from "./RuleSelectionModal";
import { useGame } from "../context/GameContext";
import FlipTextInputModal from "./FlipTextInputModal";
import socketService from "../services/socketService";


interface InitiateCloneProps {
    cloningPlayer: Player;
    playerRules: Rule[];
    triggerCloneModifier: (cloningPlayer: Player, rule: Rule | null) => void;
}

export const initiateClone = ({ cloningPlayer, playerRules = [], triggerCloneModifier }: InitiateCloneProps) => {
    // Check if player has rules to clone
    if (playerRules.length === 1) {
        triggerCloneModifier(cloningPlayer, playerRules[0]);
    } else if (playerRules.length > 0) {
        triggerCloneModifier(cloningPlayer, null);
    } else {
        Alert.alert('No Rules to Clone', `${cloningPlayer.name} has no assigned rules to clone.`);
        return 'failed';
    }
};

interface InitiateFlipProps {
    flippingPlayer: Player;
    playerRules: Rule[];
    triggerFlipModifier: (flippingPlayer: Player, rule: Rule | null) => void;
}

export const initiateFlip = ({ flippingPlayer, playerRules = [], triggerFlipModifier }: InitiateFlipProps) => {
    // Check if player has rules to flip
    if (playerRules.length === 1) {
        triggerFlipModifier(flippingPlayer, playerRules[0]);
    } else if (playerRules.length > 0) {
        triggerFlipModifier(flippingPlayer, null);
    } else {
        Alert.alert('No Rules to Flip', `${flippingPlayer.name} has no assigned rules to flip.`);
        return 'failed';
    }
    return 'success';
};

interface InitiateSwapProps {
    swappingPlayer: Player;
    playerRules: Rule[];
    triggerSwapModifier: (swappingPlayer: Player, rule: Rule | null) => void;
}

export const initiateSwap = ({ swappingPlayer, playerRules = [], triggerSwapModifier }: InitiateSwapProps) => {
    // Check if player has rules to swap
    if (playerRules.length > 0) {
        triggerSwapModifier(swappingPlayer, playerRules[0]);
    } else {
        Alert.alert('No Rules to Swap', `${swappingPlayer.name} has no assigned rules to swap.`);
        return 'failed';
    }
};

interface InitiateUpDownProps {
    direction: 'up' | 'down';
    triggerUpDownModifier: (direction: 'up' | 'down') => void;
}

export const initiateUpDown = ({ direction, triggerUpDownModifier }: InitiateUpDownProps) => {
    triggerUpDownModifier(direction);
};



interface ModifierModalsProps {
    setCurrentModal: (modal: string | null) => void;
    currentModal: string | null;
    currentUser: Player | null;
    onFinishModifier: (sideEffects?: () => void) => void;
}

export default function ModifierModals(
    { setCurrentModal, currentModal, currentUser, onFinishModifier }: ModifierModalsProps) {

    const { gameState, updateActiveCloningDetails, updateActiveFlippingDetails, updateActiveSwappingDetails, updateActiveUpDownDetails, setPlayerModal, cloneRuleToPlayer, triggerFlipModifier, triggerSwapModifier, triggerUpDownModifier, assignRule, endUpDownRule, endCloneRule, endFlipRule, endSwapRule, flipRule } = useGame();

    const confirmRuleForCloning = (rule: Rule) => {
        if (!gameState) return;
        updateActiveCloningDetails({
            ...gameState.activeCloneRuleDetails!,
            ruleToClone: rule
        });
        gameState.players.forEach(player => {
            if (player.id === gameState.activeCloneRuleDetails?.cloningPlayer.id) {
                socketService.setPlayerModal(player.id, "CloneActionTargetSelection");
            } else {
                socketService.setPlayerModal(player.id, "AwaitCloneTargetSelection");
            }
        })
    };

    const deselectRuleForCloning = () => {
        if (!gameState) return;
        updateActiveCloningDetails({
            ...gameState.activeCloneRuleDetails!,
            ruleToClone: null
        });
        gameState.players.forEach(player => {
            if (player.id === gameState.activeCloneRuleDetails?.cloningPlayer.id) {
                socketService.setPlayerModal(player.id, "CloneActionRuleSelection");
            } else {
                socketService.setPlayerModal(player.id, "AwaitCloneRuleSelection");
            }
        })
    };

    const confirmTargetForCloning = (player: Player) => {
        if (!gameState) return;
        updateActiveCloningDetails({
            ...gameState.activeCloneRuleDetails!,
            targetPlayer: player
        });
        cloneRuleToPlayer(gameState.activeCloneRuleDetails!.ruleToClone!, player);
        socketService.setAllPlayerModals("CloneActionResolution");
    };




    const handleInitiateFlip = (flipper: Player) => {
        if (flipper && gameState) {
            // Check if player has rules to flip
            const playerRules = gameState.rules.filter(rule => rule.assignedTo === flipper.id);
            if (playerRules.length === 1) {
                triggerFlipModifier(flipper, playerRules[0]);
            } else if (playerRules.length > 0) {
                triggerFlipModifier(flipper, null);
            } else {
                Alert.alert('No Rules to Flip', `${flipper.name} has no assigned rules to flip.`);
                return 'failed';
            }
        }
    };

    const confirmRuleForFlipping = (rule: Rule) => {
        if (!gameState) return;
        updateActiveFlippingDetails({
            ...gameState.activeFlipRuleDetails!,
            ruleToFlip: rule
        });
        gameState.players.forEach(player => {
            if (player.isHost) {
                socketService.setPlayerModal(player.id, 'FlipRuleTextInput');
            } else {
                socketService.setPlayerModal(player.id, 'AwaitFlipRuleTextInput');
            }
        })
    };




    const confirmTargetForSwapping = (player: Player) => {
        if (!gameState) return;
        updateActiveSwappingDetails({
            ...gameState.activeSwapRuleDetails!,
            swappee: player
        });
        gameState.players.forEach(player => {
            if (player.id === gameState.activeSwapRuleDetails?.swapper.id) {
                socketService.setPlayerModal(player.id, 'SwapActionRuleSelection');
            } else {
                socketService.setPlayerModal(player.id, 'AwaitSwapRuleSelection');
            }
        })
    };

    const deselectTargetForSwapping = () => {
        if (!gameState) return;
        updateActiveSwappingDetails({
            ...gameState.activeSwapRuleDetails!,
            swappee: null
        });
        gameState.players.forEach(player => {
            if (player.id === gameState.activeSwapRuleDetails?.swapper.id) {
                socketService.setPlayerModal(player.id, 'SwapActionRuleSelection');
            } else {
                socketService.setPlayerModal(player.id, 'AwaitSwapRuleSelection');
            }
        })
    };

    const confirmRulesForSwapping = (swapperRule: Rule, swappeeRule: Rule | null) => {
        console.log('confirmRulesForSwapping', swapperRule, swappeeRule);
        if (!gameState) return;
        updateActiveSwappingDetails({
            ...gameState.activeSwapRuleDetails!,
            swapperRule: swapperRule,
            swappeeRule: swappeeRule
        });
        assignRule(swapperRule.id, gameState.activeSwapRuleDetails!.swappee!.id);
        assignRule(swappeeRule!.id, gameState.activeSwapRuleDetails!.swapper!.id);
        socketService.setAllPlayerModals("SwapRuleResolution");
    };


    const getPlayerToPassTo = (player: Player, direction: 'up' | 'down') => {
        if (!gameState?.players) return;

        const sourceIndex = gameState.players.findIndex(p => p.id === player.id);
        if (sourceIndex === -1) return;

        let targetIndex: number;
        if (direction === 'up') {
            targetIndex = sourceIndex - 1;
            while (targetIndex >= 0 && gameState.players[targetIndex].isHost) {
                targetIndex--;
            }
            if (targetIndex < 0) {
                targetIndex = gameState.players.length - 1;
                while (targetIndex >= 0 && gameState.players[targetIndex].isHost) {
                    targetIndex--;
                }
            }
        } else {
            targetIndex = sourceIndex + 1;
            while (targetIndex < gameState.players.length && gameState.players[targetIndex].isHost) {
                targetIndex++;
            }
            if (targetIndex >= gameState.players.length) {
                targetIndex = 0;
                while (targetIndex < gameState.players.length && gameState.players[targetIndex].isHost) {
                    targetIndex++;
                }
            }
        }

        if (targetIndex >= 0 && targetIndex < gameState.players.length) {
            return gameState.players[targetIndex];
        }
        return player; // fallback to self if no valid target found
    }

    // Handle rule selection for up/down workflow
    const handleUpDownRuleSelect = (rule: Rule) => {
        if (!gameState?.activeUpDownRuleDetails) return;

        const updatedDetails = {
            ...gameState.activeUpDownRuleDetails,
            selectedRules: {
                ...gameState.activeUpDownRuleDetails.selectedRules,
                [currentUser!.id]: rule
            }
        };

        updateActiveUpDownDetails(updatedDetails);
        socketService.setPlayerModal(currentUser!.id, "AwaitUpDownRuleSelection");
    };



    const handleUpDownConfirmation = () => {
        if (!gameState?.activeUpDownRuleDetails) return;
        const nonHostPlayers = gameState.players.filter(p => !p.isHost);
        nonHostPlayers.forEach(player => {
            const playerHasRules = gameState?.rules.some(rule => rule.assignedTo === player.id);
            const selectedRule = gameState?.activeUpDownRuleDetails?.selectedRules[player.id];
            const playerToPassTo = getPlayerToPassTo(player, gameState?.activeUpDownRuleDetails?.direction || 'up');
            if (selectedRule === null) {
                if (playerHasRules) {
                    Alert.alert('Not All Players Selected', `Player ${player.name} has not selected a rule to pass.`);
                } else {
                    return;
                }
            } else {
                assignRule(selectedRule!.id, playerToPassTo?.id || player.id);
            }
        });
        endUpDownRule();
    };

    const allPlayersHaveSelectedRules = () => {
        const nonHostPlayers = gameState?.players.filter(p => !p.isHost) || [];
        const playersWithRulesToPass = nonHostPlayers.filter(player => {
            return gameState?.rules.some(rule => rule.assignedTo === player.id)
        }) || [];
        return Object.values(gameState?.activeUpDownRuleDetails?.selectedRules || {}).length !== playersWithRulesToPass.length;
    }

    return (
        <>
            {/* Clone Rule Modals */}
            {/* Clone Action Selection Modal */}
            <RuleSelectionModal
                visible={currentModal === 'CloneActionRuleSelection'}
                title={`CLONE`}
                description={`Choose one of your rules to clone:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeCloneRuleDetails?.cloningPlayer.id && rule.isActive) || []}
                onAccept={confirmRuleForCloning}
            />

            {/* Clone Target Selection Modal */}
            <PlayerSelectionModal
                visible={currentModal === 'CloneActionTargetSelection'}
                title={`CLONE`}
                description={`Choose a player to give the copied rule to:`}
                players={gameState?.players.filter(player => {
                    return player.id !== gameState?.activeCloneRuleDetails?.cloningPlayer.id
                        && !player.isHost
                }) || []}
                onSelectPlayer={confirmTargetForCloning}
                onClose={deselectRuleForCloning}
                cancelButtonText="Back"
            />

            {/* Await Clone Rule Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitCloneRuleSelection'}
                title={'CLONE'}
                description={`Waiting for ${gameState?.activeCloneRuleDetails?.cloningPlayer.name} to select a rule to clone...`}
            />

            {/* Await Clone Target Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitCloneTargetSelection'}
                title={'CLONE'}
                description={`Waiting for ${gameState?.activeCloneRuleDetails?.cloningPlayer.name} to select a recipient for the copied rule...`}
                content={
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Plaque
                            plaque={gameState?.activeCloneRuleDetails?.ruleToClone!}
                        />
                    </View>
                }
            />

            {/* Clone Action Resolution Modal */}
            <SimpleModal
                visible={currentModal === 'CloneActionResolution'}
                title={'CLONE'}
                description={`${gameState?.activeCloneRuleDetails?.cloningPlayer.name} has cloned the following rule and given it to ${gameState?.activeCloneRuleDetails?.targetPlayer?.name}!`}
                content={
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Plaque
                            plaque={gameState?.activeCloneRuleDetails?.ruleToClone!}
                        />
                    </View>
                }
                onAccept={() => {
                    onFinishModifier(endCloneRule);
                }}
                acceptButtonText="Ok"
                acceptButtonDisplayed={currentUser?.id === gameState?.activeCloneRuleDetails?.targetPlayer?.id}
            />





            {/* Flip Rule Modals */}
            <RuleSelectionModal
                visible={currentModal === 'FlipActionRuleSelection'}
                title={`FLIP`}
                description={`Choose a Rule to flip:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeFlipRuleDetails?.flippingPlayer.id && rule.isActive) || []}
                onAccept={confirmRuleForFlipping}
            />

            {/* Flip Text Input Modal */}
            <FlipTextInputModal
                visible={currentModal === 'FlipRuleTextInput'}
                selectedRule={gameState?.activeFlipRuleDetails?.ruleToFlip || null}
                onFlipRule={(rule, flippedText) => {
                    socketService.setAllPlayerModals('FlipRuleResolution');
                    socketService.updateActiveFlippingDetails({
                        ...gameState?.activeFlipRuleDetails!,
                        flippedText: flippedText
                    });
                }}
            />

            {/* Await Flip Rule Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitFlipRuleSelection'}
                title={'FLIP'}
                description={`Waiting for ${gameState?.activeFlipRuleDetails?.flippingPlayer.name} to select a rule to flip...`}
            />

            {/* Await Flip Rule Execution Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitFlipRuleTextInput'}
                title={'FLIP'}
                description={`Waiting for Host to flip rule:`}
                content={
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Plaque
                            plaque={gameState?.activeFlipRuleDetails?.ruleToFlip!}
                        />
                    </View>
                }
            />

            {/* Flip Rule Resolution Modal */}
            <SimpleModal
                visible={currentModal === 'FlipRuleResolution'}
                title={'FLIP'}
                description={`${gameState?.activeFlipRuleDetails?.flippingPlayer.name} has flipped:`}
                content={
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Plaque
                            plaque={gameState?.activeFlipRuleDetails?.ruleToFlip!}
                        />
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>to</Text>
                        <Plaque
                            plaque={{ ...gameState?.activeFlipRuleDetails?.ruleToFlip!, text: gameState?.activeFlipRuleDetails?.flippedText! }}
                        />
                    </View>
                }
                onAccept={() => {
                    onFinishModifier(() => {
                        flipRule(gameState?.activeFlipRuleDetails?.ruleToFlip!, gameState?.activeFlipRuleDetails?.flippedText!);
                    });
                }}
                acceptButtonText="Ok"
                acceptButtonDisplayed={currentUser?.id === gameState?.activeFlipRuleDetails?.flippingPlayer.id}
            />



            {/* Swap Rule Modals */}
            {/* Swap Target Selection Modal */}
            <PlayerSelectionModal
                visible={currentModal === 'SwapActionTargetSelection'}
                title={`SWAP`}
                description={`Choose a player to swap rules with:`}
                players={gameState?.players.filter(player => {
                    return player.id !== gameState?.activeSwapRuleDetails?.swapper.id
                        && !player.isHost
                        && gameState?.rules.some(rule => rule.assignedTo === player.id && rule.isActive)
                }) || []}
                onSelectPlayer={confirmTargetForSwapping}
            />

            {/* Swap Rule Selection Modal */}
            <RuleSelectionModal
                visible={currentModal === 'SwapActionRuleSelection'}
                title={`SWAP`}
                description={`Choose one of your rules to give to ${gameState?.activeSwapRuleDetails?.swappee?.name}:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeSwapRuleDetails?.swapper.id && rule.isActive) || []}
                description2={`Choose a rule to take from ${gameState?.activeSwapRuleDetails?.swappee?.name}:`}
                rules2={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeSwapRuleDetails?.swappee?.id && rule.isActive) || []}
                onAccept={confirmRulesForSwapping}
                onClose={deselectTargetForSwapping}
            />

            {/* Swap Target Rule Selection Modal */}
            {/* <RuleSelectionModal
                    visible={currentModal === 'SwapActionTargetRuleSelection'}
                    title={`SWAP`}
                    description={`Choose a rule to take from ${gameState?.activeSwapRuleDetails?.swappee?.name}:`}
                    rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeSwapRuleDetails?.swappee?.id && rule.isActive) || []}
                    onAccept={confirmTargetRuleForSwapping}
                    onClose={deselectTargetForSwapping}
                    cancelButtonText="Back"
                /> */}

            {/* Await Swap Target Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitSwapTargetSelection'}
                title={'SWAP'}
                description={`Waiting for ${gameState?.activeSwapRuleDetails?.swapper.name} to select a player to swap with...`}
            />

            {/* Await Swap Rule Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitSwapRuleSelection'}
                title={'SWAP'}
                description={`Waiting for ${gameState?.activeSwapRuleDetails?.swapper.name} to select rules to swap...`}
            />

            {/* Swap Action Resolution Modal */}
            <SimpleModal
                visible={currentModal === 'SwapRuleResolution'}
                title={'SWAP'}
                description={`${gameState?.activeSwapRuleDetails?.swapper.name} has swapped rules with ${gameState?.activeSwapRuleDetails?.swappee?.name}!`}
                content={
                    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{gameState?.activeSwapRuleDetails?.swapper.name} has given {gameState?.activeSwapRuleDetails?.swappee?.name}
                        </Text>
                        <Plaque
                            plaque={gameState?.activeSwapRuleDetails?.swapperRule!}
                        />
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>and taken</Text>
                        <Plaque
                            plaque={gameState?.activeSwapRuleDetails?.swappeeRule!}
                        />
                    </View>
                }
                onAccept={() => {
                    onFinishModifier(endSwapRule);
                }}
                acceptButtonText="Ok"
                acceptButtonDisplayed={currentUser?.id === gameState?.activeSwapRuleDetails?.swappee?.id || currentUser?.isHost}
            />




            {/* Up/Down Simultaneous Selection Modal */}
            <RuleSelectionModal
                visible={currentModal === 'UpDownRuleSelection'}
                title={`PASS RULES`}
                description={`Choose a rule to pass to ${getPlayerToPassTo(currentUser!, gameState?.activeUpDownRuleDetails?.direction || 'up')?.name || 'your neighbor'}...`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === currentUser?.id) || []}
                onAccept={handleUpDownRuleSelect}
            />

            {/* Await Up/Down Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitUpDownRuleSelection'}
                title={'PASS RULES'}
                description={`Waiting for all players to select their rules to pass ${gameState?.activeUpDownRuleDetails?.direction === 'up' ? 'up' : 'down'}...`}
                onAccept={() => {
                    onFinishModifier(handleUpDownConfirmation);
                }}
                acceptButtonDisplayed={currentUser?.isHost}
                acceptButtonDisabled={allPlayersHaveSelectedRules()}
            />
        </>
    );
}