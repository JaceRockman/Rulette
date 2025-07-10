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
    type: 'rule' | 'prompt';
    text: string;
    category?: string;
    assignedTo?: string; // player id (optional - assigned when wheel lands on it)
    isActive?: boolean;
    plaqueColor: string;
    isFiller?: boolean;
    authorId: string; // player id who created this plaque
}

export interface Prompt extends Plaque {
    type: 'prompt';
}

export interface Rule extends Plaque {
    type: 'rule';
    isActive: boolean;
}

export interface WheelLayer {
    type: 'rule' | 'prompt' | 'modifier' | 'end';
    content: Rule | Prompt | string;
    isActive: boolean;
    plaqueColor: string;
}

export interface WheelSegment {
    id: string;
    layers: WheelLayer[];
    currentLayerIndex: number;
    color: string;
    plaqueColor: string;
}

export interface GameState {
    id: string;
    code: string;
    players: Player[];
    prompts: Prompt[];
    rules: Rule[];
    wheelSegments: WheelSegment[];
    currentUser?: string; // The user ID of the person currently using the app
    activePlayer?: string; // The player ID of the player currently taking their turn (excludes host)
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

export interface GameEvent {
    type: 'player_joined' | 'player_left' | 'game_started' | 'wheel_spun' | 'points_changed' | 'rule_assigned' | 'rule_swapped';
    data: any;
    timestamp: number;
} 