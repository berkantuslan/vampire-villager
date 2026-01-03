import { useEffect, useState } from 'react';
import { Moon, Skull } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Player, Room } from '../lib/supabase';
import GameChat from './GameChat';

const NightPhase = ({
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
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadGameData();

    const roomChannel = supabase
      .channel(`room:${roomCode}:room:night`)
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

    return () => {
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
        setHasVoted(true);
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
        const creator = data[0];
        setIsCreator(creator?.id === playerId);
      }
    }
  };

  const handleSelectTarget = async () => {
    if (!selectedTarget || hasVoted) return;

    await supabase
      .from('players')
      .update({ is_alive: false })
      .eq('id', selectedTarget);

    setHasVoted(true);
  };

  const handleEndNight = async () => {
    // Transition to Day Phase
    await supabase
      .from('rooms')
      .update({
        current_phase: 'day',
        // We increment phase number? Yes.
        phase_number: (room?.phase_number || 1) + 1,
      })
      .eq('code', roomCode);
  };

  const isVampire = currentPlayer.role === 'vampir';
  const alivePlayers = players.filter((p) => p.is_alive && p.id !== playerId);

  if (!currentPlayer.is_alive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-red-500 mb-4">
            {t('eliminated')}
          </h1>
          <p className="text-gray-400 text-xl">
            {t('yourRole')}: {currentPlayer.role === 'vampir' ? '🧛' : '👨‍🌾'} {t(currentPlayer.role || 'unknown')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20">
          <div className="relative">
            <Moon className="w-32 h-32 text-red-600 drop-shadow-[0_0_50px_rgba(220,38,38,0.9)]" />
            <div className="absolute inset-0 bg-red-600 blur-3xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}

        {[...Array(10)].map((_, i) => (
          <div
            key={`fog-${i}`}
            className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${10 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute top-6 right-6 z-50">
        <div className={`px-6 py-3 bg-gradient-to-r ${currentPlayer.role === 'vampir' ? 'from-red-500 to-red-700' : 'from-green-500 to-green-700'
          } rounded-lg shadow-lg border-2 border-white/50`}>
          <div className="text-white font-bold text-center">
            <div className="text-sm opacity-90">{t('yourRole')}</div>
            <div className="text-2xl flex items-center gap-2">
              <span>{currentPlayer.role === 'vampir' ? '🧛' : '👨‍🌾'}</span>
              <span>{t(currentPlayer.role || 'unknown')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-red-500 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
            🌙 {t('nightPhase')}
          </h1>
          {isVampire && !hasVoted && (
            <p className="text-2xl text-red-300 font-medium animate-pulse">
              {t('selectTarget')}
            </p>
          )}
          {isVampire && hasVoted && (
            <p className="text-2xl text-gray-300 font-medium">
              Waiting for morning...
            </p>
          )}
          {!isVampire && (
            <p className="text-2xl text-gray-300 font-medium">
              Sleep tight... The vampire is hunting...
            </p>
          )}
        </div>

        {isVampire && !hasVoted && (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border-2 border-red-500 p-6 mb-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <Skull className="w-6 h-6" />
              {t('selectTarget')}
            </h2>
            <div className="grid gap-3 mb-6">
              {alivePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${selectedTarget === player.id
                    ? 'bg-red-600 border-red-400 shadow-lg shadow-red-900/50'
                    : 'bg-gray-800 border-gray-700 hover:border-red-500 hover:bg-gray-750'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-white font-bold">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-white">{player.username}</span>
                  </div>
                  {selectedTarget === player.id && (
                    <Skull className="w-5 h-5 text-white" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSelectTarget}
              disabled={!selectedTarget}
              className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-red-900/50 hover:shadow-red-900/80 transition-all transform hover:scale-105 border-2 border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-2">
                <Skull className="w-6 h-6" />
                {t('eliminate')}
              </span>
            </button>
          </div>
        )}

        {!isVampire && (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border-2 border-purple-500 p-12 shadow-2xl text-center">
            <div className="text-6xl mb-4">😴</div>
            <h2 className="text-3xl font-bold text-purple-300 mb-2">Sleeping...</h2>
            <p className="text-gray-400">The village is asleep while darkness reigns</p>
          </div>
        )}

        {isCreator && (
          <div className="mt-6">
            <button
              onClick={handleEndNight}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-blue-900/80 transition-all transform hover:scale-105 border-2 border-blue-500 flex items-center justify-center gap-2"
            >
              <Moon className="w-6 h-6" />
              {t('endNight')}
            </button>
          </div>
        )}

        <div className="mt-6">
          <GameChat
            roomCode={roomCode}
            playerId={playerId}
            username={currentPlayer.username}
            filterByRole="vampir"
            currentRole={currentPlayer.role}
          />
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
};

export default NightPhase;
