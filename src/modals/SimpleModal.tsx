import React from 'react';
import { Modal, View, Text, SafeAreaView } from 'react-native';

import { shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ExitModalButton from '../components/ExitModalButton';

interface SimpleModalProps {
    visible: boolean;
    title: string;
    description: string;
    content?: React.ReactNode;
    onAccept?: () => void;
    acceptButtonText?: string;
    acceptButtonDisabled?: boolean;
    acceptButtonDisplayed?: boolean;
    onClose?: () => void;
    cancelButtonText?: string;
    cancelButtonDisabled?: boolean;
    cancelButtonDisplayed?: boolean;
    onRequestClose?: () => void;
}

export default function SimpleModal({
    visible,
    title,
    description,
    content,
    onAccept,
    acceptButtonText = 'Accept',
    acceptButtonDisabled = false,
    acceptButtonDisplayed = true,
    onClose,
    cancelButtonText = 'Cancel',
    cancelButtonDisabled = false,
    cancelButtonDisplayed = true,
    onRequestClose
}: SimpleModalProps) {

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

                    <ExitModalButton />

                    <Text style={shared.modalTitle}>{title}</Text>
                    <Text style={shared.modalDescription}>{description}</Text>

                    {content}

                    <View style={shared.buttonContainer}>
                        {cancelButtonDisplayed && onClose &&
                            <SecondaryButton
                                title={cancelButtonText}
                                onPress={onClose}
                                disabled={cancelButtonDisabled}
                            />}
                        {acceptButtonDisplayed && onAccept &&
                            <PrimaryButton
                                title={acceptButtonText}
                                onPress={onAccept}
                                disabled={acceptButtonDisabled}
                            />}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}