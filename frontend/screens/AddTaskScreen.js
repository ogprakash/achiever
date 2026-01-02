import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { createTask } from '../services/api';

export default function AddTaskScreen({ navigation }) {
    const [taskName, setTaskName] = useState('');
    const [importance, setImportance] = useState(2);
    const [selectedDate, setSelectedDate] = useState('Today');

    const handleSaveTask = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name');
            return;
        }

        try {
            const date = selectedDate === 'Today'
                ? new Date().toISOString().split('T')[0]
                : selectedDate;

            await createTask(taskName, importance, date);

            Alert.alert('Success', 'Task added successfully!');
            setTaskName('');
            setImportance(2);

            // Navigate to Home screen to see the task
            navigation.navigate('Home');
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
                        placeholder='e.g., "Mow the lawn"'
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
                            <Text className="text-white font-bold text-lg">Priority {importance}</Text>
                        </View>
                    </View>

                    <Slider
                        style={{ width: '100%', height: 50 }}
                        minimumValue={1}
                        maximumValue={4}
                        step={1}
                        value={importance}
                        onValueChange={setImportance}
                        minimumTrackTintColor="#06b6d4"
                        maximumTrackTintColor="#d1d5db"
                        thumbTintColor="#06b6d4"
                    />

                    <View className="flex-row justify-between mt-2">
                        <Text className="text-xs text-gray-500">Priority 1</Text>
                        <Text className="text-xs text-gray-500">Priority 4</Text>
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
                    className="bg-cyan-500 rounded-xl py-4 items-center shadow-lg"
                    onPress={handleSaveTask}
                    activeOpacity={0.8}
                >
                    <Text className="text-white font-bold text-lg">Save Task</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
