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
    setCurrentModal: (modal: string | null) => void;
    currentModal: string | null;
    setSelectedRule: (rule: Rule | null) => void;
    selectedRule: Rule | null;
    currentUser: Player;
    selectedPlayerForAction: Player | null;
    onShredRule: (ruleId: string) => void;
    onFinishPrompt: (sideEffects?: () => void) => void;
}

export default function PromptAndAccusationModals(
    { setCurrentModal, currentModal, setSelectedRule, selectedRule, currentUser, selectedPlayerForAction, onShredRule, onFinishPrompt }: PromptAndAccusationModalsProps) {

    const { gameState } = useGame();

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
                    socketService.setAllPlayerModals('AwaitRuleAcceptance');
                    socketService.setSelectedRule(rule.id);
                }}
                onClose={() => {
                    setSelectedRule(null);
                    setCurrentModal(null);
                }}
            />

            {/* Await Rule Acceptance Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitRuleAcceptance'}
                title={`Rule Assigned`}
                description={`Waiting for ${selectedPlayerForAction?.name} to accept the rule...`}
                content={
                    <Plaque plaque={gameState?.rules.find(rule => rule.id === gameState?.selectedRule) as PlaqueType} />
                }
                onAccept={() => {
                    socketService.assignRule(gameState?.selectedRule!, selectedPlayerForAction!.id);
                    socketService.setAllPlayerModals(null);
                    socketService.setSelectedRule(null);
                }}
                acceptButtonDisplayed={currentUser?.id === selectedPlayerForAction?.id}
            />



            {/* Rule Details Modal */}
            <RuleDetailsModal
                visible={currentModal === 'RuleDetails'}
                rule={selectedRule || null}
                viewingPlayer={currentUser}
                viewedPlayer={gameState?.players.find(player => player.id === selectedRule?.assignedTo) || null}
                isAccusationInProgress={gameState?.activeAccusationDetails !== null && gameState?.activeAccusationDetails?.accusationAccepted === null}
                onAccuse={
                    (accusationDetails: ActiveAccusationDetails) => {
                        socketService.initiateAccusation(accusationDetails);
                        socketService.setAllPlayerModals('AccusationJudgement');
                    }
                }
                onClose={() => {
                    setSelectedRule(null);
                    if (gameState?.activePromptDetails !== null) {
                        setCurrentModal('PromptPerformance');
                    } else {
                        setCurrentModal(null);
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
                    // socketService.updateActiveAccusationDetails(null);
                    socketService.endAccusation();
                    socketService.setSelectedRule(null);
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
                    // endAccusation resets players modal to null
                    socketService.endAccusation();
                    if (gameState?.activePromptDetails !== null) {
                        socketService.setAllPlayerModals('PromptPerformance');
                    } else {
                        socketService.setAllPlayerModals(null);
                    }
                }}
                onClose={() => {
                    socketService.endAccusation();
                    if (gameState?.activePromptDetails !== null) {
                        socketService.setAllPlayerModals('PromptPerformance');
                    } else {
                        socketService.setAllPlayerModals(null);
                    }
                }}
                cancelButtonText="Skip"
            />

            {/* Wait For Rule Selection Modal */}
            <SimpleModal
                visible={currentModal === 'AwaitRuleSelection'}
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
                    socketService.setAllPlayerModals("PromptPerformance");
                }}
                onClose={() => {
                    socketService.setPlayerModal(currentUser!.id, null);
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
                    const playerHasRules = gameState?.rules.some(rule => rule.assignedTo === selectedPlayerForAction?.id);
                    socketService.acceptPrompt();

                    if (playerHasRules) {
                        socketService.setAllPlayerModals('PromptResolution');
                    } else {
                        onFinishPrompt(() => {
                            socketService.endPrompt();
                            socketService.setAllPlayerModals(null);
                        });
                    }
                }}
                onFailure={() => {
                    onFinishPrompt(() => {
                        socketService.endPrompt();
                        socketService.setAllPlayerModals(null);
                    });
                }}
            />

            {/* Prompt Resolution Modal */}
            <PromptResolutionModal
                visible={currentModal === 'PromptResolution'}
                onShredRule={onShredRule}
            // onSkip={() => {
            //     onFinishPrompt(() => {
            //         socketService.setAllPlayerModals(gameState?.id!, null);
            //         socketService.endPrompt();
            //     });
            // }}
            />
        </>
    );
}