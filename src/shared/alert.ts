import { Alert, Platform } from 'react-native';

type Button = { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };

export function showAlert(
    title: string,
    message?: string,
    buttons?: Button[]
) {
    if (Platform.OS === 'web') {
        if (!buttons || buttons.length === 0) {
            // Simple alert fallback
            // eslint-disable-next-line no-alert
            window.alert(`${title}${message ? `\n\n${message}` : ''}`);
            return;
        }
        // If buttons provided, simulate the first as OK and optional second as Cancel
        const ok = buttons[0];
        const cancel = buttons.find(b => b.style === 'cancel') || buttons[1];
        if (cancel) {
            // eslint-disable-next-line no-alert
            const confirmed = window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
            if (confirmed) ok?.onPress?.(); else cancel.onPress?.();
        } else {
            // eslint-disable-next-line no-alert
            window.alert(`${title}${message ? `\n\n${message}` : ''}`);
            ok?.onPress?.();
        }
        return;
    }

    // Native platforms
    if (buttons && buttons.length > 0) {
        Alert.alert(title, message, buttons);
    } else {
        Alert.alert(title, message);
    }
}


