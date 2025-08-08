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
import SwapSelectionModal from "./SwapSelectionModal";


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

    const { gameState, updateActiveCloningDetails, updateActiveFlippingDetails, updateActiveSwappingDetails, cloneRuleToPlayer, triggerFlipModifier, assignRule, endUpDownRule, endCloneRule, endSwapRule, flipRule, getNonHostPlayers } = useGame();

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

    const confirmRulesForSwapping = () => {
        if (!gameState || !gameState.activeSwapRuleDetails || !gameState.activeSwapRuleDetails.swappee || !gameState.activeSwapRuleDetails.swapper) return;
        const swapperRule = gameState.activeSwapRuleDetails.swapperRule;
        const swappeeRule = gameState.activeSwapRuleDetails.swappeeRule;
        if (swapperRule && swappeeRule) {
            assignRule(swapperRule.id, gameState.activeSwapRuleDetails.swappee.id);
            assignRule(swappeeRule.id, gameState.activeSwapRuleDetails.swapper.id);
        }
        if (gameState.settings?.hostIsValidTarget && gameState.activeSwapRuleDetails.swappeeRule?.id === "hostTheShow") {
            socketService.setPlayerAsHost(gameState.activeSwapRuleDetails.swapper.id);
        }
        socketService.setAllPlayerModals(null);
    };

    const confirmSwapperRuleForSwapping = (rule: Rule) => {
        if (!gameState) return;
        updateActiveSwappingDetails({
            ...gameState.activeSwapRuleDetails!,
            swapperRule: rule
        });
        socketService.setPlayerModal(gameState.activeSwapRuleDetails!.swapper!.id, "SwapActionSelection");
    };

    const confirmSwapeeDetailsForSwapping = (player: Player, rule: Rule) => {
        if (!gameState) return;
        updateActiveSwappingDetails({
            ...gameState.activeSwapRuleDetails!,
            swappee: player,
            swappeeRule: rule
        });
        socketService.setAllPlayerModals("SwapRuleResolution");
    };


    const getPlayerToPassTo = (player: Player, direction: 'up' | 'down') => {
        if (!gameState?.players) return;

        // Get non-host players sorted by playerOrderPosition
        const nonHostPlayers = getNonHostPlayers() || [];

        if (nonHostPlayers.length === 0) return player;

        let targetOrderPosition: number;
        if (direction === 'up') {
            targetOrderPosition = player.playerOrderPosition! - 1;
            if (targetOrderPosition <= 0) {
                targetOrderPosition = nonHostPlayers.length;
            }
        } else {
            targetOrderPosition = player.playerOrderPosition! + 1;
            if (targetOrderPosition > nonHostPlayers.length) {
                targetOrderPosition = 1;
            }
        }

        const targetPlayer = nonHostPlayers.find(p => p.playerOrderPosition === targetOrderPosition);

        return targetPlayer;
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

        socketService.updateActiveUpDownDetails(updatedDetails);
        socketService.setPlayerModal(currentUser!.id, "AwaitUpDownRuleSelection");
    };



    const handleUpDownConfirmation = () => {
        if (!gameState?.activeUpDownRuleDetails) return;
        const nonHostPlayers: Player[] = getNonHostPlayers() || [];
        if (nonHostPlayers.length === 0) return;

        const playersWithRulesToPass = nonHostPlayers.filter(player =>
            gameState.rules.some(rule => rule.assignedTo === player.id)
        );

        // If any required selection is missing, alert and do nothing
        const missing = playersWithRulesToPass.find(p => !gameState.activeUpDownRuleDetails?.selectedRules[p.id]);
        if (missing) {
            Alert.alert('Not All Players Selected', `Player ${missing.name} has not selected a rule to pass.`);
            return;
        }

        // Assign each selected rule to the proper neighbor
        playersWithRulesToPass.forEach(player => {
            const selectedRule = gameState.activeUpDownRuleDetails!.selectedRules[player.id];
            const playerToPassTo = getPlayerToPassTo(player, gameState.activeUpDownRuleDetails!.direction);
            if (selectedRule && playerToPassTo) {
                assignRule(selectedRule.id, playerToPassTo.id);
            }
        });

        // Clear modals and end the Up/Down action
        endUpDownRule();
    };

    const allPlayersHaveSelectedRules = () => {
        const nonHostPlayers = getNonHostPlayers() || [];
        const playersWithRulesToPass = nonHostPlayers.filter(player => {
            return gameState?.rules.some(rule => rule.assignedTo === player.id)
        }) || [];
        return Object.values(gameState?.activeUpDownRuleDetails?.selectedRules || {}).length === playersWithRulesToPass.length;
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
                            plaque={{
                                ...gameState?.activeFlipRuleDetails?.ruleToFlip!,
                                text: gameState?.activeFlipRuleDetails?.flippedText!,
                                isFlipped: !gameState?.activeFlipRuleDetails?.ruleToFlip?.isFlipped
                            }}
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
                acceptButtonDisabled={!allPlayersHaveSelectedRules()}
            />





            {/* Swap Rule Modals */}
            {/* Swap Target Selection Modal */}
            {/* <PlayerSelectionModal
                visible={currentModal === 'SwapActionTargetSelection'}
                title={`SWAP`}
                description={`Choose a player to swap rules with:`}
                players={gameState?.players.filter(player => {
                    return player.id !== gameState?.activeSwapRuleDetails?.swapper.id
                        && !player.isHost
                        && gameState?.rules.some(rule => rule.assignedTo === player.id && rule.isActive)
                }) || []}
                onSelectPlayer={confirmTargetForSwapping}
            /> */}

            {/* Swap Rule Selection Modal */}
            {/* <RuleSelectionModal
                visible={currentModal === 'SwapActionRuleSelection'}
                title={`SWAP`}
                description={`Choose one of your rules to give to ${gameState?.activeSwapRuleDetails?.swappee?.name}:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeSwapRuleDetails?.swapper.id && rule.isActive) || []}
                description2={`Choose a rule to take from ${gameState?.activeSwapRuleDetails?.swappee?.name}:`}
                rules2={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeSwapRuleDetails?.swappee?.id && rule.isActive) || []}
                onAccept={confirmRulesForSwapping}
                onClose={deselectTargetForSwapping}
            /> */}

            {/* Swapper Rule Selection Modal */}
            <RuleSelectionModal
                visible={currentModal === 'SwapperRuleSelection'}
                title={`SWAP`}
                description={`Choose a rule to give to another player:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeSwapRuleDetails?.swapper.id) || []}
                onAccept={confirmSwapperRuleForSwapping}
            />

            {/* Swap Selection Modal */}
            <SwapSelectionModal
                visible={currentModal === 'SwapActionSelection'}
                onAccept={(player: Player, rule: Rule) => confirmSwapeeDetailsForSwapping(player, rule)}
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
                    onFinishModifier(() => {
                        confirmRulesForSwapping();
                        endSwapRule();
                    });
                }}
                acceptButtonText="Ok"
                acceptButtonDisplayed={currentUser?.id === gameState?.activeSwapRuleDetails?.swappee?.id || currentUser?.isHost}
            />
        </>
    );
}