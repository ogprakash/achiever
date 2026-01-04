import { View, Text, TouchableOpacity, Alert } from 'react-native';

export default function TaskCard({ task, onToggle, onDelete }) {
    const getImportanceColor = (importance) => {
        if (importance === 4) return 'bg-red-500';      // Highest priority
        if (importance === 3) return 'bg-orange-500';
        if (importance === 2) return 'bg-yellow-500';
        return 'bg-blue-500';                           // Priority 1 - Lowest
    };

    const getImportanceLabel = (importance) => {
        return `P${importance}`;
    };

    const handleLongPress = () => {
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${task.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete && onDelete()
                }
            ]
        );
    };

    return (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm"
            onPress={onToggle}
            onLongPress={handleLongPress}
            delayLongPress={500}
            activeOpacity={0.7}
        >
            {/* Checkbox */}
            <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${task.completed ? 'bg-cyan-500 border-cyan-500' : 'border-gray-300'
                }`}>
                {task.completed && <Text className="text-white font-bold text-sm">✓</Text>}
            </View>

            {/* Task Info */}
            <View className="flex-1">
                <View className="flex-row items-center">
                    <Text className={`text-base ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {task.title}
                    </Text>
                    {/* Cookie Jar Badge */}
                    {task.is_cookie_jar && (
                        <Text className="ml-2 text-sm">🍪</Text>
                    )}
                    {/* Daily Task Badge */}
                    {task.is_daily && (
                        <Text className="ml-1 text-xs text-blue-500">🔄</Text>
                    )}
                </View>
                {/* Streak indicator for Cookie Jar tasks */}
                {task.current_streak > 0 && (
                    <Text className="text-xs text-orange-500 mt-1">
                        🔥 {task.current_streak} day streak!
                    </Text>
                )}
            </View>

            {/* Importance Badge */}
            <View className={`${getImportanceColor(task.importance)} px-3 py-1.5 rounded-full`}>
                <Text className="text-white font-bold text-xs">{getImportanceLabel(task.importance)}</Text>
            </View>
        </TouchableOpacity>
    );
}
