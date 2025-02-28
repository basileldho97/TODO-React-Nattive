import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Login";
import AdminDashboard from "../screens/AdminDashboard";
import ManagerDashboard from "../screens/ManagerDashboard";
import UserDashboard from "../screens/UserDashboard";

export type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  ManagerDashboard: undefined;
  UserDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
      <Stack.Screen name="UserDashboard" component={UserDashboard} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
