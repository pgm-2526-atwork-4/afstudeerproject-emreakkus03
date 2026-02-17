import { View, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Button from '@components/design/Button/PrimaryButton';
import ThemedText from '@components/design/Typography/ThemedText';
import { useAuthContext } from '@components/functional/Auth/authProvider';
import { Variables } from '@style/theme';

export default function ProfileScreen() {
    const router = useRouter();
    
        const { logout, user } = useAuthContext();
    
        const handleLogout = async () => {
            try {
                await logout();
                router.push('/welcome');
            } catch (error) {
                console.error("Logout mislukt:", error);
            }
        };
    return (
        <SafeAreaView style={styles.container}>
        <View>
            <Button 
                    variant="secondary" 
                    onPress={handleLogout}
                >
                    UITLOGGEN
                </Button>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
   container: {
        flex: 1,
        backgroundColor: Variables.colors.background, 
    },
    
});