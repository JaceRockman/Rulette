import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import shared from '../styles/shared';
import StripedBackground from '../components/StripedBackground';
import OutlinedText from '../components/OutlinedText';

export default function RuleWritingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { gameState, addRule } = useGame();
    const [rules, setRules] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const numRules = Number(gameState?.numRules) || 3;

    const handleAddRule = () => {
        if (input.trim()) {
            setRules([...rules, input.trim()]);
            addRule(input.trim());
            setInput('');
        }
    };

    const handleContinue = () => {
        navigation.navigate('PromptWriting');
    };

    return (
        <StripedBackground>
            <SafeAreaView style={shared.container}>
                <View style={{ paddingTop: 100, alignItems: 'center' }}>
                    <OutlinedText>Enter Rules ({rules.length} / {numRules})</OutlinedText>
                    <TextInput
                        style={shared.input}
                        placeholder="Enter a rule..."
                        value={input}
                        onChangeText={setInput}
                        maxLength={100}
                    />
                    <TouchableOpacity
                        style={shared.button}
                        onPress={handleAddRule}
                        disabled={!input.trim() || rules.length >= numRules}
                    >
                        <Text style={shared.buttonText}>Add Rule</Text>
                    </TouchableOpacity>
                    <View style={{ marginVertical: 16, width: '100%' }}>
                        {rules.map((rule, idx) => (
                            <Text key={idx} style={{ color: '#000', marginBottom: 4 }}>
                                {idx + 1}. {rule}
                            </Text>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={[shared.button, { opacity: rules.length === numRules ? 1 : 0.5 }]}
                        onPress={handleContinue}
                        disabled={rules.length !== numRules}
                    >
                        <Text style={shared.buttonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </StripedBackground>
    );
} 