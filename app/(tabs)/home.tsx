import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import "react-native-get-random-values";
// import { GOOGLE_MAPS_API_KEY } from "@env";
import Constants from "expo-constants";
import { Coordinates } from "@/types/location";
import MapScreen from "@/components/MapScreen";

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

export default function HomeScreen() {
  const [location, setLocation] = useState<Coordinates>({
    latitude: 0,
    longitude: 0,
  });
  const [destination, setDestination] = useState<Coordinates>({
    latitude: 0,
    longitude: 0,
  });
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true; // ✅ Track mounted state
    requestLocation(isMounted);

    return () => {
      isMounted = false; // ✅ Cleanup function to prevent state update
    };
  }, []);

  const requestLocation = async (isMounted) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (isMounted) {
          setErrorMsg("Permission to access location was denied");
          Alert.alert(
            "Location Permission",
            "Please enable location to continue."
          );
        }
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      if (isMounted) {
        setLocation(currentLocation.coords);
      }
    } catch (error) {
      console.error(error);
    }
  };

  console.log(destination);
  

  return (
    
    <View style={styles.container}>
      {/* Google Places Autocomplete for Destination */}
      <GooglePlacesAutocomplete
        placeholder="Enter destination"
        fetchDetails={true}
        minLength={2}
        onPress={(data, details = null) => {
          if (details) {
            setDestination({
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }
        }}
        query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
        styles={{
          container: {
            position: "absolute",
            top: 50,
            width: "90%",
            alignSelf: "center",
            zIndex: 1,
          },
          textInput: { height: 50, borderRadius: 5, fontSize: 16 },
        }}
        debounce={300}
      />

      {/* Single MapScreen Component with Route */}
      <MapScreen location={location} destination={destination} />

      <Button title="Refresh Location" onPress={()=>requestLocation(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, marginTop: 100 },
});
