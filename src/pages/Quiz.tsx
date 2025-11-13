import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  getWorkoutPlan,
  getDietPlan,
  getFitnessTips,
} from '../utils/fitness';
import { Loader2, CheckCircle } from 'lucide-react';

export default function Quiz() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: 'sedentary',
    goalType: 'lose_weight',
    fitnessLevel: 'beginner',
    workoutPreference: 'home',
    dietPreference: 'balanced',
    availableDays: 3,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const bmr = calculateBMR(
        Number(formData.currentWeight),
        Number(formData.height),
        Number(formData.age),
        formData.gender
      );

      const tdee = calculateTDEE(bmr, formData.activityLevel);
      const dailyCalories = calculateDailyCalories(tdee, formData.goalType);

      const workoutPlan = getWorkoutPlan(
        formData.fitnessLevel,
        formData.workoutPreference,
        formData.availableDays
      );

      const dietPlan = getDietPlan(
        formData.dietPreference,
        formData.goalType,
        dailyCalories
      );

      const tips = getFitnessTips(formData.goalType);

      const recommendedPlan = {
        workout: workoutPlan,
        diet: dietPlan,
        tips: tips,
      };

      await supabase.from('profiles').update({
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        current_weight: Number(formData.currentWeight),
        target_weight: Number(formData.targetWeight),
        activity_level: formData.activityLevel,
        goal_type: formData.goalType,
        daily_calories: dailyCalories,
        updated_at: new Date().toISOString(),
      }).eq('id', user!.id);

      await supabase.from('quiz_results').insert({
        user_id: user!.id,
        fitness_level: formData.fitnessLevel,
        workout_preference: formData.workoutPreference,
        diet_preference: formData.dietPreference,
        available_days: formData.availableDays,
        recommended_plan: recommendedPlan,
      });

      await refreshProfile();
      setCompleted(true);
    } catch (error) {
      console.error('Error saving quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quiz Concluído!
          </h2>
          <p className="text-gray-600 mb-6">
            Seu plano personalizado foi criado. Acesse o dashboard para ver suas recomendações.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ir para Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Quiz de Diagnóstico
              </h1>
              <span className="text-sm text-gray-500">Etapa {step} de 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idade
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexo
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso Atual (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.currentWeight}
                    onChange={(e) => handleChange('currentWeight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Alvo (kg)
                </label>
                <input
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => handleChange('targetWeight', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Atividade
                </label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => handleChange('activityLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sedentary">Sedentário</option>
                  <option value="light">Leve (1-3 dias/semana)</option>
                  <option value="moderate">Moderado (3-5 dias/semana)</option>
                  <option value="active">Ativo (6-7 dias/semana)</option>
                  <option value="very_active">Muito Ativo (2x/dia)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo Principal
                </label>
                <select
                  value={formData.goalType}
                  onChange={(e) => handleChange('goalType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lose_weight">Perder Peso</option>
                  <option value="gain_muscle">Ganhar Massa Muscular</option>
                  <option value="maintain">Manter Peso</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Treino e Fitness
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Condicionamento
                </label>
                <select
                  value={formData.fitnessLevel}
                  onChange={(e) => handleChange('fitnessLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferência de Treino
                </label>
                <select
                  value={formData.workoutPreference}
                  onChange={(e) => handleChange('workoutPreference', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gym">Academia</option>
                  <option value="home">Casa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias Disponíveis por Semana
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.availableDays}
                  onChange={(e) => handleChange('availableDays', Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Dieta e Nutrição
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferência Alimentar
                </label>
                <select
                  value={formData.dietPreference}
                  onChange={(e) => handleChange('dietPreference', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="balanced">Equilibrada</option>
                  <option value="vegetarian">Vegetariana</option>
                  <option value="low_carb">Low Carb</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Resumo do seu perfil:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Idade: {formData.age} anos</li>
                  <li>Peso: {formData.currentWeight} kg → {formData.targetWeight} kg</li>
                  <li>Altura: {formData.height} cm</li>
                  <li>Objetivo: {
                    formData.goalType === 'lose_weight' ? 'Perder Peso' :
                    formData.goalType === 'gain_muscle' ? 'Ganhar Massa' :
                    'Manter Peso'
                  }</li>
                  <li>Treino: {formData.workoutPreference === 'gym' ? 'Academia' : 'Casa'}</li>
                  <li>Dias/semana: {formData.availableDays}</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Finalizar'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
