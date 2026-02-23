import ThemedText from '@components/design/Typography/ThemedText';
import { Variables } from '@style/theme';
import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

type ButtonLinkProps = {
    children: React.ReactNode;
    href: any;
};

const styles = StyleSheet.create({
    secondaryButton: {
        borderColor: Variables.colors.primary,
        borderWidth: 2,
        paddingVertical: Variables.sizes.md,
        borderRadius: Variables.sizes.md,
        marginHorizontal: Variables.sizes.lg,
        marginBottom: Variables.sizes.lg,
    },
    text: {
        color: Variables.colors.primary,
        textAlign: "center",
    }
});

const ButtonLink = ( { children, href }: ButtonLinkProps ) => {
    return (
        <Link style={styles.secondaryButton} href={href}>
            <ThemedText color='blue' type='center'>{children}</ThemedText>
        </Link>
    );
};

export default ButtonLink;