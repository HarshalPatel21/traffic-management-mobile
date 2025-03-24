import { View, Text, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AWS from 'aws-sdk';

// Configure AWS Cognito
AWS.config.update({
  region: 'us-east-1', // Replace with your AWS region
});

GoogleSignin.configure({
  webClientId: '1018587222140-k2adrl8s4e3cll3mcdo8unkhftsr701d.apps.googleusercontent.com', // From Google Cloud Console
  offlineAccess: true,
});

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    // Replace with actual authentication logic
    Alert.alert("Signup Successful");
    router.replace("/login"); // Redirect to login after signup
  };

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo;
      authenticateWithCognito(idToken); // Send idToken to AWS Cognito
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Sign in cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Sign in in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Play services not available or outdated");
      } else {
        Alert.alert("Error signing in", error.toString());
      }
    }
  };

  const authenticateWithCognito = async (idToken) => {
    const cognitoIdentity = new AWS.CognitoIdentity();
    const params = {
      IdentityPoolId: 'us-east-1_pDQmut9H9np', // Replace with your Identity Pool ID
      Logins: {
        'accounts.google.com': idToken,
      },
    };

    cognitoIdentity.getId(params, (err, data) => {
      if (err) {
        console.log("Error authenticating with Cognito:", err);
        Alert.alert("Error", "Failed to authenticate with Cognito");
      } else {
        const cognitoIdentityId = data.IdentityId;
        console.log("Cognito Identity ID:", cognitoIdentityId);
        Alert.alert("Success", "Authenticated with Cognito");
        // Use cognitoIdentityId for further AWS services
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button title="Sign Up" onPress={handleSignup} />
      <Button title="Back to Login" onPress={() => router.push("/login")} />

      {/* Sign in with Google Button */}
      <TouchableOpacity style={styles.googleButton} onPress={signIn}>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    paddingVertical: 8,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});