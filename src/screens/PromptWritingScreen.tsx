import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../styles/shared';
import StripedBackground from '../components/StripedBackground';
import OutlinedText from '../components/OutlinedText';

export default function PromptWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addPrompt, dispatch } = useGame();
    const [prompts, setPrompts] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const numPrompts = Number(gameState?.numPrompts) || 3;

    const handleAddPrompt = () => {
        if (input.trim() && prompts.length < numPrompts) {
            setPrompts([...prompts, input.trim()]);
            addPrompt(input.trim());
            setInput('');
        }
    };

    const handleDone = () => {
        // Create wheel segments after all prompts are entered
        dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });

        navigation.reset({
            index: 0,
            routes: [{ name: 'Game' }],
        });
    };

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <View style={{ paddingTop: 100, alignItems: 'center' }}>
                    <OutlinedText>Enter Prompts ({prompts.length} / {numPrompts})</OutlinedText>
                    <TextInput
                        style={shared.input}
                        placeholder="Enter a prompt..."
                        value={input}
                        onChangeText={setInput}
                        maxLength={100}
                    />
                    <TouchableOpacity
                        style={shared.button}
                        onPress={handleAddPrompt}
                        disabled={!input.trim() || prompts.length >= numPrompts}
                    >
                        <Text style={shared.buttonText}>Add Prompt</Text>
                    </TouchableOpacity>
                    <View style={{ marginVertical: 16, width: '100%' }}>
                        {prompts.map((prompt, idx) => (
                            <Text key={idx} style={{ color: '#000', marginBottom: 4 }}>
                                {idx + 1}. {prompt}
                            </Text>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={shared.button}
                        onPress={handleDone}
                    >
                        <Text style={shared.buttonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </StripedBackground>
    );
} 