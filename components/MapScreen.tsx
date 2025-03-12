// import React, { useEffect, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import { Coordinates } from "@/types/location";
// import Constants from "expo-constants";
// const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

// const MapScreen = ({
//   location,
//   destination,
// }: {
//   location: Coordinates;
//   destination: Coordinates;
// }) => {
//   const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);

//   useEffect(() => {
//     if (location.latitude !== 0 && destination.latitude !== 0) {
//       getRoute();
//     }
//   }, [location, destination]);

//   const getRoute = async () => {
//     const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;

//     try {
//       const response = await fetch(url);
//       const data = await response.json();

//       if (data.routes.length) {
//         const points = data.routes[0].overview_polyline.points;
//         const decodedPoints = decodePolyline(points);
//         setRouteCoordinates(decodedPoints);
//       }
//     } catch (error) {
//       console.error("Error fetching route:", error);
//     }
//   };

//   const decodePolyline = (encoded: string) => {
//     let points = [];
//     let index = 0,
//       lat = 0,
//       lng = 0;

//     while (index < encoded.length) {
//       let shift = 0,
//         result = 0;
//       let byte;
//       do {
//         byte = encoded.charCodeAt(index++) - 63;
//         result |= (byte & 0x1f) << shift;
//         shift += 5;
//       } while (byte >= 0x20);
//       let deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
//       lat += deltaLat;

//       shift = 0;
//       result = 0;
//       do {
//         byte = encoded.charCodeAt(index++) - 63;
//         result |= (byte & 0x1f) << shift;
//         shift += 5;
//       } while (byte >= 0x20);
//       let deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
//       lng += deltaLng;

//       points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
//     }

//     return points;
//   };

//   return (
//     <MapView
//       style={styles.map}
//       initialRegion={{
//         latitude: location.latitude,
//         longitude: location.longitude,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       }}
//     >
//       {/* Current Location Marker */}
//       <Marker coordinate={location} title="My Location" />

//       {/* Destination Marker */}
//       {destination.latitude !== 0 && (
//         <Marker coordinate={destination} title="Destination" />
//       )}

//       {/* Route Polyline */}
//       {routeCoordinates.length > 0 && (
//         <Polyline
//           coordinates={routeCoordinates}
//           strokeWidth={4}
//           strokeColor="blue"
//         />
//       )}
//     </MapView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
// });

// export default MapScreen;





import React, { useEffect, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { View, StyleSheet } from "react-native";
import Constants from "expo-constants";
import { Coordinates } from "@/types/location";
import polyline from "@mapbox/polyline";

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

interface MapScreenProps {
  location: Coordinates;
  destination: Coordinates;
}

const MapScreen: React.FC<MapScreenProps> = ({ location, destination }) => {
  const [route, setRoute] = useState<any[]>([]);
   const [trafficData, setTrafficData] = useState([]);

  useEffect(() => {
    if (destination.latitude !== 0 && destination.longitude !== 0) {
      fetchRouteWithTraffic();
    }
  }, [destination]);

  const fetchRouteWithTraffic = async () => {
    console.log("before url");
    

    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE_OPTIMAL",
      computeAlternativeRoutes: false,
      routeModifiers: { avoidTolls: false, avoidHighways: false },
      languageCode: "en-US",
      units: "IMPERIAL",
    };

    try {
      console.log("making response");
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(response);
      

      const data = await response.json();
      console.log(data);
      
      if (data.routes) {
        console.log("Route Data:", data.routes);
        const decodedPolyline = polyline.decode(
          data.routes[0].polyline.encodedPolyline
        );
        console.log("Route Data:", decodedPolyline);
       const formattedRoute = decodedPolyline.map(([latitude, longitude]) => ({
         latitude,
         longitude,
       }));

       setRoute(formattedRoute);
      const trafficConditions = formattedRoute.map(() => {
        const speeds = ["SLOW", "MODERATE", "FAST"];
        return speeds[Math.floor(Math.random() * speeds.length)];
      });

      setTrafficData(trafficConditions);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const getTrafficColor = (speed: string) => {
    console.log("getTrafficColor called");
    
    if (speed === "SLOW") return "red";
    if (speed === "MODERATE") return "orange";
    return "green";
  };


  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={location} title="Your Location" />
        <Marker coordinate={destination} title="Destination" />

        {/* Render Route */}
        {route.length > 1 &&
          route.map((point, index) => {
            console.log("Called");
            if (index === 0) return null; // Skip first point
            
            return (
              <Polyline
                key={index}
                coordinates={[route[index - 1], point]}
                strokeColor={getTrafficColor(trafficData[index])}
                strokeWidth={5}
              />
            );
          })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

export default MapScreen;
