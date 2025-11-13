export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  if (gender === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return bmr * (multipliers[activityLevel] || 1.2);
}

export function calculateDailyCalories(
  tdee: number,
  goalType: string
): number {
  switch (goalType) {
    case 'lose_weight':
      return Math.round(tdee - 500);
    case 'gain_muscle':
      return Math.round(tdee + 300);
    case 'maintain':
      return Math.round(tdee);
    default:
      return Math.round(tdee);
  }
}

export function getWorkoutPlan(
  fitnessLevel: string,
  workoutPreference: string,
  availableDays: number
): string[] {
  const plans: Record<string, string[]> = {
    beginner_gym: [
      'Segunda: Treino A - Peito e Tríceps (30 min)',
      'Quarta: Treino B - Costas e Bíceps (30 min)',
      'Sexta: Treino C - Pernas e Ombros (30 min)',
    ],
    beginner_home: [
      'Segunda: Flexões, Agachamentos, Prancha (20 min)',
      'Quarta: Burpees, Lunges, Mountain Climbers (20 min)',
      'Sexta: Polichinelos, Abdominais, Prancha lateral (20 min)',
    ],
    intermediate_gym: [
      'Segunda: Peito e Tríceps (45 min)',
      'Terça: Costas e Bíceps (45 min)',
      'Quinta: Pernas (45 min)',
      'Sexta: Ombros e Abdômen (45 min)',
    ],
    intermediate_home: [
      'Segunda: HIIT Upper Body (30 min)',
      'Terça: HIIT Lower Body (30 min)',
      'Quinta: Full Body Strength (30 min)',
      'Sexta: Cardio e Core (30 min)',
    ],
    advanced_gym: [
      'Segunda: Peito (60 min)',
      'Terça: Costas (60 min)',
      'Quarta: Pernas (60 min)',
      'Quinta: Ombros (60 min)',
      'Sexta: Braços (60 min)',
      'Sábado: Cardio (30 min)',
    ],
    advanced_home: [
      'Segunda: HIIT Avançado (45 min)',
      'Terça: Força Upper Body (45 min)',
      'Quarta: Força Lower Body (45 min)',
      'Quinta: Full Body Circuit (45 min)',
      'Sexta: Cardio Intenso (45 min)',
    ],
  };

  const key = `${fitnessLevel}_${workoutPreference}`;
  const plan = plans[key] || plans.beginner_home;

  return plan.slice(0, availableDays);
}

export function getDietPlan(
  dietPreference: string,
  goalType: string,
  calories: number
): string[] {
  const protein = goalType === 'gain_muscle' ? 2.0 : 1.6;
  const fat = 0.8;

  const proteinCals = Math.round((calories * 0.3) / 4);
  const fatCals = Math.round((calories * 0.25) / 9);
  const carbCals = Math.round((calories - proteinCals * 4 - fatCals * 9) / 4);

  const basePlans: Record<string, string[]> = {
    balanced: [
      'Café da manhã: Ovos mexidos com aveia e frutas',
      'Almoço: Arroz integral, frango grelhado e salada',
      'Lanche: Iogurte grego com granola',
      'Jantar: Peixe assado com batata doce e legumes',
    ],
    vegetarian: [
      'Café da manhã: Smoothie de proteína vegetal com banana',
      'Almoço: Quinoa com grão de bico e vegetais',
      'Lanche: Mix de castanhas e frutas',
      'Jantar: Tofu grelhado com arroz integral e brócolis',
    ],
    low_carb: [
      'Café da manhã: Omelete com queijo e abacate',
      'Almoço: Carne com salada verde e azeite',
      'Lanche: Queijo cottage com nozes',
      'Jantar: Salmão com aspargos e couve-flor',
    ],
  };

  const plan = basePlans[dietPreference] || basePlans.balanced;

  return [
    `Calorias diárias: ${calories} kcal`,
    `Proteínas: ${proteinCals}g | Carboidratos: ${carbCals}g | Gorduras: ${fatCals}g`,
    '',
    ...plan,
  ];
}

export function getFitnessTips(goalType: string): string[] {
  const tips: Record<string, string[]> = {
    lose_weight: [
      'Beba pelo menos 2L de água por dia',
      'Faça 10.000 passos diários',
      'Durma 7-8 horas por noite',
      'Evite alimentos processados',
      'Faça cardio 3x por semana',
    ],
    gain_muscle: [
      'Consuma proteína em todas as refeições',
      'Descanse 48h entre treinos do mesmo grupo muscular',
      'Aumente progressivamente a carga nos treinos',
      'Faça 5-6 refeições por dia',
      'Suplementação: Whey e Creatina',
    ],
    maintain: [
      'Mantenha consistência nos treinos',
      'Equilibre macronutrientes',
      'Faça exercícios variados',
      'Monitore seu progresso semanalmente',
      'Ajuste calorias conforme necessário',
    ],
  };

  return tips[goalType] || tips.maintain;
}
