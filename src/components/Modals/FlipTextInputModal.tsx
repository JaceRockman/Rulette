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
import { Rule } from '../../types/game';

interface FlipTextInputModalProps {
    visible: boolean;
    selectedRule: Rule | null;
    onFlipRule: (flippedText: string) => void;
    onClose: () => void;
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
        onFlipRule(flippedRuleText.trim());
        setFlippedRuleText('');
    };

    const handleClose = () => {
        setFlippedRuleText('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Flip Rule: "{selectedRule?.text}"</Text>
                    <Text style={styles.modalDescription}>
                        Enter the flipped/negated version of this rule:
                    </Text>

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

                    <View style={styles.modalButtonRow}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.confirmButton]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.confirmButtonText}>Flip Rule</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
    },
    modalDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
    },
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
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#28a745',
        borderWidth: 1,
        borderColor: '#28a745',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 