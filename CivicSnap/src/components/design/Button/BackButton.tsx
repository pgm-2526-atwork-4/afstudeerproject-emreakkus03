import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Variables } from '@style/theme';

type Props = {
  color?: string;
};

export default function BackButton({ color }: Props) {
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() => router.back()}
            style={styles.container}
        >
            <Image 
                source={require('@assets/icons/Arrow-left-circle.png')}
                style={[styles.icon, { tintColor: color }]}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    
    marginBottom: 20, 
    alignSelf: 'flex-start', 
    padding: 5, 
  },
  icon: {
    width: 24,  
    height: 24,
    tintColor: Variables.colors.text,
  },
});