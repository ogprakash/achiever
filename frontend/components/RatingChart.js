import { View, Dimensions } from 'react-native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const screenWidth = Dimensions.get('window').width;

export default function RatingChart({ data }) {
    if (!data || data.length < 2) return null;

    // Format data for Recharts
    const chartData = data.map((item, index) => {
        const date = new Date(item.date);
        return {
            name: index % 30 === 0 ? `${date.getMonth() + 1}/${date.getDate()}` : '',
            rating: item.rating,
        };
    });

    const ratings = data.map(d => d.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    return (
        <View style={{ width: screenWidth - 64, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        tickLine={false}
                    />
                    <YAxis
                        domain={[Math.floor(minRating / 100) * 100, Math.ceil(maxRating / 100) * 100]}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        tickLine={false}
                    />

                    <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </View>
    );
}
