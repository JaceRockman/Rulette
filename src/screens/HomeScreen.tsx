import React, { useState } from 'react';
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
import StripedBackground from '../components/StripedBackground';
import shared from '../styles/shared';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { createLobby, joinLobby } = useGame();
    const [playerName, setPlayerName] = useState('');
    const [lobbyCode, setLobbyCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleCreateLobby = () => {
        if (!playerName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setIsCreating(true);
        createLobby(playerName.trim());
        setIsCreating(false);
        navigation.navigate('Lobby', { code: 'NEW' });
    };

    const handleJoinLobby = () => {
        if (!playerName.trim() || !lobbyCode.trim()) {
            Alert.alert('Error', 'Please enter both your name and lobby code');
            return;
        }

        setIsJoining(true);
        joinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
        setIsJoining(false);
        navigation.navigate('Lobby', { code: lobbyCode.trim().toUpperCase() });
    };

    return (
        <StripedBackground>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
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
                            <TouchableOpacity
                                style={[shared.button, styles.createButton]}
                                onPress={handleCreateLobby}
                                disabled={isCreating}
                            >
                                <Text style={[shared.buttonText, styles.createButtonText]}>
                                    {isCreating ? 'Creating...' : 'Create Lobby'}
                                </Text>
                            </TouchableOpacity>

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
                                    onChangeText={setLobbyCode}
                                    maxLength={6}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[shared.button, styles.joinButton]}
                                    onPress={handleJoinLobby}
                                    disabled={isJoining}
                                >
                                    <Text style={shared.buttonText}>
                                        {isJoining ? 'Joining...' : 'Join Lobby'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </StripedBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 100,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 30,
    },
    spacer: {
        height: 150,
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
        fontWeight: 'bold',
        fontSize: 22,
    },
}); 