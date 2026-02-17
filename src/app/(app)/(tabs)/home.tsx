import React from "react";
import { View, StyleSheet, ScrollView, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// ---- Expo-Icons ---- //
import Ionicons from "@expo/vector-icons/build/Ionicons";

// ---- Components ---- //
// --- Design ---
import Button from "@components/design/Button/PrimaryButton";
import ThemedText from "@components/design/Typography/ThemedText";
// --- Functional ---
import { useAuthContext } from "@components/functional/Auth/authProvider";
import LocationMap from "@components/functional/Map/LocationMap";
// ---- CustomStyles ---- //
import { Variables } from "@style/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthContext();

  const displayName = profile?.full_name || "Gebruiker";
  const points = profile?.current_points || 0;
  const avatarUrl = profile?.avatar_url;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.userContainer}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : require("@assets/icons/User.png")
              }
              style={styles.avatar}
            />

            <View>
              <ThemedText style={styles.greeting}>
                Hoi, {displayName}
              </ThemedText>
            </View>
          </View>

          <View style={styles.pointsBadge}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.pointsText}>{points} pts</Text>
          </View>
        </View>

        <View style={styles.section}>
                   
                    <LocationMap />
                </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Variables.colors.background,
  },
  scrollContent: {
    padding: Variables.sizes.lg || 20,
    paddingBottom: 0,
    paddingHorizontal: Variables.sizes.lg || 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    marginTop: 10,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    gap: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
        marginTop: 0,
        marginHorizontal: -(Variables.sizes.lg || 20),
    }
});
