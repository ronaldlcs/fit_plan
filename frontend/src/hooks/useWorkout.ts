import { useCallback, useState } from "react";
import type {
  ActiveWorkoutPlan,
  Exercise,
  GenerateWorkoutPreferences,
  WorkoutPlan,
} from "../types/workout";
import * as workoutService from "../services/workoutService";

export function useWorkout() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await workoutService.getUserWorkoutPlans();
      setPlans(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar planos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllExercises = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await workoutService.getAllExercises();
      setExercises(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar exercicios");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (planData: any) => {
    setIsLoading(true);
    try {
      const newPlan = await workoutService.createWorkoutPlan(planData);
      setPlans((prev) => [...prev, newPlan]);
      setError(null);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar plano");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlan = useCallback(async (planId: string, updates: any) => {
    setIsLoading(true);
    try {
      const updated = await workoutService.updateWorkoutPlan(planId, updates);
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)));
      setError(null);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar plano");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePlan = useCallback(async (planId: string) => {
    setIsLoading(true);
    try {
      await workoutService.deleteWorkoutPlan(planId);
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar plano");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterExercises = useCallback(async (filters: any) => {
    setIsLoading(true);
    try {
      const data = await workoutService.filterExercises(filters);
      setExercises(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao filtrar exercicios");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSession = useCallback(async (planId: string, sessionData: any) => {
    const session = await workoutService.addSession(planId, sessionData);
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, sessoes: [...(p.sessoes ?? []), session] } : p
      )
    );
    return session;
  }, []);

  const removeSession = useCallback(async (planId: string, sessionId: string) => {
    await workoutService.removeSession(sessionId);
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, sessoes: (p.sessoes ?? []).filter((s) => s.id !== sessionId) }
          : p
      )
    );
  }, []);

  const addExerciseToSession = useCallback(async (sessionId: string, exerciseData: any) => {
    return await workoutService.addExerciseToSession(sessionId, exerciseData);
  }, []);

  const generatePlan = useCallback(async (preferences: GenerateWorkoutPreferences) => {
    setIsLoading(true);
    try {
      const newPlan = await workoutService.generateWorkoutPlan(preferences);
      setPlans((prev) => [newPlan, ...prev.filter((p) => p.id !== newPlan.id)]);
      setError(null);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar plano");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActivePlan = useCallback(async (): Promise<ActiveWorkoutPlan | null> => {
    return await workoutService.getActiveWorkoutPlan();
  }, []);

  const completeSession = useCallback(
    async (
      sessionId: string,
      payload: { plano_treino_id?: string; duracao_min?: number; observacao?: string } = {}
    ) => {
      return await workoutService.completeSession(sessionId, payload);
    },
    []
  );

  return {
    plans,
    exercises,
    isLoading,
    error,
    getUserPlans,
    getAllExercises,
    createPlan,
    updatePlan,
    deletePlan,
    filterExercises,
    addSession,
    removeSession,
    addExerciseToSession,
    generatePlan,
    getActivePlan,
    completeSession,
  };
}
