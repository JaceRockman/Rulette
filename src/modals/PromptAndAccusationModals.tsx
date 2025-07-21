import React, { useState } from "react";
import { GameState, Player, Rule, ActiveAccusationDetails, Plaque as PlaqueType } from "../types/game";
import Plaque from "../components/Plaque";
import SimpleModal from "./SimpleModal";
import PlayerSelectionModal from "./PlayerSelectionModal";
import { Alert, Text, View } from "react-native";
import RuleSelectionModal from "./RuleSelectionModal";
import { useGame } from "../context/GameContext";
import FlipTextInputModal from "./FlipTextInputModal";
import { ActiveUpDownRuleDetails } from "../types/game";
import { RuleDetailsModal } from ".";
import AccusationJudgementModal from "./AccusationJudgementModal";
import PromptSelectionModal from "./PromptSelectionModal";
import PromptPerformanceModal from "./PromptPerformanceModal";
import PromptResolutionModal from "./PromptResolutionModal";
import { socketService } from "../services/socketService";


interface handleInitiateAccusationProps {
    accusedPlayer: Player;
    accusedRule: Rule;
    initiateAccusation: (accusationDetails: ActiveAccusationDetails) => void;
}

export const handleInitiateAccusation = ({ accusedPlayer, accusedRule, initiateAccusation }: handleInitiateAccusationProps) => {

    if (accusedRule) {
        initiateAccusation({
            rule: accusedRule,
            accuser: accusedPlayer,
            accused: accusedPlayer
        });
    }
};




interface PromptAndAccusationModalsProps {
    setCurrentModal: (modal: string | undefined) => void;
    currentModal: string;
    setSelectedRule: (rule: Rule | null) => void;
    selectedRule: Rule | null;
    currentUser: Player;
    selectedPlayerForAction: Player | null;
    onFinishModifier: () => void;
}

