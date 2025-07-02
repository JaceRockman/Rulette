import { StyleSheet } from 'react-native';

const shared = StyleSheet.create({
    container: {
        flex: 1,
    },
    button: {
        backgroundColor: '#fff',
        borderColor: '#000',
        borderWidth: 3,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
        borderColor: '#000',
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
        color: '#000',
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
        backgroundColor: '#000',
    },
    dividerText: {
        color: '#000',
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default shared; 