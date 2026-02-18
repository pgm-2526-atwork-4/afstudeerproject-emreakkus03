import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import * as Location from "expo-location";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Variables } from "@/style/theme";

export default function LocationMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mapRef = React.useRef<MapView>(null);

  const insets = useSafeAreaInsets();

  const DEFAULT_REGION = {
    latitude: 51.0956,
    longitude: 4.1642,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Toestemming voor locatie toegang geweigerd");
          setLoading(false);
          return;
        }

        let lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setLocation(lastKnown);
        }

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(resolve, 10000),
        );

        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const currentLocation = await Promise.race([
          locationPromise,
          timeoutPromise,
        ]) as Location.LocationObject;

        setLocation(currentLocation);

        mapRef.current?.animateToRegion(
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      } catch (error: any) {
        if (error.message === "TIMEOUT") {
          setErrorMsg(
            "Locatie zoeken duurt te lang. Probeer het buiten of check je verbinding.",
          );
        } else {
          setErrorMsg("Er ging iets mis bij het bepalen van je locatie.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);


  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={DEFAULT_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        toolbarEnabled={false}
       mapPadding={{ 
          top: 20, 
          right: 0, 
          bottom: 0,
          left: 0 
        }}
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
              source={require("@assets/icons/Indicator.png")}
              style={styles.markerImage}
            />
          </Marker>
        )}
      </MapView>
      <TouchableOpacity 
        style={[styles.plus, { bottom: insets.bottom +  0 }]} 
        onPress={() => console.log("Melding maken start...")}
        activeOpacity={0.8}
      >
        <Image 
          source={require("@assets/icons/Plus-Circle.png")} 
          style={styles.plusImage} 
        />
      </TouchableOpacity>
      {loading && !location && (
        <View style={styles.overlayCenter}>
          <ActivityIndicator size="large" color={Variables.colors.primary} />
          <Text style={styles.loadingText}>Locatie laden...</Text>
        </View>
      )}
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
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 16,  
    borderTopRightRadius: 16,
  },
  map: {
    flex: 1,
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 16,
    marginTop: 20,
  },
  errorText: {
    color: "red",
  },
  copyright: {
    position: "absolute",
    bottom: 5,
    right: 5,
    fontSize: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 2,
    borderRadius: 4,
  },

  plus: {
    position: "absolute",
    right: 10,
    backgroundColor: "transparent", 
    shadowColor: Variables.colors.text || "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  plusImage: {
    width: 60, 
    height: 60,
    resizeMode: "contain",
  },
  overlayCenter: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  gdprWarning: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(255,0,0,0.7)",
    padding: 5,
    borderRadius: 5,
  },
  gdprText: { color: "white", fontSize: 12 },
});
