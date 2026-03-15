import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ID } from "react-native-appwrite";

// ---- Context & API ----
import { useAuthContext } from "@components/functional/Auth/authProvider";
import { API } from "@core/networking/api";

import { useRealtime } from "@core/modules/realtimeProvider/RealtimeProvider";
// ---- Styling ----
import { Variables } from "@style/theme";

export default function EditProfileScreen() {
    const router = useRouter();
    const { profile } = useAuthContext();
    const { triggerUpdate } = useRealtime();
    
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatar_url);
    
    const [isSaving, setIsSaving] = useState(false);
    const [newImageSelected, setNewImageSelected] = useState(false);

    useEffect(() => {
        if (!profile?.$id) return;

        const fetchCurrentData = async () => {
            try {
                const data = await API.database.getDocument(
                    API.config.databaseId,
                    API.config.profilesCollectionId,
                    profile.$id
                );
                setFullName(data.full_name || "");
                setAvatarUri(data.avatar_url);
            } catch (error) {
                console.error("Error while fetching current data:", error);
            }
        };

        fetchCurrentData();
    }, [profile?.$id]);

    // --- 1. Pick Photo (Same style as Register) ---
    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.granted) {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setAvatarUri(result.assets[0].uri);
                setNewImageSelected(true);
            }
        }
    };

    const handleSave = async () => {
        if (!profile?.$id) return;
        setIsSaving(true);

        try {
            let finalAvatarUrl = profile?.avatar_url;

            if (newImageSelected && avatarUri) {
                const bucketId = API.config.storageBucketId;

                // Use exactly the same logic as in the register function
                const type = avatarUri.endsWith(".png") ? "image/png" : "image/jpeg";
                const file = {
                    uri: avatarUri,
                    name: `avatar_${profile.$id}.jpg`,
                    type: type,
                    size: 0,
                } as any;

                console.log("🚀 Uploading file to bucket:", bucketId);

                const uploadResponse = await API.storage.createFile(
                    bucketId,
                    ID.unique(),
                    file
                );

                if (uploadResponse && uploadResponse.$id) {
                    // Use manual URL construction as in auth.ts
                    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
                    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
                    const fileId = uploadResponse.$id;

                    finalAvatarUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
                    console.log("✅ New Avatar URL:", finalAvatarUrl);
                }
            }

            // Update database profile document
            await API.database.updateDocument(
                API.config.databaseId,
                API.config.profilesCollectionId,
                profile.$id,
                {
                    full_name: fullName,
                    avatar_url: finalAvatarUrl,
                }
            );

            triggerUpdate();
            
            Alert.alert("Success", "Your profile has been updated!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("❌ Save failed:", error);
            Alert.alert("Error", error.message || "Could not update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color={Variables.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profiel bewerken</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={Variables.colors.primary} />
                    ) : (
                        <Text style={styles.saveText}>Klaar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
                    <View style={styles.avatarWrapper}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Image source={require("@assets/icons/User.png")} style={styles.avatarImage} />
                        )}
                        <View style={styles.cameraBadge}>
                            <Ionicons name="camera" size={18} color="#FFF" />
                        </View>
                    </View>
                    <Text style={styles.changePhotoText}>Wijzig foto</Text>
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Volledige naam</Text>
                    <TextInput 
                        style={styles.input}
                        value={fullName} 
                        onChangeText={setFullName}
                        placeholder="Volledige naam" 
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Variables.colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Variables.sizes.md,
        paddingVertical: Variables.sizes.md,
        backgroundColor: Variables.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    headerTitle: {
        fontFamily: Variables.fonts.bold,
        fontSize: Variables.textSizes.md,
        color: Variables.colors.text,
    },
    saveText: {
        fontFamily: Variables.fonts.bold,
        fontSize: Variables.textSizes.base,
        color: Variables.colors.primary,
    },
    content: {
        padding: Variables.sizes.lg,
        alignItems: "center",
    },
    avatarSection: {
        alignItems: "center",
        marginVertical: Variables.sizes.xl,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Variables.colors.surface,
        position: "relative",
        elevation: 4,
        shadowColor: Variables.colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    cameraBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: Variables.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: Variables.colors.surface,
    },
    changePhotoText: {
        marginTop: Variables.sizes.sm,
        color: Variables.colors.primary,
        fontFamily: Variables.fonts.semibold,
        fontSize: Variables.textSizes.sm,
    },
    inputContainer: {
        width: "100%",
        marginBottom: Variables.sizes.lg,
    },
    label: {
        fontFamily: Variables.fonts.semibold,
        fontSize: Variables.textSizes.sm,
        color: Variables.colors.textLight,
        marginBottom: Variables.sizes.xs,
        marginLeft: 4,
    },
    input: {
        width: "100%",
        height: 56,
        backgroundColor: Variables.colors.surface,
        borderRadius: 12,
        paddingHorizontal: Variables.sizes.md,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        fontFamily: Variables.fonts.regular,
        fontSize: Variables.textSizes.base,
        color: Variables.colors.text,
    },
});
