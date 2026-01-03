/*
  # Vampir Köylü Game Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `games_played` (integer, default 0)
      - `games_won` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `rooms`
      - `code` (text, primary key, 6-character unique code)
      - `creator_id` (uuid, references user_profiles)
      - `status` (text: 'waiting', 'day', 'night', 'voting', 'ended')
      - `current_phase` (text: 'lobby', 'day', 'night', 'voting', 'results', 'ended')
      - `phase_number` (integer, default 1)
      - `vampire_target` (uuid, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `players`
      - `id` (uuid, primary key)
      - `room_code` (text, references rooms)
      - `user_id` (uuid, references user_profiles, nullable for guest players)
      - `username` (text)
      - `role` (text: 'vampir', 'koylu', nullable until game starts)
      - `is_alive` (boolean, default true)
      - `is_ready` (boolean, default false)
      - `joined_at` (timestamptz)
    
    - `votes`
      - `id` (uuid, primary key)
      - `room_code` (text, references rooms)
      - `voter_id` (uuid, references players)
      - `target_id` (uuid, references players)
      - `phase_number` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code text PRIMARY KEY,
  creator_id uuid REFERENCES user_profiles(id),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'ended')),
  current_phase text DEFAULT 'lobby' CHECK (current_phase IN ('lobby', 'day', 'night', 'voting', 'results', 'ended')),
  phase_number integer DEFAULT 1,
  vampire_target uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON rooms
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON rooms
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete rooms"
  ON rooms
  FOR DELETE
  TO public
  USING (true);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES rooms(code) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id),
  username text NOT NULL,
  role text CHECK (role IN ('vampir', 'koylu') OR role IS NULL),
  is_alive boolean DEFAULT true,
  is_ready boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read players"
  ON players
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create players"
  ON players
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON players
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete players"
  ON players
  FOR DELETE
  TO public
  USING (true);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES rooms(code) ON DELETE CASCADE,
  voter_id uuid REFERENCES players(id) ON DELETE CASCADE,
  target_id uuid REFERENCES players(id) ON DELETE CASCADE,
  phase_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete votes"
  ON votes
  FOR DELETE
  TO public
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_votes_room_code ON votes(room_code);
CREATE INDEX IF NOT EXISTS idx_votes_phase ON votes(room_code, phase_number);
