import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { googleSignIn } from '../services/api';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);

    const handleGoogleSignIn = async () => {
        // For demo, using a simple email/name form instead of real Google OAuth
        // Google OAuth requires complex setup (Expo Go limitations)
        setShowEmailForm(true);
    };

    const handleEmailSignIn = async () => {
        if (!email || !name) {
            Alert.alert('Error', 'Please enter both name and email');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email');
            return;
        }

        setLoading(true);

        try {
            // Call API to create/get user
            const userData = await googleSignIn(email.toLowerCase().trim(), name.trim());

            if (userData.error) {
                Alert.alert('Error', userData.error);
            } else {
                await signIn(userData);
            }
        } catch (error) {
            console.error('Sign in error:', error);
            Alert.alert('Error', 'Failed to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#F3F4F6' }}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
                {/* Logo / App Name */}
                <View style={{ alignItems: 'center', marginBottom: 48 }}>
                    <Text style={{ fontSize: 64 }}>🎯</Text>
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#1F2937', marginTop: 16 }}>
                        Achiever
                    </Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
                        Track your tasks, build discipline,{'\n'}climb the leaderboard
                    </Text>
                </View>

                {!showEmailForm ? (
                    <View style={{ width: '100%' }}>
                        {/* Google Sign In Button (opens email form for demo) */}
                        <TouchableOpacity
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#FFFFFF',
                                paddingVertical: 16,
                                paddingHorizontal: 24,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                marginBottom: 16
                            }}
                        >
                            <Text style={{ fontSize: 24, marginRight: 12 }}>🔐</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                                Continue with Email
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                            Your data will be saved to your account
                        </Text>
                    </View>
                ) : (
                    <View style={{ width: '100%' }}>
                        {/* Email Form */}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Your Name
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="words"
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 10,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                fontSize: 16,
                                marginBottom: 16
                            }}
                        />

                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Email
                        </Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 10,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                fontSize: 16,
                                marginBottom: 24
                            }}
                        />

                        {/* Sign In Button */}
                        <TouchableOpacity
                            onPress={handleEmailSignIn}
                            disabled={loading}
                            style={{
                                backgroundColor: '#06b6d4',
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>
                                {loading ? 'Signing in...' : 'Sign In / Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => setShowEmailForm(false)}
                            style={{ marginTop: 16, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#6B7280', fontSize: 14 }}>← Back</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Footer */}
                <View style={{ position: 'absolute', bottom: 48, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                        By continuing, you agree to our Terms of Service
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
