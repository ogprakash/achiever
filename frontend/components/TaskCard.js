import { View, Text, TouchableOpacity } from 'react-native';

export default function TaskCard({ task, onToggle }) {
    const getImportanceColor = (importance) => {
        if (importance === 4) return 'bg-red-500';      // Highest priority
        if (importance === 3) return 'bg-orange-500';
        if (importance === 2) return 'bg-yellow-500';
        return 'bg-blue-500';                           // Priority 1 - Lowest
    };

    const getImportanceLabel = (importance) => {
        return `P${importance}`;
    };

    return (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm"
            onPress={onToggle}
            activeOpacity={0.7}
        >
            {/* Checkbox */}
            <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${task.completed ? 'bg-cyan-500 border-cyan-500' : 'border-gray-300'
                }`}>
                {task.completed && <Text className="text-white font-bold text-sm">✓</Text>}
            </View>

            {/* Task Info */}
            <View className="flex-1">
                <Text className={`text-base ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.title}
                </Text>
            </View>

            {/* Importance Badge */}
            <View className={`${getImportanceColor(task.importance)} px-3 py-1.5 rounded-full`}>
                <Text className="text-white font-bold text-xs">{getImportanceLabel(task.importance)}</Text>
            </View>
        </TouchableOpacity>
    );
}
