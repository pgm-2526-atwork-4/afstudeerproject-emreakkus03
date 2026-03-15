import React, { useEffect, useState } from "react"; // Import React and hooks
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native"; // Import React Native UI components
import { useRouter } from "expo-router"; // Import router hook for navigation
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for status and navigation icons

// ---- Context & API ---- // Section: context and API imports
import { useAuthContext } from "@components/functional/Auth/authProvider"; // Import authentication context to access profile
import { API } from "@core/networking/api"; // Import API helper for database calls
import { useRealtime } from "@core/modules/realtimeProvider/RealtimeProvider"; // Import realtime hook for live updates

// ---- Components & Styling ---- // Section: UI components and styling imports
import { Variables } from "@/style/theme"; // Import app theme variables
import BackButton from "@components/design/Button/BackButton"; // Import reusable back button
import ThemedText from "@components/design/Typography/ThemedText"; // Import themed text component

export default function MyReportsScreen() { // Define screen component
    const router = useRouter(); // Initialize router
    const { profile } = useAuthContext(); // Get user profile from auth context
    const { lastUpdate } = useRealtime(); // Get realtime update trigger

    const [userReports, setUserReports] = useState<any[]>([]); // State for reports of the current user
    const [loading, setLoading] = useState(true); // State for loading indicator

    // --- Fetch ALL reports of the current user --- // Effect section for loading reports
    useEffect(() => { // Run effect when profile or realtime update changes
        if (!profile?.$id) return; // Stop if user id is not available

        const fetchAllUserReports = async () => { // Async function to fetch reports
            try { // Start try block for API requests
                const response = await API.database.listDocuments( // Request all report documents
                    API.config.databaseId, // Provide database id
                    API.config.reportsCollectionId // Provide reports collection id
                ); // End listDocuments call
                
                let myReports = response.documents.filter((doc: any) => doc.user_id === profile.$id); // Keep only reports created by current user
                myReports.sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()); // Sort newest first
                
                const reportsWithCategories = await Promise.all(myReports.map(async (report: any) => { // Resolve category name for every report
                    let fetchedCategoryName = "Problem"; // Default category name in English
                    
                    if (report.category_id) { // Check if category reference exists
                        try { // Try resolving category name
                            if (typeof report.category_id === "object" && report.category_id.name) { // If category object already expanded
                                fetchedCategoryName = report.category_id.name; // Read name directly from object
                            } else { // If category is only an id
                                const categoryData = await API.database.getDocument( // Fetch category document by id
                                    API.config.databaseId, // Provide database id
                                    API.config.categoriesCollectionId, // Provide categories collection id
                                    report.category_id // Provide category document id
                                ); // End getDocument call
                                fetchedCategoryName = categoryData.name || "Problem"; // Use category name or fallback
                            } // End expanded-vs-id check
                        } catch (catError) { // Catch category fetch errors
                            console.error(`Could not fetch category for report ${report.$id}:`, catError); // Log category error
                        } // End category try/catch
                    } // End category existence check
                    return { ...report, category_name: fetchedCategoryName }; // Return report with resolved category name
                })); // End Promise.all map

                setUserReports(reportsWithCategories); // Save processed reports to state
            } catch (error) { // Catch report fetch errors
                console.error("Error fetching reports:", error); // Log fetch error
            } finally { // Run regardless of success or error
                setLoading(false); // Stop loading state
            } // End try/catch/finally
        }; // End fetch function

        fetchAllUserReports(); // Execute fetch function
    }, [profile?.$id, lastUpdate]); // Dependencies: user id and realtime updates

    const formatDate = (dateString: string) => { // Helper to format date
        return new Date(dateString).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" }); // Format as Dutch locale date
    }; // End formatDate helper

    // --- UI renderer for a single report item --- // Item renderer section
    const renderReportCard = ({ item: report }: { item: any }) => { // Render one report card
        const isInvalid = report.status === "invalid" || report.status === "rejected"; // Check rejected/invalid state
        const isResolved = report.status === "resolved"; // Check resolved state
        const isInProgress = report.status === "approved" || report.status === "in_progress"; // Check in-progress state

        let bgColor = "#E3F2FD"; // Default badge background color
        let iconColor = "#1976D2"; // Default icon color
        let iconName = "document-text"; // Default icon name
        let statusText = "Reported"; // Default status label in English

        if (isInvalid) { // If report is invalid/rejected
            bgColor = "#FFEBEE"; // Set red-tinted background
            iconColor = "#D32F2F"; // Set red icon color
            iconName = "close-circle"; // Set invalid icon
            statusText = "Rejected"; // Set status text
        } else if (isResolved) { // If report is resolved
            bgColor = "#E8F5E9"; // Set green-tinted background
            iconColor = "#388E3C"; // Set green icon color
            iconName = "checkmark-circle"; // Set resolved icon
            statusText = "Resolved"; // Set status text
        } else if (isInProgress) { // If report is in progress
            bgColor = "#FFF3E0"; // Set orange-tinted background
            iconColor = "#F57C00"; // Set orange icon color
            iconName = "build"; // Set in-progress icon
            statusText = "In progress"; // Set status text
        } // End status checks

        return ( // Return touchable report card
            <TouchableOpacity // Tap-able card container
                style={styles.reportCard} // Apply card styles
                onPress={() => router.push(`/(app)/report/${report.$id}` as any)} // Navigate to report details
            > {/* End TouchableOpacity opening */}
                <View style={[styles.statusIconWrapper, { backgroundColor: bgColor }]}> {/* Status icon background wrapper */}
                    <Ionicons name={iconName as any} size={26} color={iconColor} /> {/* Status icon */}
                </View> {/* End status icon wrapper */}

                <View style={styles.reportCardContent}> {/* Card text content wrapper */}
                    <View style={styles.reportHeaderRow}> {/* Header row with date and status */}
                        <Text style={styles.reportDate}>{formatDate(report.$createdAt)}</Text> {/* Formatted creation date */}
                        <Text style={[styles.statusBadgeText, { color: iconColor }]}>{statusText}</Text> {/* Colored status text */}
                    </View> {/* End header row */}
                    <Text style={styles.reportAddress} numberOfLines={2}> {/* Address/category text, max 2 lines */}
                        <Text style={{ fontFamily: Variables.fonts.bold }}>{report.category_name || "Problem"}: </Text> {/* Bold category label */}
                        {report.address}, {report.zip_code} {report.city} {/* Address details */}
                    </Text> {/* End address text */}
                </View> {/* End content wrapper */}

                <Ionicons name="chevron-forward" size={20} color={Variables.colors.textLight} /> {/* Right chevron icon */}
            </TouchableOpacity> // End report card
        ); // End JSX return
    }; // End renderReportCard

    return ( // Return full screen UI
        <View style={styles.container}> {/* Root screen container */}
            {/* 1) Blue header (exactly like detail page) */} {/* Header section label */}
            <View style={styles.blueHeader}> {/* Top header container */}
                    <View style={styles.backButtonWrapper}> {/* Positioned back button wrapper */}
                            <BackButton color="white" /> {/* White back button */}
                    </View> {/* End back button wrapper */}

                    <View style={styles.titleContainer}> {/* Title alignment wrapper */}
                            <ThemedText type="subtitle" color="inverse" style={styles.title}> {/* Header title text */}
                                    My Reports {/* Screen title in English */}
                            </ThemedText> {/* End title text */}
                    </View> {/* End title container */}
            </View> {/* End blue header */}

            {/* 2) The list of reports */} {/* Reports list section label */}
            {loading ? ( // Conditional render: loading state
                <ActivityIndicator size="large" color={Variables.colors.primary} style={{ marginTop: 40 }} /> // Show loading spinner
            ) : ( // Else render list
                <FlatList // Render reports in scrollable list
                    data={userReports} // Supply reports data
                    keyExtractor={(item) => item.$id} // Unique key per report
                    renderItem={renderReportCard} // Render function for each row
                    contentContainerStyle={styles.listContainer} // Apply list spacing
                    showsVerticalScrollIndicator={false} // Hide scroll bar
                    ListEmptyComponent={ // Empty-state component
                        <Text style={styles.emptyText}>You have not created any reports yet.</Text> // Empty-state message in English
                    } // End empty component
                /> // End FlatList
            )} {/* End loading/list condition */}
        </View> // End root container
    ); // End component return
} // End MyReportsScreen component

