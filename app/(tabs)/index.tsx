import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>Home Screen</Text>
      <Button title="Logout" onPress={() => router.replace("/login")} />
    </View>
  );
}
