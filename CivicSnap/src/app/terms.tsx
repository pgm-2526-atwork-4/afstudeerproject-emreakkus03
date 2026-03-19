import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@components/design/Button/BackButton";
import { Variables } from "@style/theme";

export default function TermsScreen() {
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <View style={styles.backButtonWrapper}>
                    <BackButton />
                </View>
                <Text style={styles.headerTitle}>Gebruiksvoorwaarden</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Laatst bijgewerkt op: 19 maart 2026</Text>

                <Text style={styles.intro}>
                    Welkom bij CivicSnap. Door deze app te downloaden en te gebruiken, ga je akkoord met de onderstaande voorwaarden. Lees deze zorgvuldig door.
                </Text>

                <Text style={styles.sectionTitle}>1. Doel van de app en Acceptabel Gebruik</Text>
                <Text style={styles.paragraph}>
                    CivicSnap is ontwikkeld als een communicatiemiddel om samen de leefbaarheid en veiligheid in gemeentes te verbeteren. Je bent als gebruiker persoonlijk verantwoordelijk voor de inhoud van de meldingen die je verstuurt.
                </Text>
                <Text style={styles.paragraph}>Het is ten strengste verboden om de app te gebruiken voor:</Text>
                <Text style={styles.bullet}>• Het plaatsen van valse, misleidende of 'spam' meldingen.</Text>
                <Text style={styles.bullet}>• Het uploaden van haatdragende, illegale, of seksueel expliciete foto's.</Text>
                <Text style={styles.bullet}>• Het taggen van ongepaste content op specifieke geografische locaties.</Text>
                <Text style={styles.bullet}>• Het moedwillig overbelasten van onze servers of die van onze partners.</Text>

                <Text style={styles.sectionTitle}>2. Moderatie en "Shadowbans"</Text>
                <Text style={styles.paragraph}>
                    Om de kwaliteit van de meldingen hoog te houden, maken wij gebruik van zowel geautomatiseerde systemen als handmatige controles. Indien wij misbruik detecteren, behouden wij ons het recht voor om zonder voorafgaande waarschuwing maatregelen te nemen, waaronder een "shadowban".
                </Text>

                <Text style={styles.sectionTitle}>3. Regels omtrent het gebruik van de Kaart</Text>
                <Text style={styles.paragraph}>De interactieve kaart wordt geleverd door Google Maps. Het is verboden om:</Text>
                <Text style={styles.bullet}>• Geografische data of adressen uit de app te kopiëren of te scrapen.</Text>
                <Text style={styles.bullet}>• De data van Google Maps weer te geven op diensten van derde partijen.</Text>

                <Text style={styles.sectionTitle}>4. Beperking van Aansprakelijkheid</Text>
                <Text style={styles.paragraph}>
                    CivicSnap is op geen enkele wijze verantwoordelijk voor de termijn waarbinnen een gemeente een probleem oppakt, de manier waarop een gemeente een melding oplost, of eventuele schade die voortvloeit uit onopgeloste meldingen.
                </Text>

                <Text style={styles.paragraph}>
                    Door CivicSnap te gebruiken, bevestig je dat je deze voorwaarden hebt gelezen, begrepen en ermee akkoord gaat.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Variables.colors.background },
    header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Variables.sizes.md,
    paddingVertical: Variables.sizes.sm,
    backgroundColor: Variables.colors.background,
},
backButtonWrapper: {
    width: 40,
    top: 15,
    left: 5,
    zIndex: 10,
    transform: [{ scale: 1.5 }],
},
    headerTitle: {
        fontFamily: Variables.fonts.bold,
        fontSize: Variables.textSizes.xl,
        color: Variables.colors.text,
          flex: 1, 
    textAlign: "center", 
    },
    content: {
        padding: Variables.sizes.md,
    },
    lastUpdated: {
        fontFamily: Variables.fonts.regular,
        fontSize: Variables.textSizes.sm,
        color: Variables.colors.textLight,
        marginBottom: Variables.sizes.md,
    },
    intro: {
        fontFamily: Variables.fonts.regular,
        fontSize: Variables.textSizes.base,
        color: Variables.colors.text,
        lineHeight: 22,
        marginBottom: Variables.sizes.md,
    },
    sectionTitle: {
        fontFamily: Variables.fonts.bold,
        fontSize: Variables.textSizes.md,
        color: Variables.colors.text,
        marginTop: Variables.sizes.md,
        marginBottom: Variables.sizes.sm,
    },
    paragraph: {
        fontFamily: Variables.fonts.regular,
        fontSize: Variables.textSizes.base,
        color: Variables.colors.text,
        lineHeight: 22,
        marginBottom: Variables.sizes.sm,
    },
    bullet: {
        fontFamily: Variables.fonts.regular,
        fontSize: Variables.textSizes.base,
        color: Variables.colors.text,
        lineHeight: 22,
        marginBottom: Variables.sizes.sm,
        paddingLeft: Variables.sizes.xs,
    },
    bold: {
        fontFamily: Variables.fonts.bold,
    },
});