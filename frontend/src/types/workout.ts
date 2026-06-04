export interface Exercise {
  id: string;
  nome: string;
  descricao: string | null;
  grupo_muscular_id: number | null;
  equipamento: string | null;
  nivel: "iniciante" | "intermediario" | "avancado";
  criado_em: string;
}

export interface SessionExerciseDetail {
  id: string;
  sessao_id: string;
  exercicio_id: string;
  series: number | null;
  repeticoes: string | null;
  descanso_s: number;
  carga_sugerida: string | null;
  ordem: number | null;
  exercicio?: Exercise | null;
}

export interface WorkoutSession {
  id: string;
  plano_treino_id: string;
  nome: string | null;
  dia_semana: string | null;
  ordem: number | null;
  exercicios?: SessionExerciseDetail[];
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  nome: string | null;
  objetivo: string | null;
  nivel: string | null;
  duracao_semanas: number;
  ativo?: boolean;
  criado_em: string;
  sessoes?: WorkoutSession[];
}

export interface ActiveWorkoutPlan extends WorkoutPlan {
  completedSessionIds: string[];
}

export interface GenerateWorkoutPreferences {
  nivel: string;
  objetivo: string;
  duracao_semanas: number;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  plano_treino_id: string | null;
  sessao_id: string | null;
  data_treino: string;
  duracao_min: number | null;
  observacao: string | null;
}
