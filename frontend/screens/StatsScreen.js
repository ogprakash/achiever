import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getCurrentRating, getRatingHistory, getDailyScore } from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
    const [rating, setRating] = useState(1200); // Starting rating
    const [ratingHistory, setRatingHistory] = useState([]);
    const [todayScore, setTodayScore] = useState(null);
    const [showRatingGrid, setShowRatingGrid] = useState(false);
    const [stats, setStats] = useState({
        totalTasksCompleted: 0,
        averageScore: 0,
        highestImportance: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [ratingData, historyData, scoreData] = await Promise.all([
                getCurrentRating(),
                getRatingHistory(365), // Get full year of data
                getDailyScore(today)
            ]);

            setRating(ratingData.rating);
            setRatingHistory(historyData);
            setTodayScore(scoreData);

            // Calculate additional stats from history
            const completedTasks = historyData.reduce((sum, day) => sum + (day.tasks_completed || 0), 0);
            const avgScore = historyData.reduce((sum, day) => sum + (day.daily_score || 0), 0) / historyData.length;

            setStats({
                totalTasksCompleted: completedTasks,
                averageScore: Math.round(avgScore || 0),
                highestImportance: 4, // Can be calculated from actual data
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const getRatingLabel = (rating) => {
        if (rating >= 3500) return '🏆 Elite Champion';
        if (rating >= 3000) return '⭐ Master';
        if (rating >= 2500) return '💎 Expert';
        if (rating >= 2000) return '🎯 Advanced';
        if (rating >= 1500) return '📈 Intermediate';
        if (rating >= 1000) return '🌱 Beginner';
        return '🐣 Novice';
    };

    const getRatingColor = (rating) => {
        if (rating >= 3500) return 'text-yellow-500';
        if (rating >= 3000) return 'text-purple-500';
        if (rating >= 2500) return 'text-blue-500';
        if (rating >= 2000) return 'text-green-500';
        if (rating >= 1500) return 'text-cyan-500';
        return 'text-gray-500';
    };

    // Goggins quotes from "Can't Hurt Me"
    const gogginsQuotes = [
        "\"You are in danger of living a life so comfortable and soft, that you will die without ever realizing your potential.\"",
        "\"The only way to grow is to make yourself uncomfortable.\"",
        "\"When you think you're done, you're only at 40% of your body's capability.\"",
        "\"We live in a world where mediocrity is often rewarded.\"",
        "\"Most of us aren't defeated in one decisive battle. We are defeated one tiny, seemingly insignificant surrender at a time.\"",
        "\"You have to build calluses on your brain just like you build calluses on your hands.\"",
        "\"The most important conversations you'll ever have are the ones you'll have with yourself.\"",
        "\"Don't stop when you're tired. Stop when you're done.\"",
        "\"Suffering is a test. That's all it is.\"",
        "\"It won't always go your way, so you can't get trapped in this idea of perfection.\"",
    ];

    const getGogginsQuote = () => {
        // Use today's date to pick a consistent daily quote
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return gogginsQuotes[dayOfYear % gogginsQuotes.length];
    };

    // Prepare simple chart data
    const chartData = {
        labels: [],
        datasets: [{
            data: ratingHistory.length > 0 ? ratingHistory.map(item => item.rating) : [1200]
        }]
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Header */}
            <View style={{ backgroundColor: '#06b6d4' }} className="px-6 pt-12 pb-8">
                <Text className="text-white text-sm font-semibold mb-2">Performance Dashboard</Text>
                <Text className="text-white text-3xl font-bold">Prakash Bhardwaj</Text>
            </View>

            {/* Overall Rating Card */}
            <View className="px-6 -mt-6">
                <TouchableOpacity
                    className="bg-white rounded-2xl p-6 shadow-lg"
                    onPress={() => setShowRatingGrid(!showRatingGrid)}
                    activeOpacity={0.8}
                >
                    <View className="items-center">
                        <Text className="text-gray-600 text-sm font-semibold mb-2">
                            Overall Rating {showRatingGrid ? '(Tap to hide grid)' : '(Tap to show grid)'}
                        </Text>
                        <Text className={`text-6xl font-bold ${getRatingColor(rating)}`}>
                            {rating}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-2">/ 4000</Text>
                        <View className="bg-gray-100 rounded-full px-4 py-2 mt-4">
                            <Text className="text-gray-700 font-semibold">{getRatingLabel(rating)}</Text>
                        </View>

                        {/* Rating change indicator */}
                        <View className="flex-row items-center mt-4">
                            <Text className="text-green-500 font-bold text-lg">↑ +25</Text>
                            <Text className="text-gray-500 text-sm ml-2">from last week</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Rating Grid - Shows when clicked */}
                {showRatingGrid && (
                    <View className="bg-white rounded-2xl p-6 mt-4 shadow-lg">
                        <Text className="text-gray-900 font-bold text-lg mb-4 text-center">
                            Rating Scale (0 - 4000)
                        </Text>

                        {/* Visual Rating Scale */}
                        <View className="mb-6">
                            {/* Scale bar */}
                            <View className="h-4 bg-gray-300 rounded-full mb-8 relative overflow-visible">
                                {/* Gradient overlay */}
                                <View className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-gray-400 via-cyan-400 to-yellow-400 rounded-full" />

                                {/* Current position marker */}
                                <View
                                    className="absolute items-center"
                                    style={{ left: `${(rating / 4000) * 100}%`, top: -20, marginLeft: -20 }}
                                >
                                    <View className="bg-red-500 w-10 h-10 rounded-full items-center justify-center shadow-lg">
                                        <Text className="text-white font-bold text-xs">You</Text>
                                    </View>
                                    <View className="w-0.5 h-6 bg-red-500" />
                                </View>
                            </View>
                        </View>

                        {/* Rating Tiers */}
                        <View>
                            <View className={`flex-row items-center justify-between py-2 border-b border-gray-100 ${rating < 1000 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">🐣 Novice</Text>
                                <Text className="text-gray-500 text-sm">{rating < 1000 ? '0 - 999 ← You!' : '0 - 999'}</Text>
                            </View>
                            <View className={`flex-row items-center justify-between py-2 border-b border-gray-100 ${rating >= 1000 && rating < 1500 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">🌱 Beginner</Text>
                                <Text className="text-gray-500 text-sm font-bold">{rating >= 1000 && rating < 1500 ? '1000 - 1499 ← You!' : '1000 - 1499'}</Text>
                            </View>
                            <View className={`flex-row items-center justify-between py-2 border-b border-gray-100 ${rating >= 1500 && rating < 2000 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">📈 Intermediate</Text>
                                <Text className="text-gray-500 text-sm">{rating >= 1500 && rating < 2000 ? '1500 - 1999 ← You!' : '1500 - 1999'}</Text>
                            </View>
                            <View className={`flex-row items-center justify-between py-2 border-b border-gray-100 ${rating >= 2000 && rating < 2500 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">🎯 Advanced</Text>
                                <Text className="text-gray-500 text-sm">{rating >= 2000 && rating < 2500 ? '2000 - 2499 ← You!' : '2000 - 2499'}</Text>
                            </View>
                            <View className={`flex-row items-center justify-between py-2 border-b border-gray-100 ${rating >= 2500 && rating < 3000 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">💎 Expert</Text>
                                <Text className="text-gray-500 text-sm">{rating >= 2500 && rating < 3000 ? '2500 - 2999 ← You!' : '2500 - 2999'}</Text>
                            </View>
                            <View className={`flex-row items-center justify-between py-2 border-b border-gray-100 ${rating >= 3000 && rating < 3500 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">⭐ Master</Text>
                                <Text className="text-gray-500 text-sm">{rating >= 3000 && rating < 3500 ? '3000 - 3499 ← You!' : '3000 - 3499'}</Text>
                            </View>
                            <View className={`flex-row items-center justify-between py-2 ${rating >= 3500 ? 'bg-yellow-50' : ''}`}>
                                <Text className="text-gray-600 text-sm">🏆 Elite Champion</Text>
                                <Text className="text-gray-500 text-sm">{rating >= 3500 ? '3500 - 4000 ← You!' : '3500 - 4000'}</Text>
                            </View>
                        </View>

                        {/* Progress to next tier */}
                        <View className="bg-cyan-50 rounded-xl p-4 mt-4">
                            <Text className="text-cyan-900 font-semibold text-sm mb-2">
                                Next Milestone: {rating < 1000 ? 'Beginner (1000)' : rating < 1500 ? 'Intermediate (1500)' : rating < 2000 ? 'Advanced (2000)' : rating < 2500 ? 'Expert (2500)' : rating < 3000 ? 'Master (3000)' : rating < 3500 ? 'Elite Champion (3500)' : 'Max Level!'}
                            </Text>
                            {rating < 4000 && (
                                <>
                                    <View className="bg-white rounded-full h-3 overflow-hidden">
                                        <View
                                            className="bg-cyan-500 h-full rounded-full"
                                            style={{
                                                width: `${rating < 1000 ? (rating / 1000) * 100 : rating < 1500 ? ((rating - 1000) / 500) * 100 : rating < 2000 ? ((rating - 1500) / 500) * 100 : rating < 2500 ? ((rating - 2000) / 500) * 100 : rating < 3000 ? ((rating - 2500) / 500) * 100 : ((rating - 3000) / 500) * 100}%`
                                            }}
                                        />
                                    </View>
                                    <Text className="text-cyan-700 text-xs mt-2">
                                        {rating < 1000 ? 1000 - rating : rating < 1500 ? 1500 - rating : rating < 2000 ? 2000 - rating : rating < 2500 ? 2500 - rating : rating < 3000 ? 3000 - rating : rating < 3500 ? 3500 - rating : 4000 - rating} points to go!
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Rating Graph */}
            <View className="px-6 mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                    Rating History (Last {ratingHistory.length} Days)
                </Text>
                <View className="bg-white rounded-2xl p-4 shadow-sm">
                    {ratingHistory.length >= 1 ? (
                        <LineChart
                            data={chartData}
                            width={screenWidth - 64}
                            height={220}
                            withDots={ratingHistory.length < 5}
                            withInnerLines={false}
                            withOuterLines={true}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            withVerticalLabels={false}
                            withHorizontalLabels={true}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                propsForBackgroundLines: {
                                    strokeDasharray: '',
                                    stroke: '#e5e7eb',
                                    strokeWidth: 1
                                },
                                propsForLabels: {
                                    fontSize: 11
                                }
                            }}
                            bezier
                            style={{
                                borderRadius: 16,
                            }}
                        />
                    ) : (
                        <Text className="text-gray-400 text-center py-8">
                            Complete your first day's tasks to see your rating!
                        </Text>
                    )}
                </View>
            </View>

            {/* Stats Cards */}
            <View className="px-6 mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-4">Your Statistics</Text>

                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    {/* Tasks Completed */}
                    <View style={{ flex: 1, marginRight: 8 }} className="bg-white rounded-xl p-4 shadow-sm">
                        <View className="bg-cyan-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                            <Text className="text-2xl">📝</Text>
                        </View>
                        <Text className="text-2xl font-bold text-gray-900">{todayScore?.tasksCompleted || 0}</Text>
                        <Text className="text-gray-600 text-xs mt-1">Tasks Completed</Text>
                        <Text className="text-gray-500 text-xs">(Total)</Text>
                    </View>

                    {/* Average Score */}
                    <View style={{ flex: 1, marginLeft: 8 }} className="bg-white rounded-xl p-4 shadow-sm">
                        <View className="bg-yellow-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                            <Text className="text-2xl">📊</Text>
                        </View>
                        <Text className="text-2xl font-bold text-gray-900">
                            {todayScore ? Math.round(todayScore.percentageScore) : 0}%
                        </Text>
                        <Text className="text-gray-600 text-xs mt-1">Average Daily</Text>
                        <Text className="text-gray-500 text-xs">Encore (68%)</Text>
                    </View>
                </View>

                {/* Highest Importance Task */}
                <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="bg-red-100 w-12 h-12 rounded-full items-center justify-center mr-3">
                                <Text className="text-2xl">📈</Text>
                            </View>
                            <View>
                                <Text className="text-2xl font-bold text-gray-900">4</Text>
                                <Text className="text-gray-600 text-xs">Highest Importance</Text>
                                <Text className="text-gray-500 text-xs">Task Completed</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Goggins Motivational Quote */}
            <View className="px-6 pb-8">
                <View style={{ backgroundColor: '#1f2937' }} className="rounded-2xl p-6">
                    <Text className="text-white text-lg font-bold mb-2">
                        {getGogginsQuote()}
                    </Text>
                    <Text style={{ color: '#9ca3af' }} className="text-sm">- David Goggins, Can't Hurt Me</Text>
                </View>
            </View>
        </ScrollView>
    );
}
