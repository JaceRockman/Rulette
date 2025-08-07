import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import OutlinedText from '../components/OutlinedText';
import Backdrop from '../components/Backdrop';
import shared from '../shared/styles';
import socketService from '../services/socketService';
import { useGame } from '../context/GameContext';

// Use StackScreenProps to get navigation and route
export default function GameOverScreen() {
    const { gameState, currentUser, getNonHostPlayers } = useGame();

    const nonHostPlayers = getNonHostPlayers();
    const winner = nonHostPlayers?.find(player => player.points === Math.max(...nonHostPlayers.map(player => player.points) || [0]));
    const winnerName = winner?.name;
    const winnerPoints = winner?.points;

    return (
        <Backdrop>
            <View style={[shared.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <OutlinedText style={{ fontSize: 48, marginBottom: 20, textAlign: 'center' }}>
                    GAME OVER!
                </OutlinedText>

                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: 40,
                    margin: 20,
                    borderWidth: 4,
                    borderColor: '#000',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                }}>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: 10,
                        color: '#000',
                    }}>
                        🏆 WINNER! 🏆
                    </Text>
                    <Text style={{
                        fontSize: 24,
                        textAlign: 'center',
                        marginBottom: 10,
                        color: '#000',
                    }}>
                        {winnerName}
                    </Text>
                    <Text style={{
                        fontSize: 20,
                        textAlign: 'center',
                        color: '#000',
                    }}>
                        {winnerPoints} points
                    </Text>
                </View>

                {currentUser?.isHost &&
                    <TouchableOpacity
                        style={[shared.button, { marginTop: 30 }]}
                        onPress={() => socketService.broadcastNavigateToScreen('Home')}
                    >
                        <Text style={shared.buttonText}>Back to Home</Text>
                    </TouchableOpacity>}
            </View>
        </Backdrop>
    );
}
