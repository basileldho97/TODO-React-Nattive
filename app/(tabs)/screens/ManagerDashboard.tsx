import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, TouchableOpacity } from "react-native";
import { firestore, auth } from "../../../utils/firebase"; // Ensure correct Firebase config
import { collection, addDoc, query, onSnapshot, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import tw from "tailwind-react-native-classnames";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";



interface User {
  id: string;
  name: string;
  email: string;
  role: "Manager" | "User";
  managerId?: string;
}

interface Task {
  id: string;
  title: string;
  userId: string;
  completed: boolean;
}

const ManagerDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [tab, setTab] = useState<string>('MyTasks');
  const user = auth.currentUser;

  useEffect(() => {
    const userQuery = query(collection(firestore, "users"), where("managerId", "==", user?.uid));
    const getUsers = onSnapshot(userQuery, (snapshot) => {
      const userList: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<User, "id">),
      }));
      setUsers(userList);
    });


    // const taskQuery = query(collection(firestore, "tasks"), where("userId", '==', users.map(user => user.id)));
    // const unsubscribe = onSnapshot(taskQuery, (snapshot) => {
    //   const taskList: Task[] = snapshot.docs.map((doc) => ({
    //     id: doc.id,
    //     ...(doc.data() as Omit<Task, "id">),
    //   }));
    //   setTasks(taskList);
    // });
    return () => {
      getUsers();
      // unsubscribe
    }
  }, []);

  const getTasks = async () => {
    let taskQuery = query(collection(firestore, "tasks"));

    if (tab === 'MyTasks') {
      taskQuery = query(collection(firestore, "tasks"), where("userId", "==", user?.uid));
    } else if (tab === 'MyCompletedTasks') {
      taskQuery = query(collection(firestore, "tasks"), where("userId", "==", user?.uid), where("completed", "==", true));
    } else if (tab === 'MySubOrdinates') {
      taskQuery = query(collection(firestore, "tasks"), where("userId", 'in', users.map(user => user.id)));
    }

    // get data 

    const getTasks = onSnapshot(taskQuery, (snapshot) => {
      const taskList: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, "id">),
      }));

      setTasks(taskList);
    });
    return () => getTasks();
  }


  useEffect(() => {
    if (users.length > 0) {
      getTasks();
    }
  }, [users, tab]);

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert("Error", "Task title cannot be empty.");
      return;
    }
    try {
      const addTaskToDb = await addDoc(collection(firestore, "tasks"), {
        title: newTaskTitle,
        userId: user?.uid,
        userName: user?.displayName || "Unknown",
      });
      console.log("Task added with ID: ", addTaskToDb.id);
      if (addTaskToDb) {
        Alert.alert("Success", "Task added successfully.");
        setNewTaskTitle("");
        getTasks();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add task.");
    }
  };

