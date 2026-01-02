import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function UserForm({ onSubmit }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = () => {
        if (!name || !email) return;
        onSubmit(name, email);
        setName('');
        setEmail('');
    };

    return (
        <View className="p-5 bg-white m-4 rounded-2xl shadow-md">
            <Text className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wider">
                Add New User
            </Text>
            <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 mb-3 text-base text-gray-800"
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
            />
            <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 mb-3 text-base text-gray-800"
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TouchableOpacity
                className="bg-blue-500 rounded-lg py-3.5 items-center mt-1 shadow-lg shadow-blue-200"
                onPress={handleSubmit}
                activeOpacity={0.8}
            >
                <Text className="text-white font-bold text-base">Add User</Text>
            </TouchableOpacity>
        </View>
    );
}
