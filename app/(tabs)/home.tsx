import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import "react-native-get-random-values";
import { GOOGLE_MAPS_API_KEY } from "@env";


export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
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

  return (
    <View style={styles.container}>
      {/* Google Places Autocomplete for Destination */}
      <GooglePlacesAutocomplete
        placeholder="Enter destination"
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (details) {
            setDestination({
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: "en",
        }}
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
      />

      {/* Map */}
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="My Location"
          />

          {/* Destination Marker */}
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title="Destination"
            />
          )}
        </MapView>
      )}

      <Button title="Refresh Location" onPress={() => requestLocation(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, marginTop: 100 },
});