// task created by manager
  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find((task) => task.id === taskId);
    if (task) {
      try {
        await updateDoc(doc(firestore, "tasks", taskId), {
          completed: !task.completed,
        });
        getTasks();
      } catch (error) {
        console.error("Error toggling task completion: ", error);
        Alert.alert("Error", "Failed to toggle task completion.");
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(firestore, "tasks", taskId));
      Alert.alert("Success", "Task deleted successfully.");
      getTasks();
    } catch (error) {
      console.error("Error deleting task: ", error);
      Alert.alert("Error", "Failed to delete task.");
    }
  };

  

  // Use StackNavigationProp with RootStackParamList
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Function to Logout and Navigate to Login Page
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "Logged out successfully.");
      navigation.navigate("Login"); 
    } catch (error) {
      console.error("Error logging out: ", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  // get the user name by id
  const getUserName = (userId: string) => {
    const user = users?.find((user) => user?.id === userId);
    return user?.name || "Unknown";
  };

  return (
    <View style={tw`flex-1 bg-gray-100 p-4`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-800`}>Manager Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={tw`bg-red-500 px-4 py-2 rounded-lg`}>
          <Text style={tw`text-white font-bold`}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Add Task Form */}
      <View style={tw`bg-white p-6 rounded-lg shadow-md mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Create New Task</Text>
        <TextInput style={tw`border border-gray-300 rounded-lg p-3 mb-4`} placeholder="Enter task title" value={newTaskTitle} onChangeText={setNewTaskTitle} />
        <TouchableOpacity onPress={addTask} style={tw`bg-blue-500 py-3 rounded-lg`}>
          <Text style={tw`text-white text-center font-bold`}>Create Task</Text>
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row justify-between`}>


        {/* Left - To-Do Tasks */}
        <View style={tw`flex-1 mr-2`}>
          <TouchableOpacity onPress={() => setTab('MyTasks')} style={tw`p-4 ${tab === 'MyTasks' ? "bg-blue-500" : "bg-gray-300"} rounded-t-lg`}>
            <Text style={tw`font-bold text-center ${tab === 'MyTasks' ? 'text-white' : 'text-black'}`}>To-Do</Text>
          </TouchableOpacity>
          {tab === 'MyTasks' && (
            <FlatList
              data={tasks.filter((task) => !task.completed)}
              keyExtractor={(task) => task.id}
              renderItem={({ item }) => (
                <View style={tw`bg-white p-4 rounded-lg shadow-md mb-2`}>
                  <Text style={tw`text-lg font-bold text-gray-800`}>{item.title}</Text>
                  <View style={tw`flex-row justify-between mt-2`}>
                    <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)} style={tw`bg-green-500 px-4 py-2 rounded-lg`}>
                      <Text style={tw`text-white font-bold`}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(item.id)} style={tw`bg-red-500 px-4 py-2 rounded-lg`}>
                      <Text style={tw`text-white font-bold`}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Right - Completed Tasks */}
        <View style={tw`flex-1 ml-2`}>
          <TouchableOpacity onPress={() => setTab('MyCompletedTasks')} style={tw`p-4 ${tab === 'MyCompletedTasks' ? "bg-blue-500" : "bg-gray-300"} rounded-t-lg`}>
            <Text style={tw`font-bold text-center ${tab === 'MyCompletedTasks' ? 'text-white' : 'text-black'}`}>Completed Tasks</Text>
          </TouchableOpacity>
          {tab === 'MyCompletedTasks' && (
            <FlatList
              data={tasks.filter((task) => task.completed)}
              keyExtractor={(task) => task.id}
              renderItem={({ item }) => (
                <View style={tw`bg-white p-4 rounded-lg shadow-md mb-2`}>
                  <Text style={tw`text-lg font-bold text-gray-800`}>{item.title}</Text>
                  <TouchableOpacity onPress={() => deleteTask(item.id)} style={tw`bg-red-500 px-4 py-2 rounded-lg mt-2`} >
                    <Text style={tw`text-white font-bold`}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>

        {/* Right - Completed Tasks */}
        <View style={tw`flex-1 ml-2`}>
          <TouchableOpacity onPress={() => setTab('MySubOrdinates')} style={tw`p-4 ${tab === 'MySubOrdinates' ? "bg-blue-500" : "bg-gray-300"} rounded-t-lg`}>
            <Text style={tw`font-bold text-center ${tab === 'MySubOrdinates' ? 'text-white' : 'text-black'}`}>MySubOrdinates Tasks</Text>
          </TouchableOpacity>
          {tab === 'MySubOrdinates' && (
            <FlatList data={tasks} keyExtractor={(task) => task.id} renderItem={({ item }) => (
              <View style={tw`bg-white p-4 rounded-lg shadow-md mb-4`}>
                <Text style={tw`text-lg font-bold text-gray-800`}>{item.title}</Text>
                <Text style={tw`text-gray-600 text-sm`}>Created by: {getUserName(item?.userId)}</Text>
                <Text style={tw`text-gray-600 text-sm`}>status: {item.completed ? 'Completed' : 'Pending'}</Text>
              </View>
            )}
          />
          )}
        </View>
      </View>
    </View>
  );
};

export default ManagerDashboard;