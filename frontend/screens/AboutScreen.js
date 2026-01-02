import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Header from '../components/Header';

export default function AboutScreen({ navigation }) {
    return (
        <View className="flex-1 bg-gray-50">
            <Header title="About Us" />

            <ScrollView className="flex-1 p-4">
                <View>
                    Hi I am Prakash Bhardwaj
                </View>
                {/* Back Button */}
                <TouchableOpacity
                    className="bg-blue-500 rounded-lg py-3.5 items-center shadow-lg"
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Text className="text-white font-bold text-base">Go Back</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
