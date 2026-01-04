import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, RefreshControl } from 'react-native';
import { getLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardScreen() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadLeaderboard = async () => {
        try {
            // Pass actual userId from auth context
            const data = await getLeaderboard(user?.id);
            setLeaderboard(data.leaderboard || []);
            setCurrentUser(data.currentUser);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLeaderboard();
    }, []);

    const getRankBadgeColor = (rank) => {
        if (rank === 1) return '#FFD700'; // Gold
        if (rank === 2) return '#C0C0C0'; // Silver
        if (rank === 3) return '#CD7F32'; // Bronze
        return '#6B7280'; // Gray
    };

    const getRankEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank.toString();
    };

    const renderLeaderboardItem = ({ item }) => (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: item.rank <= 3 ? '#FEF3C7' : '#FFFFFF',
                padding: 16,
                marginHorizontal: 16,
                marginVertical: 4,
                borderRadius: 12,
                borderWidth: item.rank <= 3 ? 2 : 1,
                borderColor: item.rank <= 3 ? getRankBadgeColor(item.rank) : '#E5E7EB'
            }}
        >
            {/* Rank */}
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: getRankBadgeColor(item.rank),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                }}
            >
                <Text style={{ fontSize: item.rank <= 3 ? 20 : 16, fontWeight: 'bold', color: item.rank <= 3 ? '#1F2937' : '#FFF' }}>
                    {getRankEmoji(item.rank)}
                </Text>
            </View>

            {/* Avatar - Colored circle with initials */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginRight: 12,
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][item.rank % 5],
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }}>
                    {item.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </Text>
            </View>

            {/* Name */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                    {item.name}
                </Text>
            </View>

            {/* Rating */}
            <View
                style={{
                    backgroundColor: '#06b6d4',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>
                    {item.currentRating}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 18, color: '#6B7280' }}>Loading leaderboard...</Text>
            </View>
        );
    }

    // Check if user exists in database - if currentUser is null but we have user.id, 
    // it means user was deleted (DB reset) and needs to re-login
    const userNeedsReLogin = user?.id && !currentUser;

    // Use API data (currentUser) as primary source, fall back to cached user data only for display
    const displayUser = currentUser || {
        id: user?.id || 0,
        name: user?.name || 'Unknown User',
        avatarUrl: user?.avatarUrl || 'https://i.pravatar.cc/150?u=default',
        currentRating: currentUser?.currentRating || user?.currentRating || 1500,
        rank: currentUser?.rank || '?'
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            {/* Re-login Warning Banner */}
            {userNeedsReLogin && (
                <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F59E0B' }}>
                    <Text style={{ color: '#92400E', fontWeight: '600', textAlign: 'center' }}>
                        ⚠️ Please logout and signup again to sync your data
                    </Text>
                </View>
            )}

            {/* Header with User Rank */}
            <View style={{ backgroundColor: '#06b6d4', paddingTop: userNeedsReLogin ? 16 : 48, paddingBottom: 16, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                    🏆 Leaderboard
                </Text>
                <Text style={{ fontSize: 14, color: '#CFFAFE', textAlign: 'center', marginTop: 4 }}>
                    Top achievers this season
                </Text>

                {/* Your Rank Card - At Top */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        padding: 12,
                        marginTop: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#FCD34D'
                    }}
                >
                    <View
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#3B82F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10
                        }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFF' }}>
                            #{displayUser.rank}
                        </Text>
                    </View>

                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            marginRight: 10,
                            backgroundColor: '#10B981',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>
                            {displayUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
                            {displayUser.name} {displayUser.id === 999 ? '(You)' : ''}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                            Your current ranking
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: '#3B82F6',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6
                        }}
                    >
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>
                            {displayUser.currentRating}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Leaderboard List */}
            <FlatList
                data={leaderboard}
                renderItem={renderLeaderboardItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 40 }}>
                        No users on leaderboard yet
                    </Text>
                }
            />

            {/* Current User Card (if outside top 10) */}
            {currentUser && currentUser.rank > 10 && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#DBEAFE',
                        padding: 16,
                        margin: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#3B82F6'
                    }}
                >
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#3B82F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12
                        }}
                    >
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFF' }}>
                            #{currentUser.rank}
                        </Text>
                    </View>

                    <Image
                        source={{ uri: currentUser.avatarUrl || 'https://i.pravatar.cc/150?u=default' }}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            marginRight: 12
                        }}
                    />

                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                            {currentUser.name} (You)
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: '#3B82F6',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>
                            {currentUser.currentRating}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}