const styles = StyleSheet.create({ // Create component styles
    container: { // Root container style
        flex: 1, // Fill available vertical space
        backgroundColor: Variables.colors.background || "#F8F9FA", // Screen background color
    }, // End container style
    
    // --- Exact copied header styles --- // Header style section title
    blueHeader: { // Blue header style
            backgroundColor: Variables.colors.header || "#2C4365", // Header background color
            paddingTop: 60, // Top padding for safe area spacing
            paddingBottom: 40, // Bottom padding for visual height
            paddingHorizontal: 20, // Horizontal internal spacing
            flexDirection: "row", // Arrange children in a row
            alignItems: "center", // Vertically center children
            justifyContent: "center", // Horizontally center children
            position: "relative", // Relative positioning for absolute back button
            borderBottomLeftRadius: 16, // Rounded bottom-left corner
            borderBottomRightRadius: 16, // Rounded bottom-right corner
    }, // End blueHeader style
    backButtonWrapper: { // Back button wrapper style
            position: "absolute", // Absolute position inside header
            left: 10, // Distance from left edge
            zIndex: 10, // Keep above title
            marginTop: 55, // Push down inside header
            transform: [{ scale: 1.5 }], // Enlarge button
            padding: 5, // Touch target padding
    }, // End backButtonWrapper style
    titleContainer: { // Title container style
            flex: 1, // Use remaining horizontal space
            alignItems: "center", // Center title horizontally
            marginHorizontal: 40, // Leave room for back button area
    }, // End titleContainer style
    title: { // Title text style
            fontFamily: Variables.fonts.bold, // Bold font family
            fontSize: Variables.textSizes.lg, // Large font size
            textAlign: "center", // Center text
            color: "#FFFFFF", // White text color
    }, // End title style

    // --- List styles --- // List style section title
    listContainer: { // FlatList content container style
        padding: 20, // Outer padding
        paddingBottom: 40, // Extra bottom space
    }, // End listContainer style
    reportCard: { // Report card row style
        flexDirection: "row", // Row layout
        alignItems: "center", // Vertically center content
        backgroundColor: "#FFFFFF", // White card background
        borderRadius: 16, // Rounded card corners
        padding: 15, // Internal spacing
        marginBottom: 12, // Space between cards
        shadowColor: "#000", // iOS shadow color
        shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
        shadowOpacity: 0.05, // iOS shadow opacity
        shadowRadius: 5, // iOS shadow blur radius
        elevation: 2, // Android shadow/elevation
    }, // End reportCard style
    statusIconWrapper: { // Status icon circle wrapper style
        width: 50, // Fixed width
        height: 50, // Fixed height
        borderRadius: 25, // Make it circular
        justifyContent: "center", // Center icon vertically
        alignItems: "center", // Center icon horizontally
        marginRight: 15, // Space after icon
    }, // End statusIconWrapper style
    reportCardContent: { // Text/content wrapper style
        flex: 1, // Fill remaining row space
    }, // End reportCardContent style
    reportHeaderRow: { // Top row inside card
        flexDirection: "row", // Row layout
        justifyContent: "space-between", // Date left, status right
        alignItems: "center", // Vertical center alignment
        marginBottom: 4, // Space below header row
    }, // End reportHeaderRow style
    reportDate: { // Date text style
        fontFamily: Variables.fonts.bold, // Bold date text
        fontSize: 15, // Date font size
        color: Variables.colors.text, // Main text color
    }, // End reportDate style
    statusBadgeText: { // Status text style
        fontFamily: Variables.fonts.bold, // Bold status text
        fontSize: 13, // Status font size
    }, // End statusBadgeText style
    reportAddress: { // Address text style
        fontFamily: Variables.fonts.regular, // Regular font
        fontSize: 13, // Address font size
        color: Variables.colors.textLight, // Muted text color
        lineHeight: 18, // Improved readability
    }, // End reportAddress style
    emptyText: { // Empty-state text style
        fontFamily: Variables.fonts.regular, // Regular font
        color: Variables.colors.textLight, // Muted color
        textAlign: "center", // Center align text
        marginTop: 40, // Top spacing
        fontSize: 16, // Empty text size
    }, // End emptyText style
}); // End StyleSheet