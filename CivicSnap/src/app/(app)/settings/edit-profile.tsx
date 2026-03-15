import React, { useState, useEffect } from "react"; // Import React and hooks
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from "react-native"; // Import React Native UI components
import { SafeAreaView } from "react-native-safe-area-context"; // Import SafeAreaView for safe layout
import { useRouter } from "expo-router"; // Import Expo router hook
import { Ionicons } from "@expo/vector-icons"; // Import icon set
import * as ImagePicker from "expo-image-picker"; // Import image picker module
import { ID } from "react-native-appwrite"; // Import Appwrite ID helper

// ---- Context & API ---- // Section label for context and API imports
import { useAuthContext } from "@components/functional/Auth/authProvider"; // Import auth context hook
import { API } from "@core/networking/api"; // Import API client

import { useRealtime } from "@core/modules/realtimeProvider/RealtimeProvider"; // Import realtime update hook
// ---- Styling ---- // Section label for styling import
import { Variables } from "@style/theme"; // Import design system variables

export default function EditProfileScreen() { // Define screen component
    const router = useRouter(); // Initialize router
    const { profile } = useAuthContext(); // Read current user profile from auth context
    const { triggerUpdate } = useRealtime(); // Get realtime trigger function
    
    // State initialized with current profile data // Explain initial state purpose
    const [fullName, setFullName] = useState(profile?.full_name || ""); // Store editable full name
    const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatar_url); // Store avatar URI
    
    const [isSaving, setIsSaving] = useState(false); // Track save loading state
    const [newImageSelected, setNewImageSelected] = useState(false); // Track whether user selected a new image

    // Add this effect to fill fields with the most recent database data // Effect description
    useEffect(() => { // Run when profile id changes
        if (!profile?.$id) return; // Exit if profile id is unavailable

        const fetchCurrentData = async () => { // Define async function to fetch profile
            try { // Start try block
                const data = await API.database.getDocument( // Request profile document from database
                    API.config.databaseId, // Pass database id
                    API.config.profilesCollectionId, // Pass profiles collection id
                    profile.$id // Pass current profile document id
                ); // End getDocument call
                // Fill state with data that is actually in the database // Clarify data source
                setFullName(data.full_name || ""); // Set full name from database
                setAvatarUri(data.avatar_url); // Set avatar URL from database
            } catch (error) { // Handle fetch errors
                console.error("Error while fetching current data:", error); // Log fetch error
            } // End try/catch
        }; // End fetchCurrentData function

        fetchCurrentData(); // Execute data fetch
    }, [profile?.$id]); // Dependency: rerun when profile id changes

    // --- 1. Pick Photo (Same style as Register) --- // Section heading for image picking
    const pickImage = async () => { // Define image picker handler
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Request media library permission

        if (permission.granted) { // Continue only if permission granted
            const result = await ImagePicker.launchImageLibraryAsync({ // Open image library
                mediaTypes: ["images"], // Restrict picker to images
                allowsEditing: true, // Allow cropping/editing
                aspect: [1, 1], // Enforce square aspect ratio
                quality: 0.5, // Compress image quality
            }); // End picker options

            if (!result.canceled) { // Continue if user selected an image
                setAvatarUri(result.assets[0].uri); // Save selected image URI
                setNewImageSelected(true); // Mark that a new image was selected
            } // End result check
        } // End permission check
    }; // End pickImage handler

    const handleSave = async () => { // Define save handler
        if (!profile?.$id) return; // Exit if profile id is missing
        setIsSaving(true); // Enable saving/loading state

        try { // Start save try block
            let finalAvatarUrl = profile?.avatar_url; // Default avatar URL to current one

            if (newImageSelected && avatarUri) { // Upload only when a new image exists
                const bucketId = API.config.storageBucketId; // Read storage bucket id

                // Use exactly the same logic as in the register function // Keep upload behavior consistent
                const type = avatarUri.endsWith(".png") ? "image/png" : "image/jpeg"; // Infer MIME type from extension
                const file = { // Build file object for Appwrite upload
                    uri: avatarUri, // Local URI of selected image
                    name: `avatar_${profile.$id}.jpg`, // Generated file name
                    type: type, // MIME type
                    size: 0, // Required field for this upload setup
                } as any; // Cast to any for compatibility

                console.log("🚀 Uploading file to bucket:", bucketId); // Log upload start

                const uploadResponse = await API.storage.createFile( // Upload file to Appwrite storage
                    bucketId, // Target bucket id
                    ID.unique(), // Generate unique file id
                    file // File payload
                ); // End upload call

                if (uploadResponse && uploadResponse.$id) { // Continue if upload succeeded
                    // Use manual URL construction as in auth.ts // Keep URL generation consistent
                    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT; // Read Appwrite endpoint from env
                    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID; // Read Appwrite project id from env
                    const fileId = uploadResponse.$id; // Extract uploaded file id

                    finalAvatarUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`; // Build public file URL
                    console.log("✅ New Avatar URL:", finalAvatarUrl); // Log generated avatar URL
                } // End upload success check
            } // End upload branch

            // Update database profile document // Section heading for database update
            await API.database.updateDocument( // Update profile document in database
                API.config.databaseId, // Pass database id
                API.config.profilesCollectionId, // Pass collection id
                profile.$id, // Pass document id
                { // Begin payload object
                    full_name: fullName, // Save updated full name
                    avatar_url: finalAvatarUrl, // Save updated avatar URL
                } // End payload object
            ); // End update call

            triggerUpdate(); // Notify realtime listeners
            
            Alert.alert("Success", "Your profile has been updated!", [ // Show success alert
                { text: "OK", onPress: () => router.back() } // Navigate back after confirmation
            ]); // End alert
        } catch (error: any) { // Catch save errors
            console.error("❌ Save failed:", error); // Log save error
            Alert.alert("Error", error.message || "Could not update profile"); // Show error alert
        } finally { // Always execute cleanup
            setIsSaving(false); // Disable saving/loading state
        } // End try/catch/finally
    }; // End handleSave handler

    return ( // Render component UI
        <SafeAreaView style={styles.container} edges={["top"]}> {/* Root safe-area container */}
            <View style={styles.header}> {/* Header row */}
                <TouchableOpacity onPress={() => router.back()}> {/* Close button wrapper */}
                    <Ionicons name="close" size={28} color={Variables.colors.text} /> {/* Close icon */}
                </TouchableOpacity> {/* End close button wrapper */}
                <Text style={styles.headerTitle}>Edit profile</Text> {/* Header title */}
                <TouchableOpacity onPress={handleSave} disabled={isSaving}> {/* Save action button */}
                    {isSaving ? ( // Conditional rendering while saving
                        <ActivityIndicator size="small" color={Variables.colors.primary} /> // Loading spinner
                    ) : (
                        <Text style={styles.saveText}>Done</Text> // Save label
                    )} {/* End save conditional */}
                </TouchableOpacity> {/* End save button */}
            </View> {/* End header */}

            <View style={styles.content}> {/* Main content container */}
                <TouchableOpacity style={styles.avatarSection} onPress={pickImage}> {/* Avatar picker trigger */}
                    <View style={styles.avatarWrapper}> {/* Circular avatar wrapper */}
                        {avatarUri ? ( // Show selected/current avatar if available
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} /> // Render avatar from URI
                        ) : (
                            <Image source={require("@assets/icons/User.png")} style={styles.avatarImage} /> // Render fallback avatar icon
                        )} {/* End avatar conditional */}
                        <View style={styles.cameraBadge}> {/* Camera badge overlay */}
                            <Ionicons name="camera" size={18} color="#FFF" /> {/* Camera icon */}
                        </View> {/* End camera badge */}
                    </View> {/* End avatar wrapper */}
                    <Text style={styles.changePhotoText}>Change photo</Text> {/* Change photo label */}
                </TouchableOpacity> {/* End avatar picker */}

                <View style={styles.inputContainer}> {/* Input field container */}
                    <Text style={styles.label}>Full name</Text> {/* Input label */}
                    <TextInput // Name input component
                        style={styles.input} // Apply input styles
                        value={fullName} // Bind name value
                        onChangeText={setFullName} // Update state on text change
                        placeholder="Name" // Input placeholder
                    /> {/* End TextInput */}
                </View> {/* End input container */}
            </View> {/* End content container */}
        </SafeAreaView> // End safe-area container
    ); // End return
} // End component

const styles = StyleSheet.create({ // Define stylesheet
    container: { // Root container styles
        flex: 1, // Fill available height
        backgroundColor: Variables.colors.background, // Screen background color
    }, // End container styles
    header: { // Header styles
        flexDirection: "row", // Place children in a row
        justifyContent: "space-between", // Space items across row
        alignItems: "center", // Vertically center items
        paddingHorizontal: Variables.sizes.md, // Horizontal header padding
        paddingVertical: Variables.sizes.md, // Vertical header padding
        backgroundColor: Variables.colors.surface, // Header background color
        borderBottomWidth: 1, // Bottom border width
        borderBottomColor: "#E5E5E5", // Subtle divider color
    }, // End header styles
    headerTitle: { // Header title styles
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: Variables.textSizes.md, // Medium text size
        color: Variables.colors.text, // Text color
    }, // End headerTitle styles
    saveText: { // Save text styles
        fontFamily: Variables.fonts.bold, // Bold font
        fontSize: Variables.textSizes.base, // Base text size
        color: Variables.colors.primary, // Primary color text
    }, // End saveText styles
    content: { // Content container styles
        padding: Variables.sizes.lg, // Content padding
        alignItems: "center", // Center content horizontally
    }, // End content styles
    avatarSection: { // Avatar section styles
        alignItems: "center", // Center avatar section items
        marginVertical: Variables.sizes.xl, // Vertical margin
    }, // End avatarSection styles
    avatarWrapper: { // Avatar wrapper styles
        width: 120, // Avatar width
        height: 120, // Avatar height
        borderRadius: 60, // Make wrapper circular
        backgroundColor: Variables.colors.surface, // Avatar background
        position: "relative", // Allow absolute child positioning
        // Shadow for visual depth // Shadow comment
        elevation: 4, // Android shadow depth
        shadowColor: Variables.colors.text, // iOS shadow color
        shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
        shadowOpacity: 0.1, // iOS shadow opacity
        shadowRadius: 4, // iOS shadow blur radius
    }, // End avatarWrapper styles
    avatarImage: { // Avatar image styles
        width: 120, // Avatar image width
        height: 120, // Avatar image height
        borderRadius: 60, // Keep avatar image circular
    }, // End avatarImage styles
    cameraBadge: { // Camera badge styles
        position: "absolute", // Position badge over avatar
        bottom: 0, // Align to bottom
        right: 0, // Align to right
        backgroundColor: Variables.colors.primary, // Badge background color
        width: 36, // Badge width
        height: 36, // Badge height
        borderRadius: 18, // Circular badge shape
        justifyContent: "center", // Center icon vertically
        alignItems: "center", // Center icon horizontally
        borderWidth: 3, // Badge border width
        borderColor: Variables.colors.surface, // Badge border color
    }, // End cameraBadge styles
    changePhotoText: { // Change photo label styles
        marginTop: Variables.sizes.sm, // Top spacing
        color: Variables.colors.primary, // Primary text color
        fontFamily: Variables.fonts.semibold, // Semi-bold font
        fontSize: Variables.textSizes.sm, // Small text size
    }, // End changePhotoText styles
    inputContainer: { // Input container styles
        width: "100%", // Full width input container
        marginBottom: Variables.sizes.lg, // Bottom spacing
    }, // End inputContainer styles
    label: { // Input label styles
        fontFamily: Variables.fonts.semibold, // Semi-bold label font
        fontSize: Variables.textSizes.sm, // Small label size
        color: Variables.colors.textLight, // Light text color
        marginBottom: Variables.sizes.xs, // Spacing below label
        marginLeft: 4, // Slight left offset
    }, // End label styles
    input: { // Text input styles
        width: "100%", // Full width input
        height: 56, // Input height
        backgroundColor: Variables.colors.surface, // Input background
        borderRadius: 12, // Rounded corners
        paddingHorizontal: Variables.sizes.md, // Horizontal text padding
        borderWidth: 1, // Border width
        borderColor: "#E5E5E5", // Border color
        fontFamily: Variables.fonts.regular, // Regular font
        fontSize: Variables.textSizes.base, // Base text size
        color: Variables.colors.text, // Input text color
    }, // End input styles
}); // End stylesheet