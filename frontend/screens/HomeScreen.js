import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView } from 'react-native';
import TaskCard from '../components/TaskCard';
import UserProfileHeader from '../components/UserProfileHeader';
import { useAuth } from '../context/AuthContext';
import { fetchTasks, toggleTaskCompletion, getDailyScore, deleteTask } from '../services/api';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [dailyScore, setDailyScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [tasksData, scoreData] = await Promise.all([
                fetchTasks(today, user?.id),
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
        // Optimistic UI update - update immediately before API call
        setTasks(prevTasks => prevTasks.map(task =>
            task.id === taskId
                ? { ...task, completed: !task.completed, completed_at: task.completed ? null : new Date().toISOString() }
                : task
        ));

        try {
            await toggleTaskCompletion(taskId);
            // Silently refresh score in background (don't wait)
            getDailyScore().then(setDailyScore).catch(console.error);
        } catch (error) {
            console.error('Error toggling task:', error);
            // Revert on error
            loadData();
        }
    };

    const handleDeleteTask = async (taskId) => {
        // Optimistic UI update - remove immediately
        const previousTasks = tasks;
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

        try {
            await deleteTask(taskId);
            // Refresh score in background
            getDailyScore().then(setDailyScore).catch(console.error);
        } catch (error) {
            console.error('Error deleting task:', error);
            // Revert on error
            setTasks(previousTasks);
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
                {/* Header with Greeting + Profile Icon */}
                <View className="bg-white px-6 pt-12 pb-6">
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text className="text-2xl font-bold text-gray-900">{getGreeting()}! 👋</Text>
                        <UserProfileHeader />
                    </View>
                </View>

                {/* Today's Score Card */}
                <View className="px-6 pt-4">
                    <View className="bg-cyan-500 rounded-2xl p-6 shadow-lg">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-white text-sm font-semibold mb-2">Today's Score:</Text>
                                <Text className="text-white text-5xl font-bold">
                                    {dailyScore ? Math.round(dailyScore.percentageScore) : 0}%
                                </Text>
                            </View>
                            <View className="bg-white/20 rounded-xl px-4 py-2">
                                <Text className="text-white text-xs font-semibold">Expected</Text>
                                <Text className="text-white text-2xl font-bold">
                                    {dailyScore?.expectedScore ? Math.round(dailyScore.expectedScore) : 65}%
                                </Text>
                            </View>
                        </View>
                        {dailyScore && (
                            <View className="mt-3">
                                <Text className="text-cyan-100 text-sm">
                                    {dailyScore.tasksCompleted} of {dailyScore.totalTasks} tasks completed
                                </Text>
                                <Text className="text-cyan-100 text-xs mt-1">
                                    {dailyScore.percentageScore >= (dailyScore.expectedScore || 65)
                                        ? '📈 Above expected! Rating will increase'
                                        : '📉 Below expected. Complete more tasks!'}
                                </Text>
                            </View>
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
                                onDelete={() => handleDeleteTask(task.id)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
