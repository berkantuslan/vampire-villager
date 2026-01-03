import { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, Medal, Star } from 'lucide-react';
import { supabase, UserProfile } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface LeaderboardProps {
    onBack: () => void;
    currentUserId?: string;
}

const Leaderboard = ({ onBack, currentUserId }: LeaderboardProps) => {
    const { t } = useLanguage();
    const [players, setPlayers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        setLoading(true);

        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .order('games_won', { ascending: false })
            .limit(50);

        if (data) {
            setPlayers(data);
        }

        setLoading(false);
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
        return <span className="w-6 h-6 text-gray-500 font-bold text-center block">{index + 1}</span>;
    };

    const getRankStyle = (index: number) => {
        if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500';
        if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400';
        if (index === 2) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600';
        return 'bg-gray-800/50 border-gray-700';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    {t('back')}
                </button>

                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Star className="w-8 h-8 text-yellow-500" />
                        <h1 className="text-4xl font-bold text-white">{t('leaderboard')}</h1>
                        <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="text-gray-400">{t('topPlayers')}</p>
                </div>

                <div className="space-y-3">
                    {players.map((player, index) => (
                        <div
                            key={player.id}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${getRankStyle(index)} ${player.id === currentUserId ? 'ring-2 ring-purple-500' : ''
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                                    {player.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        {player.username}
                                        {player.id === currentUserId && (
                                            <span className="text-xs bg-purple-500/30 text-purple-400 px-2 py-0.5 rounded">
                                                {t('you')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {player.games_played} {t('gamesPlayed').toLowerCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{player.games_won}</div>
                                <div className="text-xs text-gray-400">{t('wins')}</div>
                            </div>
                        </div>
                    ))}

                    {players.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {t('noPlayers')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
