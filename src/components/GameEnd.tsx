import { useEffect, useState } from 'react';
import { Trophy, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Player } from '../lib/supabase';
import { checkWinCondition } from '../lib/gameUtils';

const GameEnd = ({
  roomCode,
  currentPlayer,
  onLeave,
}: {
  roomCode: string;
  currentPlayer: Player;
  onLeave: () => void;
}) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<'vampires' | 'villagers' | null>(null);

  useEffect(() => {
    loadPlayers();
  }, [roomCode]);

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode)
      .order('joined_at', { ascending: true });

    if (data) {
      setPlayers(data);
      const result = checkWinCondition(data);
      setWinner(result);
    }
  };

  const vampires = players.filter((p) => p.role === 'vampir');
  const villagers = players.filter((p) => p.role === 'koylu');
  const isWinner =
    (winner === 'vampires' && currentPlayer.role === 'vampir') ||
    (winner === 'villagers' && currentPlayer.role === 'koylu');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        {isWinner &&
          [...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              🎉
            </div>
          ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Trophy
              className={`w-32 h-32 ${
                winner === 'vampires' ? 'text-red-500' : 'text-green-500'
              } drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]`}
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span
              className={`bg-gradient-to-r ${
                winner === 'vampires'
                  ? 'from-red-500 via-red-600 to-red-700'
                  : 'from-green-500 via-green-600 to-green-700'
              } bg-clip-text text-transparent drop-shadow-lg`}
            >
              {winner === 'vampires' ? t('vampiresWin') : t('villagersWin')}
            </span>
          </h1>

          {isWinner && (
            <p className="text-3xl text-yellow-400 font-bold mb-2 animate-pulse">
              🎊 Congratulations! 🎊
            </p>
          )}

          <p className="text-gray-300 text-xl">
            {t('yourRole')}: {currentPlayer.role === 'vampir' ? '🧛' : '👨‍🌾'}{' '}
            {t(currentPlayer.role || 'unknown')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-red-900/30 backdrop-blur-sm rounded-xl border-2 border-red-500 p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              🧛 {t('vampir')}
            </h2>
            <div className="space-y-2">
              {vampires.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                    player.is_alive ? 'bg-red-800/50' : 'bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{player.username}</span>
                  {!player.is_alive && <span className="text-gray-500 text-sm">💀</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-900/30 backdrop-blur-sm rounded-xl border-2 border-green-500 p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
              👨‍🌾 {t('koylu')}
            </h2>
            <div className="space-y-2">
              {villagers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                    player.is_alive ? 'bg-green-800/50' : 'bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-sm">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{player.username}</span>
                  {!player.is_alive && <span className="text-gray-500 text-sm">💀</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onLeave}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-bold text-lg shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 border-2 border-gray-600"
          >
            <span className="flex items-center justify-center gap-2">
              <Home className="w-6 h-6" />
              {t('leaveRoom')}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GameEnd;
