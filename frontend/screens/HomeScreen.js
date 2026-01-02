import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView } from 'react-native';
import TaskCard from '../components/TaskCard';
import { fetchTasks, toggleTaskCompletion, getDailyScore } from '../services/api';

export default function HomeScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [dailyScore, setDailyScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [tasksData, scoreData] = await Promise.all([
                fetchTasks(today),
                getDailyScore(today)
            ]);

            setTasks(tasksData);
            setDailyScore(scoreData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Refresh when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleToggleTask = async (taskId) => {
        try {
            await toggleTaskCompletion(taskId);
            loadData(); // Reload to update score
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header with Greeting */}
                <View className="bg-white px-6 pt-12 pb-6">
                    <Text className="text-2xl font-bold text-gray-900">{getGreeting()}! 👋</Text>
                </View>

                {/* Today's Score Card */}
                <View className="px-6 pt-4">
                    <View className="bg-cyan-500 rounded-2xl p-6 shadow-lg">
                        <Text className="text-white text-sm font-semibold mb-2">Today's Score:</Text>
                        <Text className="text-white text-5xl font-bold">
                            {dailyScore ? Math.round(dailyScore.percentageScore) : 0} / 100
                        </Text>
                        {dailyScore && (
                            <Text className="text-cyan-100 text-sm mt-2">
                                {dailyScore.tasksCompleted} of {dailyScore.totalTasks} tasks completed
                            </Text>
                        )}
                    </View>
                </View>

                {/* Task List */}
                <View className="px-6 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Today's Tasks</Text>

                    {loading ? (
                        <Text className="text-gray-500 text-center py-8">Loading tasks...</Text>
                    ) : tasks.length === 0 ? (
                        <View className="bg-white rounded-xl p-8 items-center">
                            <Text className="text-gray-400 text-center">No tasks for today</Text>
                            <Text className="text-gray-400 text-center mt-2">
                                Tap the + button to add a task
                            </Text>
                        </View>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={() => handleToggleTask(task.id)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
