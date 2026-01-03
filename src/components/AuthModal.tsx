import { useState, FormEvent } from 'react';
import { X, User, Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
    onClose: () => void;
    onAuthSuccess: (userId: string, username: string) => void;
}

const AuthModal = ({ onClose, onAuthSuccess }: AuthModalProps) => {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                if (data.user) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('username')
                        .eq('id', data.user.id)
                        .single();

                    onAuthSuccess(data.user.id, profile?.username || email);
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;
                if (data.user) {
                    await supabase.from('user_profiles').insert({
                        id: data.user.id,
                        username,
                        games_played: 0,
                        games_won: 0,
                    });

                    onAuthSuccess(data.user.id, username);
                }
            }
        } catch (err: any) {
            setError(err.message || t('authError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border-2 border-purple-500 p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {isLogin ? t('login') : t('signUp')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">{t('username')}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('enterUsername')}
                                    required
                                    className="w-full bg-gray-900 text-white px-10 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">{t('email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('enterEmail')}
                                required
                                className="w-full bg-gray-900 text-white px-10 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">{t('password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full bg-gray-900 text-white px-10 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-purple-900/50 transition-all disabled:opacity-50"
                    >
                        {loading ? '...' : isLogin ? t('login') : t('signUp')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                        {isLogin ? t('noAccount') : t('hasAccount')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
