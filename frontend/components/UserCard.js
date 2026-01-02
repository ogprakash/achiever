import { View, Text } from 'react-native';

export default function UserCard({ user }) {
    return (
        <View className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm">
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
                <Text className="text-blue-500 font-bold text-lg">
                    {user.name ? user.name[0].toUpperCase() : '?'}
                </Text>
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800 mb-1">{user.name}</Text>
                <Text className="text-sm text-gray-500">{user.email}</Text>
            </View>
        </View>
    );
}
