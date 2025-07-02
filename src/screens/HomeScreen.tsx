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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';

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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <LinearGradient
                    colors={['#6366f1', '#8b5cf6', '#ec4899']}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>Spin That Wheel</Text>
                        <Text style={styles.subtitle}>Create or join a game lobby</Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor="#9ca3af"
                                value={playerName}
                                onChangeText={setPlayerName}
                                maxLength={20}
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.createButton]}
                                onPress={handleCreateLobby}
                                disabled={isCreating}
                            >
                                <Text style={styles.buttonText}>
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
                                    style={styles.input}
                                    placeholder="Enter lobby code"
                                    placeholderTextColor="#9ca3af"
                                    value={lobbyCode}
                                    onChangeText={setLobbyCode}
                                    maxLength={6}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[styles.button, styles.joinButton]}
                                    onPress={handleJoinLobby}
                                    disabled={isJoining}
                                >
                                    <Text style={styles.buttonText}>
                                        {isJoining ? 'Joining...' : 'Join Lobby'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#e5e7eb',
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 30,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    createButton: {
        backgroundColor: '#10b981',
    },
    joinButton: {
        backgroundColor: '#3b82f6',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
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
}); 