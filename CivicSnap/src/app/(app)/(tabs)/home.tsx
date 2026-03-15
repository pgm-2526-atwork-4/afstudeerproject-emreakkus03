import React, { useEffect, useState } from "react"; // Import React and hooks
import { View, StyleSheet, ScrollView, Text, Image } from "react-native"; // Import core React Native UI components
import { SafeAreaView } from "react-native-safe-area-context"; // Import safe area wrapper for notches/status bars
import { useRouter } from "expo-router"; // Import router hook for navigation

// ---- Components ---- // Section header for imported components
// --- Design --- // Design-related components
import ThemedText from "@components/design/Typography/ThemedText"; // Custom themed text component
// --- Functional --- // Functional/business components
import { useAuthContext } from "@components/functional/Auth/authProvider"; // Auth context hook
import LocationMap from "@components/functional/Map/LocationMap"; // Map component
// ---- Custom Styles ---- // Style/theme imports
import { Variables } from "@style/theme"; // Shared theme variables (colors, sizes, fonts)

import { useRealtime } from "@core/modules/realtimeProvider/RealtimeProvider"; // Realtime provider hook
import { API } from "@core/networking/api"; // API client abstraction

export default function HomeScreen() {
  const router = useRouter(); // Initialize router (currently unused, kept for future navigation)
  const { profile } = useAuthContext(); // Get user profile from auth context
  const { lastUpdate } = useRealtime(); // Get realtime update trigger value

  const [points, setPoints] = useState(profile?.current_points || 0); // Local state for current points
  const [currentLevel, setCurrentLevel] = useState(profile?.lifetime_points || 1); // Local state for current level

  const displayName = profile?.full_name?.split(" ")[0] || "User"; // Use first name or fallback to "User"
  const avatarUrl = profile?.avatar_url; // Read avatar URL from profile

  useEffect(() => {
    // Update local values whenever profile changes
    if (profile) {
      // Ensure profile exists
      setPoints(profile.current_points || 0); // Sync current points from profile
      setCurrentLevel(profile.lifetime_points || 1); // Sync current level from profile
    }
  }, [profile]); // Dependency: profile

  useEffect(() => {
    // Fetch latest profile when realtime updates occur
    if (!profile?.$id) return; // Stop if no profile ID is available

    const fetchLatestProfile = async () => {
      // Async function to fetch latest profile document
      try {
        // Try fetching fresh profile data
        const data = await API.database.getDocument(
          API.config.databaseId, // Database ID
          API.config.profilesCollectionId, // Profiles collection ID
          profile.$id // Current user profile document ID
        );
        setPoints(data.current_points || 0); // Update points from latest backend data
        setCurrentLevel(data.lifetime_points || 1); // Update level from latest backend data
      } catch (error) {
        // Handle request errors
        console.error("Error while realtime-updating profile:", error); // English error message
      }
    };

    fetchLatestProfile(); // Execute profile refresh
  }, [lastUpdate, profile?.$id]); // Dependencies: realtime tick and profile ID

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Main safe area container */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Scrollable page content */}
        <View style={styles.headerRow}>
          {/* Top row with profile and points */}
          <View style={styles.profileGroup}>
            {/* Left section: avatar + greeting */}
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl } // Use remote avatar if available
                  : require("@assets/icons/User.png") // Fallback avatar icon
              }
              style={styles.avatar}
            />
            <View>
              {/* Text block next to avatar */}
              <ThemedText style={styles.greeting}>
                {/* Greeting text */}
                Hi, {displayName}
              </ThemedText>

              <Text style={styles.levelText}>Level {currentLevel}</Text>
              {/* Level indicator */}
            </View>
          </View>

          <View style={styles.pointsGroup}>
            {/* Right section: points + diamond icon */}
            <Text style={styles.pointsValue}>{points}</Text>
            {/* Current points value */}
            <Image
              source={require("@assets/icons/Diamant.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            {/* Diamond icon */}
          </View>
        </View>

        <View style={styles.section}>
          {/* Main content section */}
          <LocationMap />
          {/* Map component */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    // Root screen container
    flex: 1, // Fill full screen
    backgroundColor: Variables.colors.background, // Screen background color
  },
  scrollContent: {
    // ScrollView content wrapper
    flexGrow: 1, // Allow content to grow and fill available height
    padding: Variables.sizes.lg || 20, // Base padding
    paddingBottom: 0, // Remove bottom padding
    paddingHorizontal: Variables.sizes.lg || 20, // Horizontal padding
  },
  header: {
    // Legacy/unused header style
    flexDirection: "row", // Horizontal layout
    justifyContent: "space-between", // Space between left and right elements
    alignItems: "flex-start", // Align to top
    marginBottom: 30, // Space below header
    marginTop: 10, // Space above header
  },
  headerRow: {
    // Active header row style
    flexDirection: "row", // Place children in a row
    alignItems: "center", // Vertically center items
    justifyContent: "space-between", // Push profile and points apart
    width: "100%", // Full width row
    marginBottom: 30, // Space below row
  },
  profileGroup: {
    // Profile info group (avatar + text)
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Vertically center content
    gap: 12, // Spacing between avatar and text
  },
  avatar: {
    // Avatar image style
    width: 56, // Avatar width
    height: 56, // Avatar height
    borderRadius: 28, // Make avatar circular
    backgroundColor: "#E0E0E0", // Placeholder background
  },
  greeting: {
    // Greeting text style
    fontFamily: Variables.fonts.bold || "bold", // Bold font
    fontSize: Variables.textSizes.lg || 22, // Large text size
    color: Variables.colors.text || "#000", // Primary text color
  },
  levelText: {
    // Level text style
    fontSize: Variables.textSizes.md || 16, // Medium text size
    color: Variables.colors.textLight || "#747373", // Secondary text color
    marginTop: 2, // Small top spacing
  },
  pointsGroup: {
    // Points display group
    flexDirection: "row", // Horizontal layout for number and icon
    alignItems: "center", // Vertical alignment
    gap: 6, // Spacing between points and icon
  },
  pointsValue: {
    // Points value text style
    fontSize: Variables.textSizes.lg || 22, // Large text size
    fontFamily: Variables.fonts.bold || "bold", // Bold font
    color: Variables.colors.text || "#000", // Primary text color
  },
  section: {
    // Section wrapper for map/content
    flex: 1, // Fill remaining space
    marginTop: 0, // No top margin
    marginHorizontal: -(Variables.sizes.lg || 20), // Extend content to screen edges
  },
});
