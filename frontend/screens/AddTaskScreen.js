import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '../context/AuthContext';
import { createTask } from '../services/api';

export default function AddTaskScreen({ navigation }) {
    const { user } = useAuth();
    const [taskName, setTaskName] = useState('');
    const [importance, setImportance] = useState(0);
    const [selectedDate, setSelectedDate] = useState('Today');
    const [isDaily, setIsDaily] = useState(false);
    const [isCookieJar, setIsCookieJar] = useState(false);

    const handleSaveTask = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'Please sign in to create tasks');
            return;
        }

        try {
            const date = selectedDate === 'Today'
                ? new Date().toISOString().split('T')[0]
                : selectedDate;

            // Determine task type based on options
            const taskType = isCookieJar ? 'avoidance' : 'standard';

            await createTask(taskName, importance, date, user.id, {
                is_daily: isDaily,
                is_cookie_jar: isCookieJar,
                task_type: taskType
            });

            const successMessage = isCookieJar
                ? 'Cookie Jar task created! Track your streak in the Cookie Jar tab.'
                : 'Task added successfully!';

            Alert.alert('Success', successMessage);
            setTaskName('');
            setImportance(0);
            setIsDaily(false);
            setIsCookieJar(false);

            // Navigate to appropriate screen
            navigation.navigate(isCookieJar ? 'CookieJar' : 'Home');
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task. Make sure backend is running.');
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-900">Add New Task</Text>
            </View>

            <View className="p-6">
                {/* Task Name Input */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Task Name</Text>
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-800"
                        placeholder={isCookieJar ? 'e.g., "No Instagram Reels"' : 'e.g., "Mow the lawn"'}
                        placeholderTextColor="#9ca3af"
                        value={taskName}
                        onChangeText={setTaskName}
                    />
                </View>

                {/* Importance Slider */}
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-sm font-semibold text-gray-700">Priority</Text>
                        <View className="bg-cyan-500 px-4 py-2 rounded-full">
                            <Text className="text-white font-bold text-lg">P{importance}</Text>
                        </View>
                    </View>

                    <Slider
                        minimumValue={0}
                        maximumValue={4}
                        step={1}
                        value={importance}
                        onValueChange={(val) => setImportance(Math.round(val))}
                        minimumTrackTintColor="#06b6d4"
                        maximumTrackTintColor="#d1d5db"
                    />

                    <View className="flex-row justify-between mt-2">
                        <Text className="text-xs text-gray-500">P0 (Highest)</Text>
                        <Text className="text-xs text-gray-500">P4 (Lowest)</Text>
                    </View>
                </View>

                {/* Task Type Options */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-gray-700 mb-3">Task Options</Text>

                    {/* Daily Task Toggle */}
                    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center">
                                <Text className="text-base text-gray-800 font-semibold">🔄 Daily Task</Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">
                                Repeats every day automatically
                            </Text>
                        </View>
                        <Switch
                            value={isDaily}
                            onValueChange={setIsDaily}
                            trackColor={{ false: '#d1d5db', true: '#06b6d4' }}
                            thumbColor={isDaily ? '#ffffff' : '#f4f4f5'}
                        />
                    </View>

                    {/* Cookie Jar Toggle */}
                    <View className="bg-white border border-yellow-200 rounded-xl p-4 flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center">
                                <Text className="text-base text-gray-800 font-semibold">🍪 Cookie Jar Task</Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">
                                Avoidance task - Track streak for NOT doing something
                            </Text>
                            <Text className="text-xs text-orange-500 mt-1">
                                e.g., "No Masturbation", "No Instagram Reels"
                            </Text>
                        </View>
                        <Switch
                            value={isCookieJar}
                            onValueChange={setIsCookieJar}
                            trackColor={{ false: '#d1d5db', true: '#f59e0b' }}
                            thumbColor={isCookieJar ? '#ffffff' : '#f4f4f5'}
                        />
                    </View>
                </View>

                {/* Date Selector */}
                <View className="mb-8">
                    <Text className="text-sm font-semibold text-gray-700 mb-3">Assign Date</Text>
                    <TouchableOpacity
                        className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex-row items-center"
                        activeOpacity={0.7}
                    >
                        <Text className="text-gray-400 mr-2">📅</Text>
                        <Text className="text-base text-gray-600">{selectedDate}</Text>
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-500 mt-2">
                        Date picker will be added in next update
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    className={`${isCookieJar ? 'bg-yellow-500' : 'bg-cyan-500'} rounded-xl py-4 items-center shadow-lg`}
                    onPress={handleSaveTask}
                    activeOpacity={0.8}
                >
                    <Text className="text-white font-bold text-lg">
                        {isCookieJar ? '🍪 Create Cookie Jar Task' : 'Save Task'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

