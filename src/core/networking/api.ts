import { Client, Account, Databases, Storage, Avatars } from 'react-native-appwrite';


const CONFIG = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
    bundleId: process.env.EXPO_PUBLIC_APP_BUNDLE_ID || '',
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'CivicSnapDB',
    storageBucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || 'avatars',
    profilesCollectionId: 'profiles',
};


const client = new Client();

client
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setPlatform(CONFIG.bundleId);


export const API = {
    client: client,                 
    auth: new Account(client),      
    database: new Databases(client),
    storage: new Storage(client),   
    avatars: new Avatars(client),   
    
    
    config: {
        databaseId: CONFIG.databaseId, 
        storageBucketId: CONFIG.storageBucketId,
        profilesCollectionId: CONFIG.profilesCollectionId
    }
};