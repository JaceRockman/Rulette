import { Dimensions, StyleSheet } from 'react-native';

export const SCREEN_HEIGHT = Dimensions.get('window').height;
export const SCREEN_WIDTH = Dimensions.get('window').width;

// Color palette for the entire system
export const colors = {
    // Primary brand colors
    gameChangerRed: '#ed5c5d',
    gameChangerYellow: '#f6d170',
    gameChangerOrange: '#f3a962',
    gameChangerBlue: '#6bb9d3',
    gameChangerMaroon: '#b6475e',
    gameChangerWhite: '#fff',
    gameChangerBlack: '#000',
    gameChangerGray: '#202020',

    // Neutral colors
    black: '#000',
    gray: {
        light: '#f3f4f6',
        medium: '#9ca3af',
        dark: '#374151',
    },

    // Background colors
    background: {
        primary: '#fff',
        secondary: 'rgba(255, 255, 255, 0.9)',
        overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Text colors
    text: {
        primary: '#000',
        secondary: '#374151',
        light: '#fff',
    },

    // Border colors
    border: {
        primary: '#000',
        secondary: '#d1d5db',
    },
} as const;

export const LAYER_PLAQUE_COLORS = [colors.gameChangerBlue, colors.gameChangerYellow, colors.gameChangerRed];

export const SEGMENT_COLORS = [colors.gameChangerBlue, colors.gameChangerMaroon, colors.gameChangerRed, colors.gameChangerYellow];

// Define button style separately to avoid circular reference
const buttonStyle = {
    backgroundColor: colors.gameChangerWhite,
    borderColor: colors.border.primary,
    borderWidth: 3,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 16,
};

export const shared = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        width: '100%',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    modalContent: {
        width: '90%',
        maxWidth: 700,
        backgroundColor: colors.gameChangerWhite,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        alignSelf: 'center',
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: buttonStyle,
    disabledButton: { ...buttonStyle, opacity: 0.5 },
    buttonText: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: 20,
    },
    input: {
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text.secondary,
        textAlign: 'center',
        borderColor: colors.border.primary,
        borderWidth: 2,
        marginBottom: 12,
    },
    section: {
        marginBottom: 30,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 15,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 2,
        backgroundColor: colors.border.primary,
    },
    dividerText: {
        color: colors.text.primary,
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: 'bold',
    },
    listedUserCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: 8,
        alignItems: 'center',
        width: '47%',
    },
    listedUserText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#1f2937',
    },
});

export default shared;