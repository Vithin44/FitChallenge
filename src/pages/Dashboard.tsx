import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, QuizResult, ProgressLog } from '../lib/supabase';
import {
  TrendingDown,
  TrendingUp,
  Flame,
  Activity,
  Target,
  Calendar,
  Plus,
  Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);
  const [logForm, setLogForm] = useState({
    weight: '',
    calories_consumed: '',
    calories_burned: '',
    exercises_completed: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data: quiz } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: logs } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('log_date', { ascending: false })
        .limit(30);

      setQuizResult(quiz);
      setProgressLogs(logs || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();

    await supabase.from('progress_logs').insert({
      user_id: profile!.id,
      weight: logForm.weight ? Number(logForm.weight) : null,
      calories_consumed: Number(logForm.calories_consumed) || 0,
      calories_burned: Number(logForm.calories_burned) || 0,
      exercises_completed: Number(logForm.exercises_completed) || 0,
      notes: logForm.notes,
      log_date: new Date().toISOString().split('T')[0],
    });

    setLogForm({
      weight: '',
      calories_consumed: '',
      calories_burned: '',
      exercises_completed: '',
      notes: '',
    });
    setShowAddLog(false);
    fetchData();
  };

  const getWeightProgress = () => {
    if (!profile?.current_weight || !profile?.target_weight) return 0;
    const initial = profile.current_weight;
    const target = profile.target_weight;
    const current = progressLogs[0]?.weight || initial;
    const progress = ((initial - current) / (initial - target)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return progressLogs.find((log) => log.log_date === today);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quizResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete o Quiz
          </h2>
          <p className="text-gray-600 mb-6">
            Complete o quiz de diagnóstico para ter acesso ao seu plano personalizado.
          </p>
          <a
            href="/quiz"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Fazer Quiz
          </a>
        </div>
      </div>
    );
  }

  const todayLog = getTodayLog();
  const weightProgress = getWeightProgress();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {profile?.full_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Acompanhe seu progresso e conquiste seus objetivos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Peso Atual</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {progressLogs[0]?.weight || profile?.current_weight || '-'} kg
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Meta: {profile?.target_weight} kg
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Calorias Diárias</span>
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {profile?.daily_calories || '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">kcal/dia</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Progresso</span>
              {profile?.goal_type === 'lose_weight' ? (
                <TrendingDown className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {weightProgress.toFixed(0)}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${weightProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Treinos Hoje</span>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {todayLog?.exercises_completed || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">exercícios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Plano de Treino</h2>
            </div>
            <div className="space-y-3">
              {quizResult.recommended_plan.workout.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="ml-3 text-sm text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Plano Alimentar</h2>
            <div className="space-y-3">
              {quizResult.recommended_plan.diet.map((item, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dicas Importantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizResult.recommended_plan.tips.map((tip, index) => (
              <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </div>
                <p className="ml-3 text-sm text-gray-800">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Registro de Progresso</h2>
            <button
              onClick={() => setShowAddLog(!showAddLog)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar
            </button>
          </div>

          {showAddLog && (
            <form onSubmit={handleAddLog} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={logForm.weight}
                    onChange={(e) =>
                      setLogForm({ ...logForm, weight: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calorias Consumidas
                  </label>
                  <input
                    type="number"
                    value={logForm.calories_consumed}
                    onChange={(e) =>
                      setLogForm({ ...logForm, calories_consumed: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calorias Queimadas
                  </label>
                  <input
                    type="number"
                    value={logForm.calories_burned}
                    onChange={(e) =>
                      setLogForm({ ...logForm, calories_burned: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercícios Completados
                  </label>
                  <input
                    type="number"
                    value={logForm.exercises_completed}
                    onChange={(e) =>
                      setLogForm({ ...logForm, exercises_completed: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={logForm.notes}
                  onChange={(e) =>
                    setLogForm({ ...logForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddLog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {progressLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {new Date(log.log_date).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    {log.weight && <span>Peso: {log.weight} kg</span>}
                    {log.calories_consumed > 0 && (
                      <span>Cal: {log.calories_consumed}</span>
                    )}
                    {log.exercises_completed > 0 && (
                      <span>Treinos: {log.exercises_completed}</span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-sm text-gray-500 mt-1">{log.notes}</p>
                  )}
                </div>
              </div>
            ))}

            {progressLogs.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nenhum registro ainda. Adicione seu primeiro progresso!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
