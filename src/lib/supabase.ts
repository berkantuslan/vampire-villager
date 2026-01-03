import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Room = {
  code: string;
  creator_id: string | null;
  status: 'waiting' | 'playing' | 'ended';
  current_phase: 'lobby' | 'day' | 'night' | 'voting' | 'results' | 'ended';
  phase_number: number;
  vampire_target: string | null;
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  room_code: string;
  user_id: string | null;
  username: string;
  role: 'vampir' | 'koylu' | null;
  is_alive: boolean;
  is_ready: boolean;
  joined_at: string;
};

export type Vote = {
  id: string;
  room_code: string;
  voter_id: string;
  target_id: string;
  phase_number: number;
  created_at: string;
};

export type UserProfile = {
  id: string;
  username: string;
  games_played: number;
  games_won: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  room_code: string;
  player_id: string;
  username: string;
  content: string;
  created_at: string;
};

export type Signaling = {
  id: string;
  room_code: string;
  from_player_id: string;
  to_player_id: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  created_at: string;
};
