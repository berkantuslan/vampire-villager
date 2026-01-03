import { useEffect, useState } from 'react';
import { Copy, Check, Users, Play } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Player, Room } from '../lib/supabase';
import { startGame } from '../lib/gameUtils';
import LobbyChat from './LobbyChat';
import VoiceChat from './VoiceChat';

const GameLobby = ({
  roomCode,
  playerId,
  username,
}: {
  roomCode: string;
  playerId: string;
  username: string;
}) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoomData();

    const playersChannel = supabase
      .channel(`room:${roomCode}:players`)
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
      .channel(`room:${roomCode}:room`)
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
      playersChannel.unsubscribe();
      roomChannel.unsubscribe();
    };
  }, [roomCode]);

  const loadRoomData = async () => {
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
      const { data: creator } = await supabase
        .from('players')
        .select('id')
        .eq('room_code', roomCode)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      setIsCreator(creator?.id === playerId);
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
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (players.length < 3) {
      alert(t('waitingForPlayers'));
      return;
    }

    setLoading(true);
    try {
      await startGame(roomCode);
    } catch (err) {
      console.error('Failed to start game:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
              {t('waitingForPlayers')}
            </span>
          </h1>

          <div className="inline-flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm px-6 py-3 rounded-lg border border-gray-700">
            <span className="text-gray-400">{t('roomCode')}:</span>
            <span className="text-2xl font-bold text-white tracking-wider">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-white">
              {t('players')} ({players.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-white font-bold">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{player.username}</span>
                      {player.id === playerId && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          {t('yourRole')}
                        </span>
                      )}
                      {index === 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {players.length < 3 && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm text-center">
              {t('waitingForPlayers')} (Minimum 3)
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <LobbyChat roomCode={roomCode} playerId={playerId} username={username} />
          <VoiceChat roomCode={roomCode} playerId={playerId} players={players} />
        </div>

        {isCreator && (
          <button
            onClick={handleStartGame}
            disabled={loading || players.length < 3}
            className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-red-900/50 hover:shadow-red-900/80 transition-all transform hover:scale-105 border border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-6 h-6" />
              {loading ? '...' : t('startGame')}
            </span>
          </button>
        )}

        {!isCreator && (
          <div className="text-center text-gray-400">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
