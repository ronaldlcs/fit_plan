import api from "./api";
import type {
  ActiveWorkoutPlan,
  Exercise,
  GenerateWorkoutPreferences,
  WorkoutPlan,
} from "../types/workout";

export async function createWorkoutPlan(planData: any): Promise<WorkoutPlan> {
  const { data } = await api.post("/workout/plans", planData);
  return data.plan;
}

export async function getWorkoutPlan(planId: string): Promise<WorkoutPlan> {
  const { data } = await api.get(`/workout/plans/${planId}`);
  return data;
}

export async function getUserWorkoutPlans(): Promise<WorkoutPlan[]> {
  const { data } = await api.get("/workout/plans");
  return data;
}

export async function updateWorkoutPlan(
  planId: string,
  updates: any
): Promise<WorkoutPlan> {
  const { data } = await api.put(`/workout/plans/${planId}`, updates);
  return data.plan;
}

export async function deleteWorkoutPlan(planId: string): Promise<void> {
  await api.delete(`/workout/plans/${planId}`);
}

export async function getAllExercises(): Promise<Exercise[]> {
  const { data } = await api.get("/workout/exercises");
  return data;
}

export async function filterExercises(filters: any): Promise<Exercise[]> {
  const { data } = await api.get("/workout/exercises/filter", { params: filters });
  return data;
}

export async function addSession(planId: string, sessionData: any): Promise<any> {
  const { data } = await api.post(`/workout/plans/${planId}/sessions`, sessionData);
  return data.session;
}

export async function removeSession(sessionId: string): Promise<void> {
  await api.delete(`/workout/sessions/${sessionId}`);
}

export async function addExerciseToSession(sessionId: string, exerciseData: any): Promise<any> {
  const { data } = await api.post(`/workout/sessions/${sessionId}/exercises`, exerciseData);
  return data.exercise;
}

export async function removeExerciseFromSession(sessionExerciseId: string): Promise<void> {
  await api.delete(`/workout/session-exercises/${sessionExerciseId}`);
}

export async function registerWorkout(workoutData: any): Promise<any> {
  const { data } = await api.post("/workout/workout-logs", workoutData);
  return data.workout;
}

export async function getUserWorkouts(): Promise<any[]> {
  const { data } = await api.get("/workout/workout-logs");
  return data;
}

export async function generateWorkoutPlan(
  preferences: GenerateWorkoutPreferences
): Promise<WorkoutPlan> {
  const { data } = await api.post("/workout/plans/generate", { preferences });
  return data.plan;
}

export async function getActiveWorkoutPlan(): Promise<ActiveWorkoutPlan | null> {
  const { data } = await api.get("/workout/plans/active");
  return data;
}

export async function activateWorkoutPlan(planId: string): Promise<ActiveWorkoutPlan | null> {
  const { data } = await api.post(`/workout/plans/${planId}/activate`);
  return data.plan;
}

export async function completeSession(
  sessionId: string,
  payload: { plano_treino_id?: string; duracao_min?: number; observacao?: string } = {}
): Promise<any> {
  const { data } = await api.post(`/workout/sessions/${sessionId}/complete`, payload);
  return data.workout;
}
