import { useEffect, useState } from 'react';
import { supabase, Room, Player } from '../lib/supabase';
import GameLobby from './GameLobby';
import DayPhase from './DayPhase';
import NightPhase from './NightPhase';
import VotingPhase from './VotingPhase';
import GameEnd from './GameEnd';

const Game = ({
  roomCode,
  playerId,
  username,
  onLeave,
}: {
  roomCode: string;
  playerId: string;
  username: string;
  onLeave: () => void;
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameState();

    const roomChannel = supabase
      .channel(`room:${roomCode}:main`)
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

    const playerChannel = supabase
      .channel(`room:${roomCode}:player:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `id=eq.${playerId}`,
        },
        () => {
          loadPlayer();
        }
      )
      .subscribe();

    return () => {
      roomChannel.unsubscribe();
      playerChannel.unsubscribe();
    };
  }, [roomCode, playerId]);

  const loadGameState = async () => {
    setLoading(true);
    await Promise.all([loadRoom(), loadPlayer()]);
    setLoading(false);
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

  const loadPlayer = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .maybeSingle();

    if (data) {
      setCurrentPlayer(data);
    }
  };

  if (loading || !room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  if (room.current_phase === 'lobby') {
    return <GameLobby roomCode={roomCode} playerId={playerId} username={username} />;
  }

  if (room.current_phase === 'day') {
    return <DayPhase roomCode={roomCode} playerId={playerId} currentPlayer={currentPlayer} />;
  }

  if (room.current_phase === 'night') {
    return <NightPhase roomCode={roomCode} playerId={playerId} currentPlayer={currentPlayer} />;
  }

  if (room.current_phase === 'voting') {
    return <VotingPhase roomCode={roomCode} playerId={playerId} currentPlayer={currentPlayer} />;
  }

  if (room.current_phase === 'ended') {
    return <GameEnd roomCode={roomCode} currentPlayer={currentPlayer} onLeave={onLeave} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl">Unknown game state</p>
      </div>
    </div>
  );
};

export default Game;
