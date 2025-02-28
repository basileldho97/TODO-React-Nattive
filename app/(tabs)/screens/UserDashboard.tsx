import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal, Alert } from "react-native";
import { firestore, auth } from "../../../utils/firebase"; // Adjust path as needed
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import { StackNavigationProp } from "@react-navigation/stack"; // Import StackNavigationProp
import { signOut } from "firebase/auth"; // Import signOut
import tw from "tailwind-react-native-classnames";

// Define the types for your navigation stack
export type RootStackParamList = {
  Login: undefined;
  TaskManager: undefined;
};

interface Task {
  id: string; 
  title: string;
  completed: boolean;
  userId: string;
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskTitleError, setTaskTitleError] = useState("");
  const [userName, setUserName] = useState(""); // State to store the logged-in user's name
  const user = auth.currentUser;

  // Use StackNavigationProp with RootStackParamList
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Fetch the logged-in user's name
  useEffect(() => {
    if (user) {
      //user data from Firestore (assuming you store the name in Firestore)
      const userQuery = query(collection(firestore, "users"), where("uid", "==", user.uid));
      const unsubscribe = onSnapshot(userQuery, (snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setUserName(userData.name);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  //tasks for the logged-in user
  useEffect(() => {
    if (user) {
      const taskQuery = query(collection(firestore, "tasks"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(taskQuery, (snapshot) => {
        const taskList: Task[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Task, "id">),
        }));
        setTasks(taskList);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Add Task Function

  const addTask = async () => {
    if (newTaskTitle.trim() && user) {
      try {
        await addDoc(collection(firestore, "tasks"), {
          title: newTaskTitle,
          completed: false,
          userId: user.uid,
        });
        setNewTaskTitle("");
        setTaskTitleError("");
        setModalVisible(false);
      } catch (error) {
        Alert.alert("Error", "Failed to add task. Please try again.");
      }
    } else {
      setTaskTitleError("Task title cannot be empty.");
    }
  };
  // Toggle Task Completion Function

  const toggleTaskCompletion = async (taskId: string) => {
    const taskDocRef = doc(firestore, "tasks", taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await updateDoc(taskDocRef, { completed: !task.completed });
    }
  };

  const deleteTask = async (taskId: string) => {
    const taskDocRef = doc(firestore, "tasks", taskId);
    await deleteDoc(taskDocRef);
  };

  // Logout Function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      Alert.alert("Success", "Logged out successfully.");
      navigation.navigate("Login"); // Navigate to the Login screen
    } catch (error) {
      console.error("Error logging out: ", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-100 p-4`}>
      {/* Task Creation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-6 rounded-lg w-11/12`}>
            <Text style={tw`text-lg font-bold mb-4`}>Create New Task</Text>
            <TextInput style={tw`border border-gray-300 rounded-lg p-3 mb-4`} placeholder="Enter task title" value={newTaskTitle} onChangeText={(text) => {
                setNewTaskTitle(text)
                setTaskTitleError("")
              }}
            />
            {taskTitleError && <Text style={tw`text-red-500 mb-2`}>{taskTitleError}</Text>}
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity onPress={addTask} style={tw`bg-blue-500 px-6 py-2 rounded-lg`}>
                <Text style={tw`text-white font-bold`}>Add Task</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`bg-red-500 px-6 py-2 rounded-lg`} >
                <Text style={tw`text-white font-bold`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Top Section */}
      <View style={tw`flex-row justify-between items-center mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-800`}>
          Welcome, {userName || "User"}!
        </Text>
        <View style={tw`flex-row`}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={tw`bg-blue-500 px-4 py-2 rounded-lg mr-2`}>
            <Text style={tw`text-white font-bold`}>Create Task</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={tw`bg-red-500 px-4 py-2 rounded-lg`}>
            <Text style={tw`text-white font-bold`}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={tw`flex-row justify-between`}>
        {/* Left - To-Do Tasks */}
        <View style={tw`flex-1 mr-2`}>
          <TouchableOpacity onPress={() => setShowCompleted(false)} style={tw`p-4 ${!showCompleted ? "bg-blue-500" : "bg-gray-300"} rounded-t-lg`} >
            <Text style={tw`font-bold text-center ${showCompleted ? 'text-black' : 'text-white'}`}>To-Do</Text>
          </TouchableOpacity>
          {!showCompleted && (
            <FlatList
              data={tasks.filter((task) => !task.completed)}
              keyExtractor={(task) => task.id}
              renderItem={({ item }) => (
                <View style={tw`bg-white p-4 rounded-lg shadow-md mb-2`}>
                  <Text style={tw`text-lg font-bold text-gray-800`}>{item.title}</Text>
                  <View style={tw`flex-row justify-between mt-2`}>
                    <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)} style={tw`bg-green-500 px-4 py-2 rounded-lg`} >
                      <Text style={tw`text-white font-bold`}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(item.id)} style={tw`bg-red-500 px-4 py-2 rounded-lg`} >
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
          <TouchableOpacity onPress={() => setShowCompleted(true)} style={tw`p-4 ${showCompleted ? "bg-blue-500" : "bg-gray-300"} rounded-t-lg`} >
            <Text style={tw`font-bold text-center ${showCompleted ? 'text-white' : 'text-black'}`}>Completed Tasks</Text>
          </TouchableOpacity>
          {showCompleted && (
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
      </View>
    </View>
  );
};

export default TaskManager;