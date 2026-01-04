import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';
import { signup, signin } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(''); // Error state for inline display

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        // ⚠️ IMPORTANT: You MUST replace these with your own Client IDs from Google Cloud Console
        // See: https://docs.expo.dev/guides/google-authentication/
        androidClientId: 'YOUR_DESIGNATED_ANDROID_CLIENT_ID.apps.googleusercontent.com',
        iosClientId: 'YOUR_DESIGNATED_IOS_CLIENT_ID.apps.googleusercontent.com',
        webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            fetchUserInfo(authentication.accessToken);
        }
    }, [response]);

    const fetchUserInfo = async (token) => {
        try {
            setLoading(true);
            const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = await response.json();

            // Send user info to backend
            await handleGoogleBackendSync(user);
        } catch (error) {
            setError('Failed to fetch Google user info');
            setLoading(false);
        }
    };

    const handleGoogleBackendSync = async (googleUser) => {
        try {
            // Call backend endpoint which handles create-or-login
            // Note: server.js expects { email, name, googleId, avatarUrl }
            const response = await fetch('https://achiever-production-e895.up.railway.app/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: googleUser.email,
                    name: googleUser.name,
                    googleId: googleUser.id,
                    avatarUrl: googleUser.picture
                })
            });

            const data = await response.json();
            if (response.ok) {
                await signIn(data);
            } else {
                throw new Error(data.error || 'Google auth failed on backend');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

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

                {/* Google Sign In Button */}
                <TouchableOpacity
                    disabled={!request}
                    onPress={() => {
                        promptAsync();
                    }}
                    style={{
                        backgroundColor: '#FFFFFF',
                        width: '100%',
                        paddingVertical: 16,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        marginBottom: 24,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2
                    }}
                >
                    <Image
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                        style={{ width: 24, height: 24, marginRight: 12 }}
                        resizeMode="contain"
                    />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Continue with Google
                    </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                    <Text style={{ marginHorizontal: 10, color: '#9CA3AF' }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                </View>

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
