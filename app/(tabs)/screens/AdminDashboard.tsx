import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, Alert, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { firestore, auth } from "../../../utils/firebase";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import tw from "tailwind-react-native-classnames";

// Navigation type
export type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: "Manager" | "User";
  managerId?: string;
  expoPushToken?: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Manager" | "User">("User");
  const [selectedManager, setSelectedManager] = useState<string>("");

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const userQuery = query(collection(firestore, "users"));
    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      const userList: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<User, "id">),
      }));
      setUsers(userList);
      setManagers(userList.filter((user) => user.role === "Manager"));
    });
    return () => unsubscribe();
  }, []);

  // 🔔 Push Notification Helper
  const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: "default",
        title,
        body,
      }),
    });
  };

  const addUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await setDoc(doc(firestore, "users", userId), {
        uid: userId,
        name: name.trim(),
        email: email.trim(),
        role,
        managerId: role === "User" && selectedManager ? selectedManager : null,
        expoPushToken: "", // Will be populated when user logs in
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("User");
      setSelectedManager("");

      Alert.alert("Success", "User added successfully.");

      // Check if the user has a push token already (probably not yet, but included here for completeness)
      const newUser = users.find((u) => u.email === email);
      if (newUser?.expoPushToken) {
        await sendPushNotification(
          newUser.expoPushToken,
          "Account Created",
          "Welcome! Your account has been set up."
        );
      }
    } catch (error) {
      console.error("Error adding user:", error);
      Alert.alert("Error", "Failed to add user.");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(firestore, "users", userId));
      Alert.alert("Success", "User deleted successfully.");
    } catch (error) {
      console.error("Error deleting user:", error);
      Alert.alert("Error", "Failed to delete user.");
    }
  };

  const updateUserRole = async (userId: string, currentRole: "Manager" | "User") => {
    try {
      const newRole = currentRole === "User" ? "Manager" : "User";
      await updateDoc(doc(firestore, "users", userId), { role: newRole });

      Alert.alert("Success", `User role updated to ${newRole}.`);
    } catch (error) {
      console.error("Error updating user role:", error);
      Alert.alert("Error", "Failed to update user role.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "Logged out successfully.");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-100 p-4`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-800`}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={tw`bg-red-500 px-4 py-2 rounded-lg`}>
          <Text style={tw`text-white font-bold`}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Add User Form */}
      <View style={tw`bg-white p-6 rounded-lg shadow-md mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Add New User</Text>

        <TextInput style={tw`border border-gray-300 rounded-lg p-3 mb-4`} placeholder="Enter name" value={name} onChangeText={setName} />
        <TextInput style={tw`border border-gray-300 rounded-lg p-3 mb-4`} placeholder="Enter email" value={email} onChangeText={setEmail} />
        <TextInput style={tw`border border-gray-300 rounded-lg p-3 mb-4`} placeholder="Enter password" secureTextEntry value={password} onChangeText={setPassword} />

        <Text style={tw`text-gray-700 mb-2`}>Select Role:</Text>
        <Picker selectedValue={role} style={tw`bg-white border border-gray-300 rounded-lg mb-4`} onValueChange={(itemValue) => setRole(itemValue)}>
          <Picker.Item label="User" value="User" />
          <Picker.Item label="Manager" value="Manager" />
        </Picker>

        {role === "User" && (
          <>
            <Text style={tw`text-gray-700 mb-2`}>Select Manager:</Text>
            <Picker selectedValue={selectedManager} style={tw`bg-white border border-gray-300 rounded-lg mb-4`} onValueChange={(itemValue) => setSelectedManager(itemValue)}>
              <Picker.Item label="Select Manager" value="" />
              {managers.map((manager) => (
                <Picker.Item key={manager.id} label={manager.name} value={manager.id} />
              ))}
            </Picker>
          </>
        )}

        <TouchableOpacity onPress={addUser} style={tw`bg-blue-500 py-3 rounded-lg`}>
          <Text style={tw`text-white text-center font-bold`}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => (
          <View style={tw`bg-white p-4 rounded-lg shadow-md mb-4`}>
            <Text style={tw`text-lg font-bold text-gray-800`}>
              {item.name} ({item.email}) - {item.role}
            </Text>
            {item.role === "User" && item.managerId && (
              <Text style={tw`text-gray-600`}>
                Managed by: {managers.find((m) => m.id === item.managerId)?.name || "Unknown"}
              </Text>
            )}
            <View style={tw`flex-row mt-3`}>
              <TouchableOpacity onPress={() => deleteUser(item.id)} style={tw`bg-red-500 px-4 py-2 rounded-lg mr-2`}>
                <Text style={tw`text-white font-bold`}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateUserRole(item.id, item.role)} style={tw`bg-green-500 px-4 py-2 rounded-lg`}>
                <Text style={tw`text-white font-bold`}>
                  {item.role === "User" ? "Promote to Manager" : "Demote to User"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default AdminDashboard;
