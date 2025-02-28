import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../../../utils/firebase"; // Adjust path if needed
import { collection, query, where, getDocs } from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import tw from "tailwind-react-native-classnames";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // handle login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Logged-in User:", user);

      // Query Firestore for the user document
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("uid", "==", user.uid)); // Search by UID
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const role = userData.role;

        console.log("User Role:", role);

        // Navigate based on role
        if (role === "Admin") {
          navigation.navigate("AdminDashboard");
        } else if (role === "Manager") {
          navigation.navigate("ManagerDashboard");
        } else {
          navigation.navigate("UserDashboard");
        }
      } else {
        Alert.alert("Error", "User role not found in Firestore.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert("Login Failed", error.message);
    }
  };

  // Function to clear input fields
  const clearFields = () => {
    setEmail("");
    setPassword("");
  };

  return (
    <View style={tw`flex-1 justify-center bg-gradient-to-b from-blue-500 to-purple-600`}>
      <View style={tw`items-center`}>
        <Text style={tw`text-3xl font-bold text-black mb-8`}>Welcome</Text>
      </View>

      <View style={tw`mx-6 bg-white p-8 rounded-2xl shadow-lg`}>
        <TextInput value={email} onChangeText={setEmail} style={tw`border-b border-gray-300 p-3 mb-6`} placeholder="Email" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none"/>

        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={tw`border-b border-gray-300 p-3 mb-8`} placeholder="Password"  placeholderTextColor="#9CA3AF"  autoCapitalize="none"/>

        {/* Login Button */}
        <TouchableOpacity onPress={handleLogin} style={tw`bg-purple-600 py-3 rounded-full shadow-md mb-4`}>
          <Text style={tw`text-white text-center font-bold text-lg`}>Login</Text>
        </TouchableOpacity>

        {/* Clear Button */}
        <TouchableOpacity onPress={clearFields}>
          <Text style={tw`text-black text-center font-bold text-lg pr-5`}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