export default function PromptAndAccusationModals(
    { setCurrentModal, currentModal, setSelectedRule, selectedRule, currentUser, selectedPlayerForAction, onFinishModifier }: PromptAndAccusationModalsProps) {

    const { gameState } = useGame();

    // Sync local state with the gameState's currentModal
    // REMOVED: This useEffect was overwriting the currentModal prop with server state
    // React.useEffect(() => {
    //     if (!gameState) return;
    //     const gameStateModal = gameState?.players.find(player => player.id === currentUser?.id)?.currentModal;
    //     console.log('PromptAndAccusationModals: currentModal', currentModal);
    //     console.log('PromptAndAccusationModals: gameStateModal', gameStateModal);
    //     setCurrentModal(gameStateModal);
    // }, [gameState?.players.find(player => player.id === currentUser?.id)?.currentModal]);

    // Sync local state when server updates selectedRule
    React.useEffect(() => {
        if (!gameState) return;
        setSelectedRule(gameState.rules.find(rule => rule.id === gameState.selectedRule) || null);
    }, [gameState?.selectedRule]);


    return (
        <>

            {/* Rule Modals */}
            {/* Host Give Rule Modal */}
            <RuleSelectionModal
                visible={currentModal === 'GiveRule'}
                title={`Give Rule to ${selectedPlayerForAction?.name}`}
                description={`Select a rule to give to ${selectedPlayerForAction?.name}:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo !== selectedPlayerForAction?.id) || []}
                onAccept={(rule) => {
                    socketService.setAllPlayerModals(gameState?.id!, 'AwaitRuleAcceptance');
                    socketService.setSelectedRule(rule.id);
                }}
                onClose={() => {
                    setSelectedRule(null);
                    setCurrentModal(undefined);
                }}
            />

            {/* Await Rule Acceptance Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitRuleAcceptance'}
                title={`Rule Assigned`}
                description={`Waiting for ${selectedPlayerForAction?.name} to accept the rule...`}
                content={
                    <Plaque plaque={selectedRule as PlaqueType} style={{ width: '50%' }} />
                }
                onAccept={() => {
                    socketService.assignRule(selectedRule?.id!, selectedPlayerForAction!.id);
                    socketService.setAllPlayerModals(gameState?.id!, undefined);
                    socketService.setSelectedRule('');
                }}
                acceptButtonDisplayed={currentUser?.id === selectedPlayerForAction?.id}
            />



            {/* Rule Details Modal */}
            <RuleDetailsModal
                visible={currentModal === 'RuleDetails'}
                rule={selectedRule}
                viewingPlayer={currentUser}
                viewedPlayer={gameState?.players.find(player => player.id === selectedRule?.assignedTo) || null}
                isAccusationInProgress={gameState?.activeAccusationDetails !== undefined && gameState?.activeAccusationDetails?.accusationAccepted === undefined}
                onAccuse={
                    (accusationDetails: ActiveAccusationDetails) => {
                        socketService.initiateAccusation(accusationDetails);
                        socketService.setAllPlayerModals(gameState?.id!, 'AccusationJudgement');
                    }
                }
                onClose={() => {
                    setSelectedRule(null);
                    if (gameState?.activePromptDetails !== undefined) {
                        setCurrentModal('PromptPerformance');
                    } else {
                        setCurrentModal(undefined);
                    }
                }}
            />

            {/* Accusation Judgement Popup */}
            <AccusationJudgementModal
                visible={currentModal === 'AccusationJudgement'}
                activeAccusationDetails={gameState?.activeAccusationDetails || null}
                currentUser={currentUser!}
                onAccept={() => {
                    // accpetAccusation navigates players to the appropriate modals
                    socketService.acceptAccusation();
                    socketService.setSelectedRule(null);
                }}
                onDecline={() => {
                    socketService.endAccusation();
                    socketService.setAllPlayerModals(gameState?.id!, undefined);
                    socketService.possiblyReturnToPrompt();
                }}
            />

            {/* Accusation Rule Passing Modal */}
            <RuleSelectionModal
                visible={currentModal === 'SuccessfulAccusationRuleSelection'}
                title={`Accusation Accepted!`}
                description={`Select a rule to give to ${gameState?.activeAccusationDetails?.accused?.name}:`}
                rules={gameState?.rules.filter(rule => rule.assignedTo === gameState?.activeAccusationDetails?.accuser.id) || []}
                onAccept={(rule: Rule) => {
                    socketService.assignRule(rule.id, gameState?.activeAccusationDetails?.accused.id!);
                    // endAccusation resets players modal to undefined
                    socketService.endAccusation();
                    socketService.possiblyReturnToPrompt();
                }}
                onClose={() => {
                    socketService.endAccusation();
                    socketService.possiblyReturnToPrompt();
                }}
                cancelButtonText="Skip"
            />

            {/* Wait For Rule Selection Modal */}
            <SimpleModal
                visible={currentModal === 'WaitForRuleSelection'}
                title={`Accusation Accepted!`}
                description={`Waiting for ${gameState?.activeAccusationDetails?.accuser.name} to select a rule to give to ${gameState?.activeAccusationDetails?.accused.name}...`}
            />




            {/* Prompt Modals */}
            {/* Host Prompt Selection Modal */}
            <PromptSelectionModal
                visible={currentModal === 'GivePrompt'}
                title={`Select a Prompt to Give to ${selectedPlayerForAction?.name}`}
                description={`Select a prompt to give to ${selectedPlayerForAction?.name}:`}
                prompts={gameState?.prompts || []}
                onAccept={(prompt: PlaqueType | null) => {
                    socketService.givePrompt(selectedPlayerForAction!.id, prompt!.id);
                    socketService.setAllPlayerModals(gameState?.id!, "PromptPerformance");
                }}
                onClose={() => {
                    setCurrentModal(undefined);
                }}
            />

            {/* Prompt Initiated Modal */}
            <PromptPerformanceModal
                visible={currentModal === 'PromptPerformance'}
                onPressRule={(rule: Rule) => {
                    console.log('PromptPerformanceModal: onPressRule', rule);
                    setSelectedRule(rule);
                    setCurrentModal('RuleDetails');
                }}
                onSuccess={() => {
                    socketService.acceptPrompt();
                    const playerHasRules = gameState?.rules.some(rule => rule.assignedTo === selectedPlayerForAction?.id);

                    if (playerHasRules) {
                        socketService.setAllPlayerModals(gameState?.id!, 'PromptResolution');
                    } else {
                        socketService.endPrompt();
                        socketService.setAllPlayerModals(gameState?.id!, undefined);
                        onFinishModifier();
                    }
                }}
                onFailure={() => {
                    socketService.endPrompt();
                    socketService.setAllPlayerModals(gameState?.id!, undefined);
                    onFinishModifier();
                }}
            />

            {/* Prompt Resolution Modal */}
            <PromptResolutionModal
                visible={currentModal === 'PromptResolution'}
                onShredRule={(ruleId: string) => {
                    socketService.shredRule(ruleId);
                    socketService.endPrompt();
                    socketService.setAllPlayerModals(gameState?.id!, undefined);
                    onFinishModifier();
                }}
                onSkip={() => {
                    socketService.endPrompt();
                    socketService.setAllPlayerModals(gameState?.id!, undefined);
                    onFinishModifier();
                }}
            />
        </>
    );
}