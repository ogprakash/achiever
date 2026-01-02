import { View, Text } from 'react-native';

export default function Header({ title }) {
    return (
        <View className="py-4 px-5 bg-white border-b border-gray-100 items-center shadow-sm z-10">
            <Text className="text-lg font-bold text-gray-900 tracking-wide">{title}</Text>
        </View>
    );
}
