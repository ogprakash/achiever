import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import StatsScreen from '../screens/StatsScreen';
import CookieJarScreen from '../screens/CookieJarScreen';

const Tab = createBottomTabNavigator();

// Simple icon components (we'll use these for now, can upgrade to icons library later)
const HomeIcon = ({ focused }) => (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: focused === true ? '#dbeafe' : 'transparent' }}>
        <Text style={{ fontSize: 20, color: focused === true ? '#3b82f6' : '#9ca3af' }}>🏠</Text>
    </View>
);

const AddIcon = ({ focused }) => (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: focused === true ? '#06b6d4' : 'transparent' }}>
        <Text style={{ fontSize: 20, color: focused === true ? '#ffffff' : '#9ca3af' }}>+</Text>
    </View>
);

const CookieIcon = ({ focused }) => (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: focused === true ? '#fef3c7' : 'transparent' }}>
        <Text style={{ fontSize: 20, color: focused === true ? '#f59e0b' : '#9ca3af' }}>🍪</Text>
    </View>
);

const StatsIcon = ({ focused }) => (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: focused === true ? '#dbeafe' : 'transparent' }}>
        <Text style={{ fontSize: 20, color: focused === true ? '#3b82f6' : '#9ca3af' }}>📊</Text>
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
                    name="CookieJar"
                    component={CookieJarScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <CookieIcon focused={focused} />,
                        tabBarLabel: 'Cookie Jar',
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
