import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import Button from "@components/design/Button/PrimaryButton";
import BackButton from "@components/design/Button/BackButton";
import ThemedText from "@components/design/Typography/ThemedText";
import { useAuthContext } from "@components/functional/Auth/authProvider";
import { Variables } from "@style/theme";

export default function LoginScreen() {
  const router = useRouter();
  
  
  const { login, isLoggedIn } = useAuthContext();
  
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Foutje", "Vul aub alle velden in.");
      return;
    }

    setLoading(true);
    try {
      
      await login({ email, password });
      
      Alert.alert("Succes", "Je bent ingelogd!");
      router.push("/(app)/(tabs)/home");
      
    } catch (error: any) {
      Alert.alert("Login Mislukt", error.message || "Controleer je gegevens.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>

          <View style={styles.backButtonWrapper}>
              <BackButton />
          </View>

          <View style={styles.header}>
              <ThemedText type="title" style={styles.headerTitle}>
                  Welkom terug!
              </ThemedText>
              <ThemedText style={styles.subTitle}>
                  Log in om verder te gaan.
              </ThemedText>
          </View>
        </View>

       
        <View style={styles.form}>

            
            <View style={styles.inputContainer}>
                <Image 
                    source={require('@assets/icons/Mail.png')} 
                    style={styles.inputIcon} 
                />
                <TextInput
                    style={styles.inputText}
                    placeholder="E-mailadres"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#666"
                />
            </View>

      
            <View style={styles.inputContainer}>
                <Image 
                    source={require('@assets/icons/Lock.png')} 
                    style={styles.inputIcon} 
                />
                <TextInput
                    style={styles.inputText}
                    placeholder="Wachtwoord"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    placeholderTextColor="#666"
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons 
                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#999" 
                    />
                </TouchableOpacity>
            </View>

        
            <Button 
                style={{ marginTop: 20 }}
                onPress={handleLogin}
                disabled={loading}
                variant="primary"
            >
                {loading ? "LADEN..." : "INLOGGEN"}
            </Button>

          
            <View style={styles.linksContainer}>
                <TouchableOpacity onPress={() => Alert.alert("Info", "Deze functie komt binnenkort!")}>
                    <Text style={styles.linkText}>Wachtwoord vergeten?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.linkText}>Registreer</Text>
                </TouchableOpacity>
            </View>

        </View>

       
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Door verder te gaan, accepteer je onze{"\n"}
                <Text style={styles.legalLink}>Gebruiksvoorwaarden</Text> en <Text style={styles.legalLink}>Privacybeleid</Text>
            </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: 'space-between', 
  },
  backButtonWrapper: {
    position: 'absolute', 
    left: 0,              
    zIndex: 10,           
    marginTop: 28,
    
    transform: [{ scale: 1.5 }], 
    padding: 5, 
  },
   headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    position: 'relative',
    height: 50,
    width: '100%',
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
  },
  

  form: {
    width: '100%',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#000',
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },

  
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  linkText: {
    color: Variables.colors.primary , 
    fontWeight: '600',
    textDecorationLine: 'underline',
  },


  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    textAlign: 'center',
    color: '#333',
    fontSize: 13,
    lineHeight: 20,
  },
  legalLink: {
    color: Variables.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});