import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { signup, signin } from '../services/api';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(''); // Error state for inline display

    const handleAuth = async () => {
        setError(''); // Clear previous error

        // Validate email
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        // Validate password
        if (!password || password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        // Validate name for signup
        if (isSignUp && !name.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);

        try {
            let userData;
            if (isSignUp) {
                userData = await signup(email.toLowerCase().trim(), name.trim(), password);
            } else {
                userData = await signin(email.toLowerCase().trim(), password);
            }

            await signIn(userData);
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#F3F4F6' }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo / App Name */}
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    <Text style={{ fontSize: 64 }}>🎯</Text>
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#1F2937', marginTop: 16 }}>
                        Achiever
                    </Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
                        Track your tasks, build discipline,{'\n'}climb the leaderboard
                    </Text>
                </View>

                {/* Error Message */}
                {error ? (
                    <View style={{
                        backgroundColor: '#FEE2E2',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 16,
                        width: '100%',
                        borderWidth: 1,
                        borderColor: '#EF4444'
                    }}>
                        <Text style={{ color: '#DC2626', fontWeight: '600', textAlign: 'center' }}>
                            ⚠️ {error}
                        </Text>
                    </View>
                ) : null}

                {/* Auth Form */}
                <View style={{ width: '100%' }}>
                    {/* Sign Up / Sign In Toggle */}
                    <View style={{ flexDirection: 'row', marginBottom: 24, backgroundColor: '#E5E7EB', borderRadius: 10, padding: 4 }}>
                        <TouchableOpacity
                            onPress={() => setIsSignUp(false)}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 8,
                                backgroundColor: !isSignUp ? '#FFFFFF' : 'transparent',
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ fontWeight: '600', color: !isSignUp ? '#1F2937' : '#9CA3AF' }}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsSignUp(true)}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 8,
                                backgroundColor: isSignUp ? '#FFFFFF' : 'transparent',
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ fontWeight: '600', color: isSignUp ? '#1F2937' : '#9CA3AF' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Name Field (only for Sign Up) */}
                    {isSignUp && (
                        <>
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
                        </>
                    )}

                    {/* Email Field */}
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
                            marginBottom: 16
                        }}
                    />

                    {/* Password Field */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                        Password
                    </Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
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

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleAuth}
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
                            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </Text>
                    </TouchableOpacity>

                    {/* Switch Mode Text */}
                    <TouchableOpacity
                        onPress={() => setIsSignUp(!isSignUp)}
                        style={{ marginTop: 20, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <Text style={{ color: '#06b6d4', fontWeight: '600' }}>
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={{ marginTop: 48 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
                        By continuing, you agree to our Terms of Service
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
