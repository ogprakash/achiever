import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();

// Simple icon components (we'll use these for now, can upgrade to icons library later)
const HomeIcon = ({ focused }) => (
    <View className={`w-8 h-8 items-center justify-center rounded-lg ${focused ? 'bg-blue-100' : ''}`}>
        <Text className={`text-xl ${focused ? 'text-blue-500' : 'text-gray-400'}`}>🏠</Text>
    </View>
);

const AddIcon = ({ focused }) => (
    <View className={`w-12 h-12 items-center justify-center rounded-full ${focused ? 'bg-blue-500' : 'bg-gray-700'}`}>
        <Text className="text-2xl text-white">+</Text>
    </View>
);

const StatsIcon = ({ focused }) => (
    <View className={`w-8 h-8 items-center justify-center rounded-lg ${focused ? 'bg-blue-100' : ''}`}>
        <Text className={`text-xl ${focused ? 'text-blue-500' : 'text-gray-400'}`}>📊</Text>
    </View>
);

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        height: 70,
                        paddingBottom: 10,
                        paddingTop: 10,
                        backgroundColor: '#ffffff',
                        borderTopWidth: 1,
                        borderTopColor: '#e5e7eb',
                    },
                    tabBarActiveTintColor: '#3b82f6',
                    tabBarInactiveTintColor: '#9ca3af',
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
                        tabBarLabel: 'Home',
                    }}
                />
                <Tab.Screen
                    name="AddTask"
                    component={AddTaskScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <AddIcon focused={focused} />,
                        tabBarLabel: 'Add Task',
                    }}
                />
                <Tab.Screen
                    name="Stats"
                    component={StatsScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <StatsIcon focused={focused} />,
                        tabBarLabel: 'Stats',
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
