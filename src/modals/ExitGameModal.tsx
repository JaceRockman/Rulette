import React from 'react';
import { Modal, View, Text, SafeAreaView } from 'react-native';

import { shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { useNavigation } from '@react-navigation/native';

interface ExitGameModalProps {
    visible: boolean;
    onAccept: () => void;
    onClose: () => void;
    onRequestClose?: () => void;
}

export default function ExitGameModal({
    visible,
    onAccept,
    onClose,
    onRequestClose
}: ExitGameModalProps) {
    const navigation = useNavigation<any>();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onRequestClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
                    <Text style={shared.modalTitle}>Exit Game</Text>
                    <Text style={shared.modalDescription}>Are you sure you want to exit the game?</Text>

                    <View style={shared.buttonContainer}>
                        <SecondaryButton
                            title="No"
                            onPress={onClose}
                        />
                        <PrimaryButton
                            title="Yes"
                            onPress={() => {
                                onAccept()
                                navigation.navigate('Home')
                            }}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}