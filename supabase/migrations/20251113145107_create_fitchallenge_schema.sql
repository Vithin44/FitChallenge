/*
  # FitChallenge Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `age` (integer)
      - `gender` (text)
      - `height` (decimal, in cm)
      - `current_weight` (decimal, in kg)
      - `target_weight` (decimal, in kg)
      - `activity_level` (text)
      - `goal_type` (text: lose_weight, gain_muscle, maintain)
      - `daily_calories` (integer)
      - `is_admin` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `fitness_level` (text)
      - `workout_preference` (text)
      - `diet_preference` (text)
      - `available_days` (integer)
      - `recommended_plan` (jsonb)
      - `created_at` (timestamptz)
    
    - `progress_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `weight` (decimal)
      - `calories_consumed` (integer)
      - `calories_burned` (integer)
      - `exercises_completed` (integer)
      - `notes` (text)
      - `log_date` (date)
      - `created_at` (timestamptz)
    
    - `competitions`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `goal_type` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text: active, completed, cancelled)
      - `created_at` (timestamptz)
    
    - `competition_participants`
      - `id` (uuid, primary key)
      - `competition_id` (uuid, references competitions)
      - `user_id` (uuid, references profiles)
      - `status` (text: pending, accepted, declined)
      - `initial_weight` (decimal)
      - `current_weight` (decimal)
      - `points` (integer)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
    - Add policies for competition participants
    - Add policies for admin users
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  age integer,
  gender text,
  height decimal,
  current_weight decimal,
  target_weight decimal,
  activity_level text DEFAULT 'sedentary',
  goal_type text DEFAULT 'lose_weight',
  daily_calories integer,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  fitness_level text NOT NULL,
  workout_preference text NOT NULL,
  diet_preference text NOT NULL,
  available_days integer NOT NULL,
  recommended_plan jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON quiz_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quiz results"
  ON quiz_results FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight decimal,
  calories_consumed integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  exercises_completed integer DEFAULT 0,
  notes text DEFAULT '',
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress logs"
  ON progress_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress logs"
  ON progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress logs"
  ON progress_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own progress logs"
  ON progress_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  goal_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS competition_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  initial_weight decimal,
  current_weight decimal,
  points integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitions they participate in"
  ON competitions FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM competition_participants cp
      WHERE cp.competition_id = id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create competitions"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Competition creators can update their competitions"
  ON competitions FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Competition creators can delete their competitions"
  ON competitions FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view participants in their competitions"
  ON competition_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id AND c.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM competition_participants cp
      WHERE cp.competition_id = competition_participants.competition_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Competition creators can invite participants"
  ON competition_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participation status"
  ON competition_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_id ON progress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_date ON progress_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_competitions_creator ON competitions(creator_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON competition_participants(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();