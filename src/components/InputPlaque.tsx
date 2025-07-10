import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput, SafeAreaView } from 'react-native';

interface InputPlaqueProps {
    visible: boolean;
    title: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    maxLength?: number;
    minLength?: number;
    plaqueColor?: string;
}

export default function InputPlaque({
    visible,
    title,
    placeholder,
    value,
    onChangeText,
    onConfirm,
    onCancel,
    maxLength = 100,
    minLength = 1,
    plaqueColor = '#fff'
}: InputPlaqueProps) {
    const popupScale = useRef(new Animated.Value(0)).current;
    const popupOpacity = useRef(new Animated.Value(0)).current;
    const textInputRef = useRef<TextInput>(null);

    // Determine text color based on plaque color (same logic as wheel segments)
    const isLightPlaque = plaqueColor === '#fbbf24' || plaqueColor === '#fff';
    const textColor = isLightPlaque ? '#000' : '#fff';

    // Check if input is valid
    const trimmedValue = value.trim();
    const isValid = trimmedValue.length >= minLength;

    useEffect(() => {
        if (visible) {
            // Animate the popup opening
            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                    easing: t => 1 - Math.pow(1 - t, 3), // ease out
                }),
                Animated.timing(popupOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Focus the text input after animation completes
                setTimeout(() => {
                    textInputRef.current?.focus();
                }, 100);
            });
        } else {
            // Animate the popup closing
            Animated.parallel([
                Animated.timing(popupScale, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(popupOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
            }}
        >
            <Animated.View
                style={{
                    backgroundColor: plaqueColor,
                    borderRadius: 20,
                    padding: 40,
                    margin: 20,
                    width: '90%',
                    maxHeight: '60%',
                    borderWidth: 4,
                    borderColor: '#000',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    transform: [{ scale: popupScale }],
                    opacity: popupOpacity,
                }}
            >
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: 20,
                        color: textColor,
                    }}
                >
                    {title}
                </Text>

                <TextInput
                    ref={textInputRef}
                    style={{
                        fontSize: 18,
                        borderWidth: 2,
                        borderColor: '#000',
                        borderRadius: 10,
                        padding: 15,
                        marginBottom: 10,
                        backgroundColor: '#fff',
                        color: '#000',
                        textAlign: 'center',
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#666"
                    value={value}
                    onChangeText={onChangeText}
                    maxLength={maxLength}
                    multiline={false}
                />

                {/* Character count and validation feedback */}
                <View style={{ marginBottom: 20, alignItems: 'center' }}>
                    {trimmedValue.length >= maxLength - 10 && (
                        <Text style={{
                            fontSize: 14,
                            color: trimmedValue.length >= maxLength ? '#dc3545' : '#ffa500',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>
                            {trimmedValue.length}/{maxLength} characters
                        </Text>
                    )}
                    {trimmedValue.length > 0 && trimmedValue.length < minLength && (
                        <Text style={{
                            fontSize: 12,
                            color: '#dc3545',
                            textAlign: 'center',
                            marginTop: 5
                        }}>
                            Minimum {minLength} characters required
                        </Text>
                    )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 15 }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#666',
                            paddingHorizontal: 30,
                            paddingVertical: 15,
                            borderRadius: 10,
                            flex: 1,
                        }}
                        onPress={onCancel}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                            CANCEL
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            backgroundColor: isValid ? '#000' : '#999',
                            paddingHorizontal: 30,
                            paddingVertical: 15,
                            borderRadius: 10,
                            flex: 1,
                        }}
                        onPress={onConfirm}
                        disabled={!isValid}
                    >
                        <Text style={{
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            opacity: isValid ? 1 : 0.7
                        }}>
                            CONFIRM
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
} 