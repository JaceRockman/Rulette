import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Rule } from '../types/game';
import { Plaque } from '../types/game';

import { colors, shared } from '../shared/styles';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { render2ColumnPlaqueList } from '../components/PlaqueList';

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
    cancelButtonDisplayed = true
}: SimpleModalProps) {

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={shared.modalOverlay}>
                <View style={shared.modalContent}>
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