export interface Player {
    id: string;
    name: string;
    points: number;
    rules: Rule[];
    isHost: boolean;
    rulesCompleted?: boolean;
    promptsCompleted?: boolean;
    currentModal?: string; // Modal identifier for this player
}

export interface Plaque {
    id: string;
    type: 'rule' | 'prompt' | 'modifier' | 'end';
    text: string;
    category?: string;
    assignedTo?: string; // player id
    isActive?: boolean;
    plaqueColor: string;
    authorId: string; // player id who created this plaque
}

export interface Prompt extends Plaque {
    type: 'prompt';
    isActive: boolean;
}

export interface Rule extends Plaque {
    type: 'rule';
    isActive: boolean;
}

export interface Modifier extends Plaque {
    type: 'modifier';
    isActive: boolean;
}

export interface End extends Plaque {
    type: 'end';
}

export interface WheelSegment {
    id: string;
    layers: Plaque[];
    currentLayerIndex: number;
    segmentColor: string;
}

export interface GameState {
    id: string;
    lobbyCode: string;
    players: Player[];
    rules: Rule[];
    prompts: Prompt[];
    modifiers: Modifier[];
    playerInputCompleted: boolean;
    wheelSegments: WheelSegment[];
    wheelSpinDetails?: WheelSpinDetails;
    currentUser?: string; // The user ID of the person currently using the app
    activePlayer?: string; // The player ID of the player currently taking their turn (excludes host)
    selectedRule?: string; // The rule ID of the rule currently being selected
    selectedPlayerForAction?: string; // The player ID of the player currently being acted upon
    activeAccusationDetails?: ActiveAccusationDetails;
    activePromptDetails?: ActivePromptDetails;
    activeCloneRuleDetails?: ActiveCloneRuleDetails;
    activeFlipRuleDetails?: ActiveFlipRuleDetails;
    activeSwapRuleDetails?: ActiveSwapRuleDetails;
    activeUpDownRuleDetails?: ActiveUpDownRuleDetails;
    isGameStarted: boolean;
    isWheelSpinning: boolean;
    currentStack: StackItem[];
    roundNumber: number;
    numRules: number;
    numPrompts: number;
    gameEnded: boolean;
    winner?: Player;
    globalModal?: string;
}

export interface StackItem {
    type: 'rule' | 'prompt' | 'modifier';
    content: Rule | Prompt | string;
}

export interface LobbySettings {
    maxPlayers: number;
    startingPoints: number;
    pointsPerPrompt: number;
    pointsPerRuleBreak: number;
}

export interface WheelSpinDetails {
    spinningPlayerId: string;
    finalIndex: number;
    scrollAmount: number;
    duration: number;
}

export interface ActiveAccusationDetails {
    rule: Rule;
    accuser: Player;
    accused: Player;
    accusationAccepted?: boolean;
}

export interface ActivePromptDetails {
    selectedPrompt: Prompt;
    selectedPlayer: Player;
    isPromptAccepted?: boolean;
}

export interface ActiveCloneRuleDetails {
    cloningPlayer: Player;
    ruleToClone?: Rule;
    targetPlayer?: Player;
    cloningCompleted?: boolean;
}

export interface ActiveFlipRuleDetails {
    flippingPlayer: Player;
    ruleToFlip?: Rule;
}

export interface ActiveSwapRuleDetails {
    swapper: Player;
    swapperRule?: Rule;
    swappee?: Player;
    swappeeRule?: Rule;
}

export interface ActiveUpDownRuleDetails {
    direction: 'up' | 'down';
    selectedRules: { [playerId: string]: Rule };
    isComplete: boolean;
}
