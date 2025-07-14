export interface Player {
    id: string;
    name: string;
    points: number;
    rules: Rule[];
    isHost: boolean;
    rulesCompleted?: boolean;
    promptsCompleted?: boolean;
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
}

export interface End extends Plaque {
    type: 'end';
}

export interface WheelSegmentLayer {
    type: 'rule' | 'prompt' | 'modifier' | 'end';
    content: Rule | Prompt | Modifier | End;
    isActive: boolean;
}

export interface WheelSegment {
    id: string;
    layers: WheelSegmentLayer[];
    currentLayerIndex: number;
    color: string;
    plaqueColor: string;
}

export interface GameState {
    id: string;
    lobbyCode: string;
    players: Player[];
    rules: Rule[];
    prompts: Prompt[];
    modifiers: Modifier[];
    wheelSegments: WheelSegment[];
    currentUser?: string; // The user ID of the person currently using the app
    activePlayer?: string; // The player ID of the player currently taking their turn (excludes host)
    activePromptDetails?: ActivePromptDetails;
    activeAccusationDetails?: ActiveAccusationDetails;
    isGameStarted: boolean;
    isWheelSpinning: boolean;
    currentStack: StackItem[];
    roundNumber: number;
    numRules: number;
    numPrompts: number;
    gameEnded: boolean;
    winner?: Player;
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

export interface ActiveAccusationDetails {
    ruleId: string;
    accuserId: string;
    accusedId: string;
    accusationAccepted?: boolean;
}

export interface ActivePromptDetails {
    selectedPrompt: Prompt;
    selectedPlayer: Player;
    isPromptAccepted?: boolean;
}