import { useState, useEffect } from 'react';
import { User, Trophy, BarChart3, ArrowLeft } from 'lucide-react';
import { supabase, UserProfile } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfilePageProps {
    userId: string;
    onBack: () => void;
}

const ProfilePage = ({ userId, onBack }: ProfilePageProps) => {
    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [rank, setRank] = useState<number | null>(null);

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);

        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileData) {
            setProfile(profileData);

            // Calculate rank
            const { data: rankData } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact' })
                .gt('games_won', profileData.games_won);

            setRank((rankData?.length || 0) + 1);
        }

        setLoading(false);
    };

    const winRate = profile && profile.games_played > 0
        ? Math.round((profile.games_won / profile.games_played) * 100)
        : 0;

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

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center">
                            <User className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{profile?.username}</h1>
                            {rank && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <span className="text-yellow-500 font-bold">{t('rank')} #{rank}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-700">
                            <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-white">{profile?.games_played || 0}</div>
                            <div className="text-gray-400 text-sm">{t('gamesPlayed')}</div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-700">
                            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-white">{profile?.games_won || 0}</div>
                            <div className="text-gray-400 text-sm">{t('gamesWon')}</div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-700">
                            <div className="w-8 h-8 rounded-full bg-purple-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                                %
                            </div>
                            <div className="text-3xl font-bold text-white">{winRate}%</div>
                            <div className="text-gray-400 text-sm">{t('winRate')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
