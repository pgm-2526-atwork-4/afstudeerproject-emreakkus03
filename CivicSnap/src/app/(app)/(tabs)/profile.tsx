import React, { useEffect, useState } from "react"; // Import React and hooks
import {
    View, // Base container component
    StyleSheet, // Utility for creating styles
    ScrollView, // Scrollable vertical container
    Image, // Image component for avatar/icons
    TouchableOpacity, // Pressable wrapper
    ActivityIndicator, // Loading spinner
    Text, // Text rendering component
} from "react-native"; // Import UI primitives from React Native
import { SafeAreaView } from "react-native-safe-area-context"; // Respect device safe areas
import { useRouter } from "expo-router"; // Navigation hook from Expo Router
import { Ionicons } from "@expo/vector-icons"; // Icon set used in UI

// ---- Context & API ---- // Section label for context and API imports
import { useAuthContext } from "@components/functional/Auth/authProvider"; // Authentication/profile context
import { API } from "@core/networking/api"; // API client abstraction
import { useRealtime } from "@core/modules/realtimeProvider/RealtimeProvider"; // Realtime update context

// ---- Styling ---- // Section label for theme imports
import { Variables } from "@/style/theme"; // Theme variables (colors/fonts/sizes)

export default function ProfileScreen() {
    // Profile screen component
    const router = useRouter(); // Router instance for navigation
    const { profile } = useAuthContext(); // Current authenticated user profile
    const { lastUpdate } = useRealtime(); // Timestamp/token that changes on realtime events

    const [userReports, setUserReports] = useState<any[]>([]); // User reports state
    const [loading, setLoading] = useState(true); // Loading state for report fetch

    // --- User data --- // Section label for profile-derived values
   const [displayName, setDisplayName] = useState(profile?.full_name || "Gebruiker");
const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);
const [points, setPoints] = useState(profile?.current_points || 0);
const [currentLevel, setCurrentLevel] = useState(profile?.lifetime_points || 1);

