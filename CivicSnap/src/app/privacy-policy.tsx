import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BackButton from "@components/design/Button/BackButton";
import { Variables } from "@style/theme";

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <View style={styles.backButtonWrapper}>
                    <BackButton />
                </View>
                <Text style={styles.headerTitle}>Privacybeleid</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Laatst bijgewerkt op: 19 maart 2026</Text>

                <Text style={styles.intro}>
                    Welkom bij CivicSnap! Wij hechten veel waarde aan jouw privacy en de bescherming van jouw persoonsgegevens. In dit Privacybeleid leggen we transparant uit welke gegevens we verzamelen, waarom we dat doen, en met welke externe partijen we deze delen. Dit beleid is opgesteld in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG/GDPR).
                </Text>

                <Text style={styles.sectionTitle}>1. Welke persoonsgegevens wij verzamelen</Text>
                <Text style={styles.paragraph}>Wanneer je CivicSnap gebruikt, verzamelen en verwerken wij de volgende gegevens:</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Accountgegevens:</Text> Wanneer je een account aanmaakt, slaan wij je naam en e-mailadres op in onze beveiligde database.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Locatiegegevens:</Text> Om een probleem in de gemeente accuraat te kunnen melden, vragen wij (met jouw uitdrukkelijke toestemming) toegang tot de GPS-locatie van je apparaat.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Media:</Text> Foto's die je via de camera maakt of selecteert uit je galerij om toe te voegen aan een melding.</Text>

                <Text style={styles.sectionTitle}>2. Delen van gegevens met externe diensten</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Google Maps API:</Text> Wij gebruiken Google Maps om de interactieve kaarten in de app weer te geven en om jouw GPS-coördinaten om te zetten in een leesbaar adres. Jouw gebruik van de kaart valt daarmee ook onder het Privacybeleid van Google.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Google Cloud Vision API:</Text> Foto's die je uploadt bij een melding, worden tijdelijk naar de systemen van Google gestuurd. Hier analyseert kunstmatige intelligentie de foto om deze automatisch in de juiste categorie in te delen en om ongepaste content te blokkeren.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>De Gemeente:</Text> Jouw meldingen (inclusief de foto, locatie en omschrijving) worden via ons afgeschermde dashboard rechtstreeks gedeeld met de bevoegde ambtenaren van jouw gemeente.</Text>

                <Text style={styles.sectionTitle}>3. Dataminimalisatie en Bewaartermijnen</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Permanente opslag:</Text> De ruwe coördinaten en de inhoud van jouw melding bewaren wij zolang de melding relevant is voor de gemeente.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Tijdelijke opslag (Caching):</Text> Uitgeschreven straatnamen en postcodes die via Google Maps worden opgehaald, worden maximaal 30 dagen in ons systeem bewaard.</Text>

                <Text style={styles.sectionTitle}>4. Jouw Rechten</Text>
                <Text style={styles.paragraph}>
                    Je hebt te allen tijde het recht om je gegevens in te zien of te corrigeren. Daarnaast bieden wij in de app een directe knop aan om je account en alle daaraan gekoppelde persoonlijke gegevens permanent te verwijderen.
                </Text>
                <Text style={styles.paragraph}>
                    Voor vragen over jouw privacy kun je contact met ons opnemen via: privacy@civicsnap.be
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
        top: 15,
        left: 5,
        zIndex: 10,
        transform: [{ scale: 1.5 }],
    },
    headerTitle: {
        fontFamily: Variables.fonts.bold,
        fontSize: Variables.textSizes.xl,
        color: Variables.colors.text,
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