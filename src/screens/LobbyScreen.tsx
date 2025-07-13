import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useGame } from '../context/GameContext';
import * as Clipboard from 'expo-clipboard';
import StripedBackground from '../components/Backdrop';
import OutlinedText from '../components/OutlinedText';
import { PrimaryButton } from '../components/Buttons';
import { Player } from '../types/game';
import shared from '../shared/styles';
import socketService from '../services/socketService';

export default function LobbyScreen() {
    const { gameState, currentUser, getHostPlayer, getNonHostPlayers } = useGame();

    const [startingPoints, setStartingPoints] = useState('20');
    const [numRules, setNumRules] = useState('3');
    const [numPrompts, setNumPrompts] = useState('3');

    const host = getHostPlayer();
    const nonHostPlayers = getNonHostPlayers();
    const isHost = currentUser?.id === host?.id;

    const lobbyCode = gameState?.lobbyCode || '';

    const copyLobbyCode = async () => {
        await Clipboard.setStringAsync(lobbyCode);
    };

    const handleStartGame = () => {
        if (!gameState?.players?.length) {
            Alert.alert('Error', 'Need at least one player to start');
            return;
        }

        // Get the game settings from the UI
        const settings = {
            numRules: parseInt(numRules) || 3,
            numPrompts: parseInt(numPrompts) || 3,
            startingPoints: parseInt(startingPoints) || 20
        };

        // Start the game with settings - this will update settings on server and start the game
        socketService.startGame(settings);
    };

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <ScrollView style={shared.scrollView} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                    {/* Lobby Code Section */}
                    <View style={shared.section}>
                        <OutlinedText>Lobby Code</OutlinedText>
                        <PrimaryButton
                            title={lobbyCode}
                            onPress={copyLobbyCode}
                            textStyle={styles.lobbyCodeText}
                        />
                    </View>

                    {/* Host Section */}
                    <View style={shared.section}>
                        <OutlinedText>Host</OutlinedText>
                        {host && (
                            <View style={styles.hostContainer}>
                                <View key={host.id} style={shared.listedUserCard}>
                                    <Text style={shared.listedUserText}>{host.name}</Text>
                                </View>
                            </View>
                        )}
                        {!host && (
                            <Text style={{ textAlign: 'center' }}>No Host Found</Text>
                        )}
                    </View>

                    {/* Players Section */}
                    <View style={shared.section}>
                        <OutlinedText>Players</OutlinedText>
                        {nonHostPlayers && nonHostPlayers.length > 0 && (
                            <View style={styles.playerGrid}>
                                {nonHostPlayers?.map((player: Player) => (
                                    <View key={player.id} style={shared.listedUserCard}>
                                        <Text style={shared.listedUserText}>{player.name}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {nonHostPlayers && nonHostPlayers.length === 0 && (
                            <Text style={{ textAlign: 'center' }}>No Players</Text>
                        )}
                    </View>

                    {/* Host Settings Section */}
                    {isHost && (
                        <View style={shared.section}>
                            <OutlinedText>Game Settings</OutlinedText>

                            <View style={styles.settingContainer}>
                                <OutlinedText style={styles.settingLabel}>Starting Points</OutlinedText>
                                <TextInput
                                    style={styles.settingInput}
                                    keyboardType="numeric"
                                    value={startingPoints}
                                    onChangeText={setStartingPoints}
                                    placeholder="20"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.settingContainer}>
                                <OutlinedText style={styles.settingLabel}>Number of Rules</OutlinedText>
                                <TextInput
                                    style={styles.settingInput}
                                    keyboardType="numeric"
                                    value={numRules}
                                    onChangeText={setNumRules}
                                    placeholder="3"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.settingContainer}>
                                <OutlinedText style={styles.settingLabel}>Number of Prompts</OutlinedText>
                                <TextInput
                                    style={styles.settingInput}
                                    value={numPrompts}
                                    onChangeText={setNumPrompts}
                                    keyboardType="numeric"
                                    placeholder="3"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>
                    )}

                    {/* Start Game Button */}
                    {isHost && (
                        <View style={shared.section}>
                            <PrimaryButton
                                onPress={handleStartGame}
                                disabled={!gameState?.players?.length}
                                title="Start Game"
                            />
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </StripedBackground>
    );
}

const styles = StyleSheet.create({
    lobbyCodeText: {
        letterSpacing: 2,
    },
    hostContainer: {
        alignItems: 'center',
    },
    playerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    settingContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    settingLabel: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    settingInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
        width: 200,
        textAlign: 'center',
    },
}); 