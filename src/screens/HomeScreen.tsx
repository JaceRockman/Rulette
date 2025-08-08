import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import StripedBackground from '../components/Backdrop';
import shared from '../shared/styles';
import { PrimaryButton } from '../components/Buttons';
import socketService from '../services/socketService';
import { GameState } from '../types/game';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [playerName, setPlayerName] = useState('');
    const [lobbyCode, setLobbyCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleCreateLobby = async () => {
        const trimmedPlayerName = playerName.trim();

        if (!trimmedPlayerName) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setIsCreating(true);

        try {
            await socketService.connect();
        } catch (err) {
            // Error alert is already shown by the connection error handler
            setIsCreating(false);
            return;
        }

        if (!socketService.isConnected()) {
            Alert.alert('Connection Error', 'Could not connect to the server.');
            setIsCreating(false);
            return;
        }

        socketService.createLobby(trimmedPlayerName);
        navigation.navigate('Lobby', {});
        setIsCreating(false);
    };

    const handleJoinLobby = async () => {
        if (!playerName.trim() || !lobbyCode.trim()) {
            Alert.alert('Error', 'Please enter both your name and lobby code');
            return;
        }

        setIsJoining(true);

        try {
            await socketService.connect();
        } catch (err) {
            setIsJoining(false);
            return;
        }

        if (!socketService.isConnected()) {
            Alert.alert('Connection Error', 'Could not connect to the server.');
            setIsJoining(false);
            return;
        }

        socketService.joinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
        setTimeout(() => {
            setIsJoining(false);
        }, 2000);
        // Do NOT navigate here; wait for joined_lobby or targeted navigate event
    };

    useEffect(() => {
        socketService.setOnError((errorMessage) => {
            Alert.alert('Alert', errorMessage);
            setIsJoining(false);
        });
        socketService.setOnConnectionError((message) => {
            Alert.alert('Connection Error', message);
        });
        const handleJoinedLobby = (data: { playerId: string; game: GameState }) => {
            navigation.navigate('Lobby', { lobbyCode: data.game.lobbyCode });
            setIsJoining(false);
        };
        socketService.setOnJoinedLobby(handleJoinedLobby);
        return () => {
            socketService.setOnError(null);
            socketService.setOnConnectionError(null);
            socketService.setOnJoinedLobby(null as any);
        };
    }, [navigation]);

    return (
        <StripedBackground>
            <SafeAreaView style={styles.flexOne}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flexOne}
                >
                    <View style={styles.content}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={shared.input}
                                placeholder="Enter your name"
                                placeholderTextColor="#9ca3af"
                                value={playerName}
                                onChangeText={setPlayerName}
                                maxLength={20}
                            />
                        </View>

                        <View style={styles.spacer} />

                        <View style={styles.buttonContainer}>
                            <PrimaryButton
                                title={isCreating ? 'Creating...' : 'Create Lobby'}
                                onPress={handleCreateLobby}
                                disabled={isCreating}
                                buttonStyle={styles.createButton}
                                textStyle={styles.createButtonText}
                            />

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.joinSection}>
                                <TextInput
                                    style={[shared.input, styles.lobbyCodeInput]}
                                    placeholder="Enter lobby code"
                                    placeholderTextColor="#9ca3af"
                                    value={lobbyCode}
                                    onChangeText={text => setLobbyCode(text.toUpperCase())}
                                    maxLength={6}
                                    autoCorrect={false}
                                    autoCapitalize="characters"
                                />
                                <PrimaryButton
                                    title={isJoining ? 'Joining...' : 'Join Lobby'}
                                    onPress={handleJoinLobby}
                                    disabled={isJoining}
                                    buttonStyle={styles.joinButton}
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </StripedBackground>
    );
}

const styles = StyleSheet.create({
    flexOne: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 150,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 30,
    },
    spacer: {
        height: 120,
    },
    buttonContainer: {
        width: '100%',
    },
    createButton: {
        paddingVertical: 32,
        borderRadius: 30,
        borderWidth: 8
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
        color: '#ffffff',
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: 'bold',
    },
    joinSection: {
        width: '100%',
    },
    joinButton: {
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        borderWidth: 2,
        marginTop: 0,
    },
    lobbyCodeInput: {
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomWidth: 0,
        borderWidth: 2,
        marginBottom: 0,
    },
    createButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
}); 