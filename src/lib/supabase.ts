import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  height?: number;
  current_weight?: number;
  target_weight?: number;
  activity_level: string;
  goal_type: string;
  daily_calories?: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  fitness_level: string;
  workout_preference: string;
  diet_preference: string;
  available_days: number;
  recommended_plan: {
    workout: string[];
    diet: string[];
    tips: string[];
  };
  created_at: string;
}

export interface ProgressLog {
  id: string;
  user_id: string;
  weight?: number;
  calories_consumed: number;
  calories_burned: number;
  exercises_completed: number;
  notes: string;
  log_date: string;
  created_at: string;
}

export interface Competition {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  goal_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface CompetitionParticipant {
  id: string;
  competition_id: string;
  user_id: string;
  status: string;
  initial_weight?: number;
  current_weight?: number;
  points: number;
  joined_at: string;
}
