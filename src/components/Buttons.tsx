
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../shared/styles';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    buttonStyle?: any;
    textStyle?: any
}

export function PrimaryButton({ title, onPress, disabled, buttonStyle, textStyle }: PrimaryButtonProps) {
    return (
        <TouchableOpacity style={[styles.primaryButton, buttonStyle]} onPress={onPress} disabled={disabled}>
            <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
}

interface SecondaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    buttonStyle?: any;
    textStyle?: any
}

export function SecondaryButton({ title, onPress, disabled, buttonStyle, textStyle }: SecondaryButtonProps) {
    return (
        <TouchableOpacity style={[styles.secondaryButton, buttonStyle]} onPress={onPress} disabled={disabled}>
            <Text style={[styles.secondaryButtonText, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    primaryButton: {
        backgroundColor: colors.gameChangerWhite,
        borderColor: colors.border.primary,
        borderWidth: 3,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButtonText: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: colors.gameChangerBlack,
        borderColor: colors.gameChangerRed,
        borderWidth: 3,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    secondaryButtonText: {
        color: colors.gameChangerWhite,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

// Tertiary buttons

// Text buttons

// Icon buttons

// Outlined buttons