import { useEffect, useState } from 'react';
import { Sun, Vote } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Player, Room } from '../lib/supabase';
import GameChat from './GameChat';

const DayPhase = ({
  roomCode,
  playerId,
  currentPlayer,
}: {
  roomCode: string;
  playerId: string;
  currentPlayer: Player;
}) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showMorningMessage, setShowMorningMessage] = useState(true);

  useEffect(() => {
    loadGameData();

    const playersChannel = supabase
      .channel(`room:${roomCode}:players:day`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_code=eq.${roomCode}`,
        },
        () => {
          loadPlayers();
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`room:${roomCode}:room:day`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`,
        },
        () => {
          loadRoom();
        }
      )
      .subscribe();

    setTimeout(() => setShowMorningMessage(false), 5000);

    return () => {
      playersChannel.unsubscribe();
      roomChannel.unsubscribe();
    };
  }, [roomCode]);

  const loadGameData = async () => {
    await Promise.all([loadRoom(), loadPlayers()]);
  };

  const loadRoom = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode)
      .maybeSingle();

    if (data) {
      setRoom(data);

      if (data.vampire_target) {
        const { data: eliminated } = await supabase
          .from('players')
          .select('*')
          .eq('id', data.vampire_target)
          .maybeSingle();

        if (eliminated) {
          setEliminatedPlayer(eliminated);
        }
      }
    }
  };

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode)
      .order('joined_at', { ascending: true });

    if (data) {
      setPlayers(data);
      if (room) {
        setIsCreator(room.creator_id === playerId);
      } else {
        // Fallback for initial load if room isn't ready
        const creator = data[0];
        setIsCreator(creator?.id === playerId);
      }
    }
  };

  const handleStartVoting = async () => {
    await supabase
      .from('rooms')
      .update({ current_phase: 'voting' })
      .eq('code', roomCode);
  };

  const getRoleColor = (role: string | null) => {
    if (role === 'vampir') return 'from-red-500 to-red-700';
    if (role === 'koylu') return 'from-green-500 to-green-700';
    return 'from-gray-500 to-gray-700';
  };

  const getRoleEmoji = (role: string | null) => {
    if (role === 'vampir') return '🧛';
    if (role === 'koylu') return '👨‍🌾';
    return '❓';
  };

  if (!currentPlayer.is_alive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-red-500 mb-4">
            {t('eliminated')}
          </h1>
          <p className="text-gray-400 text-xl">
            {t('yourRole')}: {getRoleEmoji(currentPlayer.role)} {t(currentPlayer.role || 'unknown')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-green-100 to-blue-200 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20">
          <Sun className="w-24 h-24 text-yellow-400 animate-spin-slow" />
        </div>

        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <div className="text-2xl">🏠</div>
          </div>
        ))}

        {[...Array(8)].map((_, i) => (
          <div
            key={`bird-${i}`}
            className="absolute text-xl"
            style={{
              top: `${20 + Math.random() * 30}%`,
              left: `${Math.random() * 100}%`,
              animation: `fly ${5 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            🐦
          </div>
        ))}
      </div>

      <div className="absolute top-6 right-6 z-50">
        <div className={`px-6 py-3 bg-gradient-to-r ${getRoleColor(currentPlayer.role)} rounded-lg shadow-lg border-2 border-white/50`}>
          <div className="text-white font-bold text-center">
            <div className="text-sm opacity-90">{t('yourRole')}</div>
            <div className="text-2xl flex items-center gap-2">
              <span>{getRoleEmoji(currentPlayer.role)}</span>
              <span>{t(currentPlayer.role || 'unknown')}</span>
            </div>
          </div>
        </div>
      </div>

      {showMorningMessage && eliminatedPlayer && room?.phase_number !== 1 && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-8 rounded-xl border-4 border-red-500 shadow-2xl max-w-md text-center">
            <h2 className="text-4xl font-bold text-red-500 mb-4">{t('morning')}</h2>
            <p className="text-white text-xl mb-2">
              <span className="font-bold text-red-400">{eliminatedPlayer.username}</span>
            </p>
            <p className="text-gray-300">{t('wasEliminated')}</p>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-yellow-600 drop-shadow-lg">
            ☀️ {t('dayPhase')}
          </h1>
          <p className="text-2xl text-green-800 font-medium">{t('discussTime')}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border-4 border-yellow-400 p-6 mb-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('players')}</h2>
          <div className="grid gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 ${player.is_alive
                  ? 'bg-green-100 border-green-400'
                  : 'bg-gray-200 border-gray-400 opacity-60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${player.is_alive ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gray-500'
                    }`}>
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800">{player.username}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${player.is_alive
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-white'
                  }`}>
                  {player.is_alive ? t('alive') : t('dead')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <GameChat
            roomCode={roomCode}
            playerId={playerId}
            username={currentPlayer.username}
          />
        </div>

        {isCreator && (
          <button
            onClick={handleStartVoting}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-purple-900/80 transition-all transform hover:scale-105 border-2 border-purple-400"
          >
            <span className="flex items-center justify-center gap-2">
              <Vote className="w-6 h-6" />
              {t('startVoting')}
            </span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes fly {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DayPhase;
