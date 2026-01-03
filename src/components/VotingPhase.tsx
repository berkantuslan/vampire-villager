import { useEffect, useState } from 'react';
import { Vote as VoteIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Player, Room, Vote } from '../lib/supabase';
import { processVotes, checkWinCondition } from '../lib/gameUtils';
import GameChat from './GameChat';

const VotingPhase = ({
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
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadGameData();
    checkIfVoted();

    const votesChannel = supabase
      .channel(`room:${roomCode}:votes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_code=eq.${roomCode}`,
        },
        () => {
          loadVotes();
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`room:${roomCode}:room:voting`)
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
      votesChannel.unsubscribe();
      roomChannel.unsubscribe();
    };
  }, [roomCode, playerId]);

  useEffect(() => {
    // Only verify votes locally to show progress, but DO NOT auto-transition
    // checkAllVoted(); 
  }, [votes, players, room]);

  const loadGameData = async () => {
    await Promise.all([loadRoom(), loadPlayers(), loadVotes()]);
  };

  const loadRoom = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode)
      .maybeSingle();

    if (data) {
      setRoom(data);
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
      // Determine creator
      if (room) {
        setIsCreator(room.creator_id === playerId);
      } else {
        const creator = data[0]; // Fallback
        setIsCreator(creator?.id === playerId);
      }
    }
  };

  const loadVotes = async () => {
    if (!room) return;

    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('room_code', roomCode)
      .eq('phase_number', room.phase_number);

    if (data) {
      setVotes(data);
    }
  };

  const checkIfVoted = async () => {
    if (!room) return;

    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('room_code', roomCode)
      .eq('voter_id', playerId)
      .eq('phase_number', room.phase_number)
      .maybeSingle();

    setHasVoted(!!data);
  };

  const handleVote = async () => {
    if (!selectedTarget || hasVoted || !room) return;

    await supabase.from('votes').insert({
      room_code: roomCode,
      voter_id: playerId,
      target_id: selectedTarget,
      phase_number: room.phase_number,
    });

    setHasVoted(true);
  };

  const handleEndVoting = async () => {
    if (!room || !isCreator) return;

    const currentVotes = votes.filter((v) => v.phase_number === room.phase_number);
    // Determine elimination even if not everyone voted (manual force)
    const eliminated = processVotes(currentVotes);

    // We update the room to show results or just proceed
    // For simplicity, we apply elimination and maybe show results for a moment or proceed to night

    if (eliminated) {
      setEliminatedPlayerId(eliminated);
      setShowResults(true);

      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('id', eliminated);

      // Check win condition
      const { data: updatedPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_code', roomCode);

      if (updatedPlayers) {
        const winner = checkWinCondition(updatedPlayers);
        if (winner) {
          await supabase
            .from('rooms')
            .update({ current_phase: 'ended', status: 'ended' })
            .eq('code', roomCode);
          return;
        }
      }
    } else {
      // Tie or no votes?
      // Maybe show "No one eliminated" message?
      // For now, proceed to night
    }

    // Move to Night Phase after a delay or immediately?
    // User wanted "End Voting" -> "Night Mode" (manual). 
    // So "End Voting" shows results. "Start Night" is next step?
    // Let's make "End Voting" transition to Night directly for now to keep it one button.
    // Or, allow "Results" state.

    // Simplest per user request: "Oylamayı bitir" -> Gece modu.
    // I entered a delay in previous code. I will remove delay and just transition.
    // But we need to show results first. 
    // Let's transition to Night Phase directly. Night Phase can show "Previous Night Results"?
    // No, Day Phase showing results is better.

    await supabase
      .from('rooms')
      .update({
        current_phase: 'night',
        vampire_target: null,
      })
      .eq('code', roomCode);
  };


  const alivePlayers = players.filter((p) => p.is_alive);
  const votedCount = votes.filter((v) => v.phase_number === room?.phase_number).length;
  const eliminatedPlayer = eliminatedPlayerId
    ? players.find((p) => p.id === eliminatedPlayerId)
    : null;

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

  if (showResults && eliminatedPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-8 rounded-xl border-4 border-purple-500 shadow-2xl max-w-md text-center">
          <h2 className="text-4xl font-bold text-purple-500 mb-4">{t('votingResults')}</h2>
          <p className="text-white text-xl mb-2">
            <span className="font-bold text-red-400">{eliminatedPlayer.username}</span>
          </p>
          <p className="text-gray-300 mb-4">{t('wasEliminated')}</p>
          <div className="text-6xl mb-4">
            {eliminatedPlayer.role === 'vampir' ? '🧛' : '👨‍🌾'}
          </div>
          <p className="text-gray-400">
            {t('yourRole')}: {t(eliminatedPlayer.role || 'unknown')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

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
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-purple-500 drop-shadow-lg">
            🗳️ {t('votingPhase')}
          </h1>
          <p className="text-2xl text-gray-300 font-medium">
            {hasVoted
              ? `Waiting for others... (${votedCount}/${alivePlayers.length})`
              : t('vote')
            }
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border-2 border-purple-500 p-6 mb-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <VoteIcon className="w-6 h-6" />
            {hasVoted ? 'Your vote has been cast' : t('selectTarget')}
          </h2>
          <div className="grid gap-3 mb-6">
            {alivePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => !hasVoted && setSelectedTarget(player.id)}
                disabled={hasVoted || player.id === playerId}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${player.id === playerId
                  ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                  : selectedTarget === player.id
                    ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-900/50'
                    : hasVoted
                      ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-gray-800 border-gray-700 hover:border-purple-500 hover:bg-gray-750'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-white font-bold">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-white">{player.username}</span>
                  {player.id === playerId && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </div>
                {selectedTarget === player.id && !hasVoted && (
                  <VoteIcon className="w-5 h-5 text-white" />
                )}
              </button>
            ))}
          </div>

          {!hasVoted && (
            <button
              onClick={handleVote}
              disabled={!selectedTarget}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-purple-900/50 hover:shadow-purple-900/80 transition-all transform hover:scale-105 border-2 border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-2">
                <VoteIcon className="w-6 h-6" />
                {t('vote')}
              </span>
            </button>
          )}
        </div>

        {isCreator && (
          <div className="mb-6">
            <button
              onClick={handleEndVoting}
              className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-red-900/80 transition-all transform hover:scale-105 border-2 border-red-500 flex items-center justify-center gap-2"
            >
              <VoteIcon className="w-6 h-6" />
              {t('endVoting')}
            </button>
          </div>
        )}

        <div className="mt-6">
          <GameChat
            roomCode={roomCode}
            playerId={playerId}
            username={currentPlayer.username}
          />
        </div>
      </div>
    </div>
  );
};

export default VotingPhase;
