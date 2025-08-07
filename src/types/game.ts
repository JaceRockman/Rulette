export interface Player {
    id: string;
    name: string;
    points: number;
    rules: Rule[];
    isHost: boolean;
    playerOrderPosition?: number | null; // null for hosts, 1+ for players
    rulesCompleted?: boolean;
    promptsCompleted?: boolean;
    currentModal?: string | null;
}

export interface Plaque {
    id: string;
    type: 'rule' | 'prompt' | 'modifier' | 'end';
    text: string;
    assignedTo?: string | null; // player id
    isActive: boolean | null;
    plaqueColor: string;
    authorId: string; // player id who created this plaque
    isFlipped?: boolean;
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
    settings: GameSettings | null;
    rules: Rule[];
    prompts: Prompt[];
    modifiers: Modifier[];
    ends: End[];
    playerInputCompleted: boolean;
    wheelSegments: WheelSegment[];
    wheelSpinDetails?: WheelSpinDetails | null;
    currentUser?: string; // The user ID of the person currently using the app
    activePlayer?: string; // The player ID of the player currently taking their turn (excludes host)
    selectedRule?: string; // The rule ID of the rule currently being selected
    selectedPlayerForAction?: string; // The player ID of the player currently being acted upon
    activeAccusationDetails?: ActiveAccusationDetails | null;
    activePromptDetails?: ActivePromptDetails | null;
    activeCloneRuleDetails?: ActiveCloneRuleDetails | null;
    activeFlipRuleDetails?: ActiveFlipRuleDetails | null;
    activeSwapRuleDetails?: ActiveSwapRuleDetails | null;
    activeUpDownRuleDetails?: ActiveUpDownRuleDetails | null;
    isGameStarted: boolean;
    isWheelSpinning: boolean;
    currentStack: StackItem[];
    roundNumber: number;
    gameEnded: boolean;
    winner?: Player;
}

export interface GameSettings {
    customRulesAndPrompts: number;
    startingPoints: number;
    hostIsValidTarget: boolean;
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
    spunSegmentId?: string;
    spinCompleted?: boolean;
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
    ruleToClone: Rule | null;
    targetPlayer: Player | null;
    cloningCompleted?: boolean;
}

export interface ActiveFlipRuleDetails {
    flippingPlayer: Player;
    ruleToFlip: Rule | null;
    flippedText: string | null;
}

export interface ActiveSwapRuleDetails {
    swapper: Player;
    swapperRule: Rule | null;
    swappee: Player | null;
    swappeeRule: Rule | null;
}

export interface ActiveUpDownRuleDetails {
    direction: 'up' | 'down';
    selectedRules: { [playerId: string]: Rule };
    isComplete: boolean;
}