useEffect(() => {
    if (profile) {
        setDisplayName(profile.full_name || "Gebruiker");
        setAvatarUrl(profile.avatar_url);
        setPoints(profile.current_points || 0);
        setCurrentLevel(profile.lifetime_points || 1);
    }
}, [profile]);

    useEffect(() => {
        // Fetch user reports when profile or realtime update changes
        if (!profile?.$id) return; // Exit if user id is not available

        const fetchUserReports = async () => {
            // Async function to fetch and process reports
            try {
                const response = await API.database.listDocuments(
                    API.config.databaseId, // Database id
                    API.config.reportsCollectionId, // Reports collection id
                );

                let myReports = response.documents.filter(
                    (doc: any) => doc.user_id === profile.$id, // Keep only reports created by current user
                );
                myReports.sort(
                    (a: any, b: any) =>
                        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime(), // Newest first
                );

                // NEW: Iterate over all reports to resolve category_name
                const reportsWithCategories = await Promise.all(
                    myReports.map(async (report: any) => {
                        // Map each report asynchronously
                        let fetchedCategoryName = "Probleem"; // Default category label

                        if (report.category_id) {
                            // Resolve category only if category_id exists
                            try {
                                if (
                                    typeof report.category_id === "object" && // category may already be expanded object
                                    report.category_id.name // ensure object has name
                                ) {
                                    fetchedCategoryName = report.category_id.name; // Use expanded category name
                                } else {
                                    const categoryData = await API.database.getDocument(
                                        API.config.databaseId, // Database id
                                        API.config.categoriesCollectionId, // Categories collection id
                                        report.category_id, // Category document id
                                    );
                                    fetchedCategoryName = categoryData.name || "Probleem"; // Use fetched name with fallback
                                }
                            } catch (catError) {
                                // Handle category fetch errors per report
                                console.error(
                                    `Could not fetch category for report ${report.$id}:`, // Error message (translated)
                                    catError, // Original error object
                                );
                            }
                        }

                        // Return report with additional category_name field
                        return { ...report, category_name: fetchedCategoryName }; // Enriched report object
                    }),
                );

                // Store report list including resolved category names
                setUserReports(reportsWithCategories); // Update report state
            } catch (error) {
                // Handle report list fetch errors
                console.error("Error fetching reports:", error); // Error message (translated)
            } finally {
                // Always clear loading flag
                setLoading(false); // Mark loading as finished
            }
        };

        fetchUserReports(); // Trigger report fetch
    }, [profile?.$id, lastUpdate]); // Re-run when user id or realtime token changes

    // --- NEW: Realtime profile points updates --- // Section label
    useEffect(() => {
        // Fetch fresh profile to keep points/XP in sync
        if (!profile?.$id) return; // Exit if user id is not available

        const fetchFreshProfile = async () => {
            // Async function to fetch latest profile document
            try {
                const freshData = await API.database.getDocument(
                    API.config.databaseId, // Database id
                    API.config.profilesCollectionId, // Fetch profile collection instead of reports
                    profile.$id, // Current profile document id
                );

                // Update local state so UI updates immediately
                setDisplayName(freshData.full_name || "Gebruiker");
        setAvatarUrl(freshData.avatar_url);
        setPoints(freshData.current_points || 0);
        setCurrentLevel(freshData.lifetime_points || 1);
            } catch (error) {
                // Handle profile refresh errors
                console.error("Error updating profile in realtime:", error); // Error message (translated)
            }
        };

        fetchFreshProfile(); // Trigger profile refresh
    }, [lastUpdate, profile?.$id]); // Re-run on realtime updates and profile id change

    // --- Calculations --- // Section label
    const totalReports = userReports.length; // Total number of user reports
    const resolvedReports = userReports.filter(
        (r) => r.status === "resolved", // Keep resolved items
    ).length; // Count resolved reports

    // --- Exponential Level Logic --- // Section label
    const calculateLevelInfo = (totalXp: number) => {
        // Helper to derive level and progress
        let tempLevel = 1; // Start level
        let xpForNextTier = 1000; // XP needed to reach level 2
        let remainingXp = totalXp; // Remaining XP to distribute over tiers

        // Loop scales infinitely: L2=1000, L3=1500, L4=2000, etc.
        while (remainingXp >= xpForNextTier) {
            // Keep leveling while enough XP remains
            remainingXp -= xpForNextTier; // Consume XP for current tier
            tempLevel++; // Increase level
            xpForNextTier += 500; // Increase next tier requirement
        }

        const percentage = (remainingXp / xpForNextTier) * 100; // Progress to next level in %
        const needed = xpForNextTier - remainingXp; // XP still needed to level up

        return {
            calculatedLevel: tempLevel, // Computed level
            progressPercent: percentage, // Progress percentage
            pointsNeeded: needed, // Remaining points to next level
        };
    };

    // currentLevel contains lifetime_points (XP) from profile data
    const { calculatedLevel, progressPercent, pointsNeeded } =
        calculateLevelInfo(currentLevel); // Compute level metadata

    const formatDate = (dateString: string) => {
        // Date formatting helper
        return new Date(dateString).toLocaleDateString("nl-NL", {
            // Dutch locale output
            day: "2-digit", // Two-digit day
            month: "short", // Short month
            year: "numeric", // Full year
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Root safe-area container */}
            <ScrollView bounces={true} showsVerticalScrollIndicator={false}>
                {/* Main scroll area */}
                <View style={styles.header}>
                    {/* Header row */}
                    <Text style={styles.headerTitle}>Profiel</Text>
                    {/* Screen title */}
                    <TouchableOpacity
                        onPress={() => router.push("/(app)/settings" as any)} // Navigate to settings
                    >
                        <Ionicons
                            style={styles.settingsIcon} // Settings icon style
                            name="settings-outline" // Icon name
                            size={28} // Icon size
                            color={Variables.colors.textLight} // Icon color
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    {/* Top profile block */}
                    <View style={styles.avatarContainer}>
                        {/* Avatar wrapper */}
                        <Image
                            source={
                                avatarUrl // Use remote avatar if available
                                    ? { uri: avatarUrl } // Remote source
                                    : require("@assets/icons/User.png") // Local fallback image
                            }
                            style={styles.avatar} // Avatar styling
                        />
                        <TouchableOpacity style={styles.editBadge}  onPress={() => router.push("/(app)/settings/edit-profile" as any)}>
                            {/* Edit icon badge (currently no action) */}
                            <Ionicons name="pencil" size={14} color="white" />
                            {/* Pencil icon */}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.nameText}>{displayName}</Text>
                    {/* Display name */}

                    <View style={styles.levelPointsRow}>
                        {/* Level and points row */}
                        <Text style={styles.levelText}>Level {calculatedLevel}</Text>
                        {/* Current level label */}
                        <View style={styles.pointsGroup}>
                            {/* Points + diamond group */}
                            <Text style={styles.pointsText}>{points}</Text>
                            {/* Current points number */}
                            <Image
                                source={require("@assets/icons/Diamant.png")} // Diamond icon
                                style={styles.diamondIcon} // Diamond icon style
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    {/* Stats cards row */}
                    {/* Total reports - now tappable */}
                    <TouchableOpacity
                        style={styles.statCard} // Card style
                        activeOpacity={0.7} // Tap opacity
                        onPress={() => router.push("/(app)/report/my-reports" as any)} // Go to all reports
                    >
                        <Text style={styles.statCardTitle}>
                            Totaal aantal{"\n"}meldingen
                        </Text>
                        <Text style={styles.statCardNumber}>
                            {loading ? "-" : totalReports}
                        </Text>
                    </TouchableOpacity>

                    {/* Resolved reports - also tappable */}
                    <TouchableOpacity
                        style={styles.statCard} // Card style
                        activeOpacity={0.7} // Tap opacity
                        onPress={() => router.push("/(app)/report/my-reports" as any)} // Go to all reports
                    >
                        <Text style={styles.statCardTitle}>Opgeloste{"\n"}meldingen</Text>
                        <Text style={styles.statCardNumber}>
                            {loading ? "-" : resolvedReports}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    {/* Level section */}
                    <Text style={styles.sectionTitle}>Mijn level</Text>
                    {/* Section title */}

                    <View style={styles.levelBarWrapper}>
                        {/* Progress area wrapper */}
                        <View style={styles.progressBarBackground}>
                            {/* Progress background */}
                            <View
                                style={[
                                    styles.progressBarFill, // Filled progress style
                                    { width: `${progressPercent}%` }, // Dynamic width based on progress
                                ]}
                            >
                                {/* Avatar on progress bar (with real profile image) */}
                                <View style={styles.progressAvatarWrapper}>
                                    {/* Floating avatar wrapper */}
                                    <Image
                                        source={
                                            avatarUrl // Use remote avatar if present
                                                ? { uri: avatarUrl } // Remote source
                                                : require("@assets/icons/User.png") // Local fallback
                                        }
                                        style={styles.progressAvatar} // Avatar style on progress bar
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.levelLabelsRow}>
                            {/* Row with current level, needed points, next level */}
                            <Text
                                style={[
                                    styles.levelLabelText, // Base label style
                                    { color: Variables.colors.primary }, // Highlight current level label
                                ]}
                            >
                                Level {calculatedLevel}
                            </Text>

                            <Text style={styles.pointsNeededText}>
                                nog {pointsNeeded > 0 ? pointsNeeded : 0} punten
                            </Text>

                            <Text style={styles.levelLabelText}>
                                Level {calculatedLevel + 1}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    {/* Reports section */}
                    <View style={styles.sectionHeader}>
                        {/* Section title + action row */}
                        <Text style={styles.sectionTitle}>Mijn meldingen</Text>
                        {/* Section title */}
                        {userReports.length > 3 && (
                            // Show action only when more than 3 reports exist
                            <TouchableOpacity
                                onPress={() => router.push("/(app)/report/my-reports" as any)} // Navigate to full report list
                            >
                                <Text style={styles.viewAllText}>Bekijk alles</Text>
                                {/* View all action text */}
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        // Loading state
                        <ActivityIndicator
                            size="small" // Spinner size
                            color={Variables.colors.primary} // Spinner color
                            style={{ marginTop: 20 }} // Spinner margin
                        />
                    ) : userReports.length === 0 ? (
                        // Empty state
                        <Text style={styles.emptyText}>
                            Je hebt nog geen meldingen gemaakt.
                        </Text>
                    ) : (
                        // List first 3 reports
                        userReports.slice(0, 3).map((report: any) => {
                            // --- Realtime status logic (same as detail page) ---
                            const isInvalid = report.status === "invalid"; // Rejected status
                            const isResolved = report.status === "resolved"; // Resolved status
                            const isInProgress =
                                report.status === "approved" || report.status === "in_progress"; // In-progress statuses
                            // If none of the above applies, default status is "new" (Reported)

                            // Determine colors/icons based on status
                            let bgColor = "#E3F2FD"; // Default blue (new)
                            let iconColor = "#1976D2"; // Default icon/text color
                            let iconName = "document-text"; // Default icon
                            let statusText = "Gemeld"; // Default status label

                            if (isInvalid) {
                                // Rejected state style
                                bgColor = "#FFEBEE"; // Red background
                                iconColor = "#D32F2F"; // Red icon/text
                                iconName = "close-circle"; // Rejected icon
                                statusText = "Afgewezen"; // Rejected label
                            } else if (isResolved) {
                                // Resolved state style
                                bgColor = "#E8F5E9"; // Green background
                                iconColor = "#388E3C"; // Green icon/text
                                iconName = "checkmark-circle"; // Resolved icon
                                statusText = "Opgelost"; // Resolved label
                            } else if (isInProgress) {
                                // In-progress state style
                                bgColor = "#FFF3E0"; // Orange background
                                iconColor = "#F57C00"; // Orange icon/text
                                iconName = "build"; // In-progress icon
                                statusText = "In behandeling"; // In-progress label
                            }

                            return (
                                <TouchableOpacity
                                    key={report.$id} // Stable list key
                                    style={styles.reportCard} // Card style
                                    onPress={() =>
                                        router.push(`/(app)/report/${report.$id}` as any) // Navigate to report detail
                                    }
                                >
                                    {/* --- ICON WRAPPER --- */}
                                    <View
                                        style={[
                                            styles.statusIconWrapper, // Icon wrapper base style
                                            { backgroundColor: bgColor }, // Dynamic status background
                                        ]}
                                    >
                                        {/* If you want custom Figma icons, replace Ionicons with Image */}
                                        <Ionicons
                                            name={iconName as any} // Dynamic icon name
                                            size={26} // Icon size
                                            color={iconColor} // Dynamic icon color
                                        />
                                    </View>

                                    {/* --- TEXT WRAPPER --- */}
                                    <View style={styles.reportCardContent}>
                                        {/* Text content area */}
                                        <View style={styles.reportHeaderRow}>
                                            {/* Date + status row */}
                                            <Text style={styles.reportDate}>
                                                {formatDate(report.$createdAt)}
                                            </Text>
                                            {/* Status badge text */}
                                            <Text
                                                style={[styles.statusBadgeText, { color: iconColor }]}
                                            >
                                                {statusText}
                                            </Text>
                                        </View>
                                        <Text style={styles.reportAddress} numberOfLines={2}>
                                            {/* Report summary line */}
                                            <Text style={{ fontFamily: Variables.fonts.bold }}>
                                                {report.category_name || "Probleem"}:
                                            </Text>{" "}
                                            {report.address}, {report.zip_code} {report.city}
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name="chevron-forward" // Chevron indicator
                                        size={20} // Chevron size
                                        color={Variables.colors.textLight} // Chevron color
                                    />
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        // Root container style
        flex: 1, // Fill available screen
        backgroundColor: Variables.colors.background || "#F8F9FA", // Screen background color
    },
    header: {
        // Header wrapper style
        position: "relative", // Allow absolute-positioned icon
        flexDirection: "row", // Horizontal layout
        justifyContent: "center", // Center title horizontally
        alignItems: "center", // Center items vertically
        paddingHorizontal: 20, // Horizontal spacing
        paddingVertical: 10, // Vertical spacing
    },
    headerTitle: {
        // Header title text
        fontFamily: Variables.fonts.bold, // Bold font family
        fontSize: Variables.textSizes.xl, // Large title size
        color: Variables.colors.text, // Main text color
        alignSelf: "center", // Center alignment in row
    },
    settingsIcon: {
        // Settings icon positioning
        position: "absolute", // Absolute positioning in header
        right: -100, // Horizontal offset
        transform: [{ translateY: -14 }], // Vertical shift
    },
    profileSection: {
        // Top profile section
        alignItems: "center", // Center children horizontally
        marginTop: 20, // Space from header
    },
    avatarContainer: {
        // Avatar container style
        position: "relative", // For positioning edit badge
    },
    avatar: {
        // Main avatar image
        width: 90, // Avatar width
        height: 90, // Avatar height
        borderRadius: 45, // Circular shape
        backgroundColor: "#E0E0E0", // Placeholder background
    },
    editBadge: {
        // Edit badge on avatar
        position: "absolute", // Overlay on avatar
        bottom: 0, // Anchor to bottom
        right: 0, // Anchor to right
        backgroundColor: Variables.colors.primary, // Badge background
        width: 28, // Badge width
        height: 28, // Badge height
        borderRadius: 14, // Circular badge
        justifyContent: "center", // Center icon horizontally
        alignItems: "center", // Center icon vertically
        borderWidth: 2, // Badge border thickness
        borderColor: Variables.colors.background, // Badge border color
    },
    nameText: {
        // Display name text
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: 22, // Name size
        marginTop: 15, // Space above name
        color: Variables.colors.text, // Primary text color
    },
    levelPointsRow: {
        // Level/points row
        flexDirection: "row", // Horizontal layout
        alignItems: "center", // Vertical alignment
        marginTop: 5, // Space above row
        gap: 25, // Gap between level and points
    },
    pointsGroup: {
        // Points and diamond group
        flexDirection: "row", // Horizontal layout
        alignItems: "center", // Vertical alignment
        gap: 4, // Small spacing
    },
    levelText: {
        // Level label text
        fontFamily: Variables.fonts.regular, // Regular font
        fontSize: 16, // Level text size
        color: Variables.colors.textLight, // Secondary text color
    },
    pointsText: {
        // Points number text
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: 18, // Points text size
        color: Variables.colors.text, // Primary text color
    },
    diamondIcon: {
        // Diamond image style
        width: 20, // Icon width
        height: 20, // Icon height
        resizeMode: "contain", // Keep aspect ratio
    },
    statsContainer: {
        // Stats cards row container
        flexDirection: "row", // Horizontal layout
        justifyContent: "space-between", // Distribute cards
        paddingHorizontal: 20, // Horizontal padding
        marginTop: 30, // Top spacing
        gap: 15, // Gap between cards
    },
    statCard: {
        // Individual stat card style
        flex: 1, // Equal width cards
        backgroundColor: "#FFFFFF", // Card background
        borderRadius: 16, // Rounded corners
        padding: 20, // Inner spacing
        alignItems: "center", // Center card content
        shadowColor: "#000", // Shadow color
        shadowOffset: { width: 0, height: 2 }, // Shadow offset
        shadowOpacity: 0.05, // Shadow opacity
        shadowRadius: 5, // Shadow blur radius
        elevation: 3, // Android elevation
    },
    statCardTitle: {
        // Stat card title style
        fontFamily: Variables.fonts.regular, // Regular font
        fontSize: 13, // Title size
        color: Variables.colors.textLight, // Secondary color
        textAlign: "center", // Center text
        marginBottom: 10, // Space below title
    },
    statCardNumber: {
        // Stat number style
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: 28, // Number size
        color: Variables.colors.text, // Primary text color
    },
    section: {
        // Generic section wrapper
        paddingHorizontal: 20, // Horizontal padding
        marginTop: 35, // Top spacing
        marginBottom: 10, // Bottom spacing
    },
    sectionTitle: {
        // Generic section title
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: 20, // Title size
        color: Variables.colors.text, // Primary text color
        marginBottom: 15, // Space below title
    },

    // --- Progress bar styles ---
    levelBarWrapper: {
        // Progress area wrapper
        marginTop: 10, // Space from section title
    },
    progressBarBackground: {
        // Progress track style
        width: "100%", // Full width
        height: 18, // Track height
        backgroundColor: "#E0E0E0", // Track color
        borderRadius: 10, // Rounded track
        position: "relative", // Anchor for inner elements
    },
    progressBarFill: {
        // Filled progress style
        height: "100%", // Match track height
        backgroundColor: Variables.colors.primary || "#1976D2", // Fill color
        borderRadius: 10, // Rounded fill
        position: "relative", // Anchor floating avatar
    },
    progressAvatarWrapper: {
        // Floating avatar container on fill edge
        position: "absolute", // Absolute inside fill
        right: -15, // Overhang to the right
        top: -8, // Move above bar
        width: 34, // Wrapper width
        height: 34, // Wrapper height
        borderRadius: 17, // Circular wrapper
        backgroundColor: "#FFFFFF", // White background
        justifyContent: "center", // Center image horizontally
        alignItems: "center", // Center image vertically
        // NEW: Blue border around avatar on progress bar
        borderWidth: 2, // Border width
        borderColor: Variables.colors.primary || "#1976D2", // Border color
        shadowColor: "#000", // Shadow color
        shadowOffset: { width: 0, height: 2 }, // Shadow offset
        shadowOpacity: 0.2, // Shadow opacity
        shadowRadius: 3, // Shadow blur
        elevation: 4, // Android elevation
    },

    pointsNeededText: {
        // Middle "points needed" pill style
        fontFamily: Variables.fonts.semibold, // Semibold font
        fontSize: 12, // Text size
        // NEW: Blue text on light blue background
        color: Variables.colors.primary || "#1976D2", // Text color
        backgroundColor: "#E3F2FD", // Pill background
        paddingHorizontal: 10, // Horizontal padding
        paddingVertical: 3, // Vertical padding
        borderRadius: 12, // Rounded corners
        overflow: "hidden", // Clip rounded background
    },
    progressAvatar: {
        // Avatar image inside progress wrapper
        width: 28, // Image width
        height: 28, // Image height
        borderRadius: 14, // Circular image
    },
    levelLabelsRow: {
        // Labels row under progress bar
        flexDirection: "row", // Horizontal layout
        justifyContent: "space-between", // Spread labels
        marginTop: 15, // Space above labels
    },
    levelLabelText: {
        // Level label text style
        fontFamily: Variables.fonts.regular, // Regular font
        fontSize: 12, // Label size
        color: Variables.colors.textLight, // Secondary color
    },

    reportCard: {
        // Report item card style
        flexDirection: "row", // Horizontal layout
        alignItems: "center", // Vertical alignment
        backgroundColor: "#FFFFFF", // Card background
        borderRadius: 16, // Rounded corners
        padding: 15, // Inner spacing
        marginBottom: 12, // Space between cards
        shadowColor: "#000", // Shadow color
        shadowOffset: { width: 0, height: 2 }, // Shadow offset
        shadowOpacity: 0.05, // Shadow opacity
        shadowRadius: 5, // Shadow blur
        elevation: 2, // Android elevation
    },
    statusIconWrapper: {
        // Circular status icon background
        width: 50, // Wrapper width
        height: 50, // Wrapper height
        borderRadius: 25, // Circular shape
        justifyContent: "center", // Center icon horizontally
        alignItems: "center", // Center icon vertically
        marginRight: 15, // Space before text area
    },
    reportCardContent: {
        // Main text content of report card
        flex: 1, // Fill available row width
    },
    reportDate: {
        // Report date text
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: 15, // Date size
        color: Variables.colors.text, // Primary text color
    },
    reportAddress: {
        // Report address/summary text
        fontFamily: Variables.fonts.regular, // Regular font
        fontSize: 13, // Text size
        color: Variables.colors.textLight, // Secondary text color
        lineHeight: 18, // Line spacing
    },
    emptyText: {
        // Empty state text
        fontFamily: Variables.fonts.regular, // Regular font
        color: Variables.colors.textLight, // Secondary color
        textAlign: "center", // Center alignment
        marginTop: 10, // Top spacing
    },
    sectionHeader: {
        // Header row inside section
        flexDirection: "row", // Horizontal layout
        justifyContent: "space-between", // Title left, action right
        alignItems: "center", // Vertical alignment
        marginBottom: 15, // Space below header row
    },
    viewAllText: {
        // "View all" action style
        fontFamily: Variables.fonts.bold, // Bold font
        color: Variables.colors.primary, // Primary color
        fontSize: 14, // Text size
        marginBottom: 15, // Bottom spacing
    },
    reportHeaderRow: {
        // Row containing date + status
        flexDirection: "row", // Horizontal layout
        justifyContent: "space-between", // Split date and badge
        alignItems: "center", // Vertical alignment
        marginBottom: 4, // Spacing below row
    },
    statusBadgeText: {
        // Status badge text style
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: 13, // Badge text size
    },
});
