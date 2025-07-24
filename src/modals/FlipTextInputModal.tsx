import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    SafeAreaView,
} from 'react-native';
import { Rule } from '../types/game';
import shared from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import Plaque from '../components/Plaque';

interface FlipTextInputModalProps {
    visible: boolean;
    selectedRule: Rule | null;
    onFlipRule: (rule: Rule, flippedText: string) => void;
    onClose?: () => void;
}

export default function FlipTextInputModal({
    visible,
    selectedRule,
    onFlipRule,
    onClose,
}: FlipTextInputModalProps) {
    const [flippedRuleText, setFlippedRuleText] = useState('');

    const handleSubmit = () => {
        if (!flippedRuleText.trim()) {
            return;
        }
        if (!selectedRule) return;
        onFlipRule(selectedRule, flippedRuleText.trim());
        setFlippedRuleText('');
    };

    const handleClose = () => {
        setFlippedRuleText('');
        if (onClose) onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>FLIP</Text>
                    <Text style={shared.modalDescription}>
                        Enter the flipped/negated version of this rule:
                    </Text>

                    <Plaque
                        plaque={selectedRule!}
                    />

                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={flippedRuleText}
                            onChangeText={setFlippedRuleText}
                            placeholder="Enter flipped rule text..."
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={shared.buttonContainer}>
                        {onClose && <SecondaryButton
                            title="Cancel"
                            onPress={handleClose}
                        />}

                        <PrimaryButton
                            title="Flip Rule"
                            onPress={handleSubmit}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    textInputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    }
}); 