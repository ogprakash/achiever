import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function UserProfileHeader() {
    const { user, signOut } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setShowMenu(false);
                        await signOut();
                    }
                }
            ]
        );
    };

    if (!user) return null;

    return (
        <View style={{ position: 'absolute', top: 48, right: 16, zIndex: 100 }}>
            {/* Profile Button */}
            <TouchableOpacity
                onPress={() => setShowMenu(true)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                }}
            >
                <Image
                    source={{ uri: user.avatarUrl || 'https://i.pravatar.cc/150?u=' + user.email }}
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#E5E7EB',
                        marginRight: 8
                    }}
                />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', maxWidth: 100 }} numberOfLines={1}>
                    {user.name?.split(' ')[0] || 'User'}
                </Text>
                <Text style={{ marginLeft: 4, color: '#9CA3AF' }}>▼</Text>
            </TouchableOpacity>

            {/* Dropdown Menu Modal */}
            <Modal
                visible={showMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View style={{
                        position: 'absolute',
                        top: 90,
                        right: 16,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        minWidth: 200,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 8,
                        borderWidth: 1,
                        borderColor: '#E5E7EB'
                    }}>
                        {/* Profile Info */}
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                                {user.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                {user.email}
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#DBEAFE',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginTop: 8,
                                alignSelf: 'flex-start'
                            }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3B82F6' }}>
                                    ⭐ {user.currentRating || 1500}
                                </Text>
                            </View>
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                            }}
                        >
                            <Text style={{ fontSize: 16, marginRight: 8 }}>🚪</Text>
                            <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '500' }}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
