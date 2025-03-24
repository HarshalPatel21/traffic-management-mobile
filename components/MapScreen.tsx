import React, { useEffect, useState } from "react";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
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
   const [trafficSignals, setTrafficSignals] = useState<
     { latitude: number; longitude: number }[]
   >([]);


  useEffect(() => {
    if (destination.latitude !== 0 && destination.longitude !== 0) {
      fetchRouteWithTraffic();
      // fetchTrafficSignals();
    }
  }, [destination]);

  const fetchRouteWithTraffic = async () => {

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
    

      if (data.routes.length > 0) {
        const route = data.routes[0];

        // Decode polyline
        const decodedPolyline = polyline.decode(route.overview_polyline.points);
        const formattedRoute = decodedPolyline.map(([latitude, longitude]) => ({
          latitude,
          longitude,
        }));

        setRoute(formattedRoute);

        const trafficConditions = route.legs.flatMap((leg) => {
          const totalDurationInTraffic = leg.duration_in_traffic
            ? leg.duration_in_traffic.value
            : leg.duration.value; 
        
          const totalDuration = leg.duration.value;
          
          return leg.steps.map((step) => {
            const distanceKm = step.distance.value / 1000; 
            
         
            const stepDurationInTraffic =
              (step.duration.value / totalDuration) * totalDurationInTraffic;
        
            const durationInHours = stepDurationInTraffic / 3600; 
            const speed = distanceKm / durationInHours;
        
            if (speed < 20) return "SLOW";
            if (speed < 40) return "MODERATE";
            return "FAST";
          });
        });

        setTrafficData(trafficConditions);

          let allTrafficSignals = [];

          // Iterate over each step in the route
          console.log("Starting");
          
          for (const leg of route.legs) {
            for (const step of leg.steps) {
              console.log("step", step);

              // Decode step polyline
              const stepPolyline = polyline.decode(step.polyline.points);

              // Extract the first and last points of the polyline
              const firstPoint = stepPolyline[0];
              const lastPoint = stepPolyline[stepPolyline.length - 1];

              // Array to hold the first and last points
              const pointsToCheck = [firstPoint, lastPoint];

              for (const [latitude, longitude] of pointsToCheck) {
                // Query Overpass API for traffic signals near this coordinate
                const overpassQuery = `
                  [out:json];
                  (
                    node[highway=traffic_signals](around:30,${latitude},${longitude});
                  );
                  out;
                `;
                console.log("overpassQuery", overpassQuery);

                const overpassURL = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
                  overpassQuery
                )}`;

                try {
                  const overpassResponse = await fetch(overpassURL, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                  });

                  if (!overpassResponse.ok) {
                    throw new Error(
                      `HTTP error! status: ${overpassResponse.status}`
                    );
                  }

                  const overpassData = await overpassResponse.json();

                  // Extract traffic signals
                  const trafficSignals =
                    overpassData.elements?.map((node) => ({
                      latitude: node.lat,
                      longitude: node.lon,
                    })) || [];

                    console.log("trafficSignals", trafficSignals);
                    

                  allTrafficSignals = [...allTrafficSignals, ...trafficSignals];
                } catch (error) {
                  console.error("Error fetching traffic signals:", error);
                }

                // Add a delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 1));
              }
            }
          }

        //   const calculateDistance = (lat1, lon1, lat2, lon2) => {
        //     const R = 6371; // Radius of the Earth in km
        //     const dLat = (lat2 - lat1) * (Math.PI / 180);
        //     const dLon = (lon2 - lon1) * (Math.PI / 180);
        //     const a =
        //       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        //       Math.cos(lat1 * (Math.PI / 180)) *
        //         Math.cos(lat2 * (Math.PI / 180)) *
        //         Math.sin(dLon / 2) *
        //         Math.sin(dLon / 2);
        //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        //     return R * c; // Distance in km
        //   };

        //   for (let i = 0; i < formattedRoute.length; i += 10) {
        //     // Query every 10th point to reduce API calls
        //     const { latitude, longitude } = formattedRoute[i];

        //     // Query Overpass API for traffic signals near this coordinate
        //     const overpassQuery = `
        //   [out:json];
        //   (
        //     node[highway=traffic_signals](around:100,${latitude},${longitude});
        //   );
        //   out;
        // `;
        //     console.log("overpassQuery", overpassQuery);

        //     const overpassURL = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        //       overpassQuery
        //     )}`;

        //     try {
        //       const overpassResponse = await fetch(overpassURL, {
        //         method: "GET",
        //         headers: {
        //           "Content-Type": "application/x-www-form-urlencoded",
        //         },
        //       });

        //       if (!overpassResponse.ok) {
        //         throw new Error(
        //           `HTTP error! status: ${overpassResponse.status}`
        //         );
        //       }

        //       const overpassData = await overpassResponse.json();

        //       // Extract traffic signals
        //       const trafficSignals =
        //         overpassData.elements?.map((node) => ({
        //           latitude: node.lat,
        //           longitude: node.lon,
        //         })) || [];

        //       // Filter traffic signals to ensure they are on the route
        //       const filteredSignals = trafficSignals.filter((signal) => {
        //         // Find the nearest point on the route
        //         const nearestPoint = formattedRoute.reduce((prev, curr) => {
        //           const prevDistance = calculateDistance(
        //             signal.latitude,
        //             signal.longitude,
        //             prev.latitude,
        //             prev.longitude
        //           );
        //           const currDistance = calculateDistance(
        //             signal.latitude,
        //             signal.longitude,
        //             curr.latitude,
        //             curr.longitude
        //           );
        //           return currDistance < prevDistance ? curr : prev;
        //         });

        //         // Check if the signal is within 100 meters of the route
        //         const distance = calculateDistance(
        //           signal.latitude,
        //           signal.longitude,
        //           nearestPoint.latitude,
        //           nearestPoint.longitude
        //         );
        //         return distance <= 0.1; // 100 meters
        //       });

        //       allTrafficSignals = [...allTrafficSignals, ...filteredSignals];
        //     } catch (error) {
        //       console.error("Error fetching traffic signals:", error);
        //     }

        //     // Add a delay to avoid rate limiting
        //     await new Promise((resolve) => setTimeout(resolve, 1));
        //   }

          console.log("allTrafficSignals", allTrafficSignals);
          setTrafficSignals(allTrafficSignals);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  };

   const fetchTrafficSignals = async () => {
     const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=5000&type=traffic_signal&key=${GOOGLE_MAPS_API_KEY}`;

     try {
       const response = await fetch(url);
       const data = await response.json();

       if (data.results.length > 0) {
         const signals = data.results.map((signal: any) => ({
           latitude: signal.geometry.location.lat,
           longitude: signal.geometry.location.lng,
         }));
         setTrafficSignals(signals);
       }
     } catch (error) {
       console.error("Error fetching traffic signals:", error);
     }
   };
 
  const getTrafficColor = (speed: string) => {
    
    if (speed === "SLOW") return "red";
    if (speed === "MODERATE") return "orange";
    return "blue";
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

        {trafficSignals.map((signal, index) => (
          <Circle
            key={`signal-${index}`}
            center={signal}
            radius={50}
            fillColor="rgba(255, 0, 0, 0.5)"
            strokeColor="red"
          />
        ))}

        {/* {trafficSignals.map((signal, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: signal.latitude,
              longitude: signal.longitude,
            }}
            title="Traffic Signal"
          >
            <View
              style={{
                backgroundColor: "red",
                width: 10,
                height: 10,
                borderRadius: 5,
              }}
            />
          </Marker>
        ))} */}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

export default MapScreen;
