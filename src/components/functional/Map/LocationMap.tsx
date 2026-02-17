import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Image, ActivityIndicator, Platform} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT} from 'react-native-maps';
import * as Location from 'expo-location';

import { Variables } from '@/style/theme';

export default function LocationMap() {
    const [location, setLocation] = useState <Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const DEFAULT_REGION = {
    latitude: 51.0956, 
    longitude: 4.1642,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Toestemming voor locatie toegang geweigerd');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Variables.colors.primary} />
                <Text style={styles.loadingText}>Locatie laden...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    const mapRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : DEFAULT_REGION;

    return (
        <View style={styles.container}>
            <MapView
        style={styles.map}
        
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT} 
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        
        toolbarEnabled={false} 
      >
                {location && (
                    <Marker
                        coordinate={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }}
                        title="Uw huidige locatie"
                    >
                        <Image 
                source={require('@assets/icons/indicator.png')} 
                style={styles.markerImage} 
            />
                    </Marker>
                )}
            </MapView>
           {errorMsg && (
        <View style={styles.gdprWarning}>
            <Text style={styles.gdprText}>Locatie gedeeld: Nee</Text>
        </View>
      )}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    height: 800, 
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden', 
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 16,
    marginTop: 20,
  },
  errorText: {
    color: 'red',
  },
  copyright: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 2,
    borderRadius: 4,
  },

  gdprWarning: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,0,0,0.7)',
    padding: 5,
    borderRadius: 5
  },
  gdprText: { color: 'white', fontSize: 12 }
});