import { supabase, Player } from './supabase';

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createRoom = async (creatorId: string | null) => {
  const code = generateRoomCode();

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      creator_id: creatorId,
      status: 'waiting',
      current_phase: 'lobby',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const joinRoom = async (roomCode: string, username: string, userId: string | null) => {
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .maybeSingle();

  if (!room) {
    throw new Error('Room not found');
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      room_code: roomCode,
      user_id: userId,
      username,
      is_ready: false,
    })
    .select()
    .single();

  if (error) throw error;
  return player;
};

export const assignRoles = (players: Player[]): { [key: string]: 'vampir' | 'koylu' } => {
  const shuffled = [...players];
  // Fisher-Yates Shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const vampireCount = Math.max(1, Math.floor(players.length / 3));
  const roles: { [key: string]: 'vampir' | 'koylu' } = {};

  shuffled.forEach((player, index) => {
    roles[player.id] = index < vampireCount ? 'vampir' : 'koylu';
  });

  return roles;
};

export const startGame = async (roomCode: string) => {
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', roomCode);

  if (!players || players.length < 3) {
    throw new Error('Need at least 3 players to start');
  }

  const roles = assignRoles(players);

  for (const player of players) {
    await supabase
      .from('players')
      .update({ role: roles[player.id] })
      .eq('id', player.id);
  }

  await supabase
    .from('rooms')
    .update({
      status: 'playing',
      current_phase: 'day',
      phase_number: 1,
    })
    .eq('code', roomCode);
};

export const checkWinCondition = (players: Player[]): 'vampires' | 'villagers' | null => {
  const alivePlayers = players.filter(p => p.is_alive);
  const aliveVampires = alivePlayers.filter(p => p.role === 'vampir');
  const aliveVillagers = alivePlayers.filter(p => p.role === 'koylu');

  if (aliveVampires.length === 0) {
    return 'villagers';
  }

  if (aliveVampires.length >= aliveVillagers.length) {
    return 'vampires';
  }

  return null;
};

export const processVotes = (votes: { voter_id: string; target_id: string }[]): string | null => {
  const voteCounts: { [key: string]: number } = {};

  votes.forEach(vote => {
    voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1;
  });

  let maxVotes = 0;
  let eliminated: string | null = null;
  let tie = false;

  Object.entries(voteCounts).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = targetId;
      tie = false;
    } else if (count === maxVotes) {
      tie = true;
    }
  });

  return tie ? null : eliminated;
};
