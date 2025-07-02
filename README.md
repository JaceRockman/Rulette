# Spin That Wheel - Mobile Game App

A multiplayer mobile game where players create lobbies, add prompts and rules, and spin a wheel to determine game actions. Players earn points for completing prompts and lose points for breaking rules.

## Features

### 🎮 Core Gameplay
- **Lobby System**: Create or join game lobbies with unique codes
- **Multiplayer Support**: Multiple players can join the same lobby
- **Custom Prompts**: Add your own prompts for players to complete
- **Custom Rules**: Create rules and assign them to specific players
- **Point System**: Players start with 20 points, earn 2 for prompts, lose 1 for rule breaks
- **Rule Management**: Swap rules between players or reassign them

### 🎯 Game Mechanics
- **Wheel Spinning**: Animated wheel with randomized results
- **Stack System**: Results come in stacks: rule → prompt/modifier → prompt/modifier → end
- **Modifiers**: Special effects like "Double Points", "Skip Turn", "Reverse Order", "Free Pass"
- **Real-time Updates**: Live score tracking and rule management

### 📱 Mobile Features
- **Beautiful UI**: Modern gradient design with smooth animations
- **Haptic Feedback**: Tactile feedback when spinning the wheel
- **Responsive Design**: Works on all mobile screen sizes
- **Clipboard Integration**: Easy lobby code sharing

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for screen navigation
- **React Native SVG** for wheel graphics
- **Expo Haptics** for tactile feedback
- **Expo Linear Gradient** for beautiful backgrounds
- **Expo Clipboard** for code sharing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS) or Android Studio (for Android)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Spin-That-Wheel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

### Development

- **Start development server**: `npm start`
- **Run on iOS**: `npm run ios`
- **Run on Android**: `npm run android`
- **Run on web**: `npm run web`
- **Run tests**: `npm test`

## Game Flow

1. **Home Screen**: Enter your name and create or join a lobby
2. **Lobby Screen**: 
   - Share the lobby code with friends
   - Add custom prompts and rules
   - Assign rules to players
   - Start the game (host only)
3. **Game Screen**:
   - View all players and their scores
   - Manage points (+2 for prompts, -1 for rule breaks)
   - Swap rules between players
   - Spin the wheel
4. **Wheel Screen**:
   - Watch the animated wheel spin
   - See results from the stack
   - Navigate through stack items
   - Return to game

## Project Structure

```
src/
├── context/
│   └── GameContext.tsx      # Game state management
├── screens/
│   ├── HomeScreen.tsx       # Welcome and lobby creation
│   ├── LobbyScreen.tsx      # Lobby management
│   ├── GameScreen.tsx       # Main game interface
│   └── WheelScreen.tsx      # Wheel spinning interface
└── types/
    └── game.ts              # TypeScript interfaces
```

## Game Rules

### Point System
- **Starting Points**: 20 per player
- **Prompt Completion**: +2 points
- **Rule Violation**: -1 point
- **Minimum Points**: 0 (cannot go negative)

### Stack Generation
The wheel generates random stacks with this pattern:
1. **Rule** (if available)
2. **Prompt** or **Modifier** (random)
3. **Prompt** or **Modifier** (random, 50% chance)
4. **End**

### Modifiers
- **Double Points**: Next prompt is worth 4 points instead of 2
- **Skip Turn**: Player skips their next turn
- **Reverse Order**: Play order is reversed
- **Free Pass**: Player can skip one rule violation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Real-time multiplayer with WebSocket backend
- [ ] Custom wheel themes and colors
- [ ] Sound effects and background music
- [ ] Game history and statistics
- [ ] Achievement system
- [ ] Custom rule templates
- [ ] Tournament mode
- [ ] Social features (friend lists, invites)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team. 