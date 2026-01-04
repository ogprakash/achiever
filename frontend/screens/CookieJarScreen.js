import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { getCookieJar, checkInStreak, addToCookieJar, breakStreak } from '../services/api';

export default function CookieJarScreen() {
    const [cookieJarData, setCookieJarData] = useState({ achievements: [], activeStreaks: [], totalCookies: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAchievement, setNewAchievement] = useState('');

    const loadData = async () => {
        try {
            const data = await getCookieJar();
            setCookieJarData(data);
        } catch (error) {
            console.error('Error loading cookie jar:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleCheckIn = async (taskTitle) => {
        try {
            await checkInStreak(taskTitle);
            Alert.alert('🔥 Check-in Recorded!', `Keep going strong with "${taskTitle}"!`);
            loadData();
        } catch (error) {
            console.error('Error checking in:', error);
        }
    };

    const handleBreakStreak = async (streakId, taskTitle) => {
        Alert.alert(
            'Break Streak?',
            `Did you break your "${taskTitle}" streak? This will reset your counter.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, I Failed',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await breakStreak(streakId);
                            Alert.alert('💪 Stay Strong!', 'Everyone falls. What matters is getting back up. Start again!');
                            loadData();
                        } catch (error) {
                            console.error('Error breaking streak:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleAddAchievement = async () => {
        if (!newAchievement.trim()) return;
        try {
            await addToCookieJar(newAchievement, 'A moment of strength I want to remember');
            Alert.alert('🍪 Cookie Added!', 'Your achievement has been saved to inspire future you!');
            setNewAchievement('');
            setShowAddModal(false);
            loadData();
        } catch (error) {
            console.error('Error adding achievement:', error);
        }
    };

    const getStreakEmoji = (days) => {
        if (days >= 365) return '🏆';
        if (days >= 90) return '💎';
        if (days >= 30) return '⭐';
        if (days >= 14) return '🔥';
        if (days >= 7) return '✨';
        if (days >= 3) return '💪';
        return '🌱';
    };

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header with Cookie Jar Visual */}
            <View style={{ backgroundColor: '#f59e0b' }} className="px-6 pt-12 pb-8">
                <Text className="text-white text-sm font-semibold mb-2">David Goggins' Cookie Jar</Text>
                <Text className="text-white text-3xl font-bold">Your Victories 🍪</Text>
                <Text style={{ color: '#fef3c7' }} className="text-sm mt-2">
                    "When life gets hard, dip into your Cookie Jar and pull out a memory to fuel you."
                </Text>
            </View>

            {/* Cookie Counter */}
            <View className="px-6 -mt-4">
                <View className="bg-white rounded-2xl p-6 shadow-lg items-center">
                    <Text className="text-6xl">🍪</Text>
                    <Text className="text-4xl font-bold text-gray-900 mt-2">{cookieJarData.totalCookies}</Text>
                    <Text className="text-gray-500 text-sm">Cookies Earned</Text>
                </View>
            </View>

            {/* Active Streaks Section */}
            <View className="px-6 mt-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-gray-900">🔥 Active Streaks</Text>
                </View>

                {loading ? (
                    <Text className="text-gray-500 text-center py-4">Loading...</Text>
                ) : cookieJarData.activeStreaks.length === 0 ? (
                    <View className="bg-white rounded-xl p-6 items-center">
                        <Text className="text-gray-400 text-center">No active streaks yet.</Text>
                        <Text className="text-gray-400 text-center text-sm mt-1">
                            Create a Cookie Jar task to start tracking!
                        </Text>
                    </View>
                ) : (
                    cookieJarData.activeStreaks.map((streak) => (
                        <View key={streak.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-2xl mr-2">{getStreakEmoji(streak.current_streak)}</Text>
                                        <Text className="text-base font-semibold text-gray-800">
                                            {streak.task_title}
                                        </Text>
                                    </View>
                                    <Text className="text-orange-500 font-bold text-lg mt-1">
                                        {streak.current_streak} Day Streak!
                                    </Text>
                                    <Text className="text-gray-400 text-xs">
                                        Longest: {streak.longest_streak} days
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <TouchableOpacity
                                        className="bg-green-500 px-3 py-2 rounded-lg mr-2"
                                        onPress={() => handleCheckIn(streak.task_title)}
                                    >
                                        <Text className="text-white font-bold text-sm">✓ Day</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="bg-red-100 px-3 py-2 rounded-lg"
                                        onPress={() => handleBreakStreak(streak.id, streak.task_title)}
                                    >
                                        <Text className="text-red-500 font-bold text-sm">✗</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Past Achievements */}
            <View className="px-6 mt-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-gray-900">🏆 Past Victories</Text>
                    <TouchableOpacity
                        className="bg-yellow-500 px-4 py-2 rounded-full"
                        onPress={() => setShowAddModal(!showAddModal)}
                    >
                        <Text className="text-white font-bold text-sm">+ Add Cookie</Text>
                    </TouchableOpacity>
                </View>

                {/* Add Achievement Form */}
                {showAddModal && (
                    <View className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
                        <Text className="text-yellow-800 font-semibold mb-2">Add a Past Victory</Text>
                        <TextInput
                            className="bg-white border border-yellow-300 rounded-lg px-4 py-3 text-base"
                            placeholder="e.g., Ran my first 5K marathon"
                            value={newAchievement}
                            onChangeText={setNewAchievement}
                        />
                        <TouchableOpacity
                            className="bg-yellow-500 rounded-lg py-3 mt-3 items-center"
                            onPress={handleAddAchievement}
                        >
                            <Text className="text-white font-bold">Add to Cookie Jar 🍪</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {cookieJarData.achievements.length === 0 ? (
                    <View className="bg-white rounded-xl p-6 items-center mb-6">
                        <Text className="text-gray-400 text-center">No cookies yet!</Text>
                        <Text className="text-gray-400 text-center text-sm mt-1">
                            Complete streak milestones or add past victories.
                        </Text>
                    </View>
                ) : (
                    cookieJarData.achievements.map((achievement) => (
                        <View key={achievement.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                            <View className="flex-row items-start">
                                <Text className="text-2xl mr-3">{achievement.icon || '🍪'}</Text>
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-800">
                                        {achievement.title}
                                    </Text>
                                    {achievement.description && (
                                        <Text className="text-gray-500 text-sm mt-1">
                                            {achievement.description}
                                        </Text>
                                    )}
                                    <Text className="text-gray-400 text-xs mt-2">
                                        Earned: {new Date(achievement.earned_date).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Goggins Quote */}
            <View className="px-6 py-8">
                <View style={{ backgroundColor: '#1f2937' }} className="rounded-2xl p-6">
                    <Text className="text-white text-lg font-bold mb-2">
                        "The most powerful weapon you have is your mind."
                    </Text>
                    <Text style={{ color: '#9ca3af' }} className="text-sm">- David Goggins, Can't Hurt Me</Text>
                </View>
            </View>
        </ScrollView>
    );
}
