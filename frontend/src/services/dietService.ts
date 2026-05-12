import api from "./api";
import type { DietPlan } from "../types/diet";

export async function createDietPlan(planData: any): Promise<DietPlan> {
  const { data } = await api.post("/diet/plans", planData);
  return data.plan;
}

export async function getDietPlan(planId: string): Promise<DietPlan> {
  const { data } = await api.get(`/diet/plans/${planId}`);
  return data;
}

export async function getUserDietPlans(): Promise<DietPlan[]> {
  const { data } = await api.get("/diet/plans");
  return data;
}

export async function updateDietPlan(planId: string, updates: any): Promise<DietPlan> {
  const { data } = await api.put(`/diet/plans/${planId}`, updates);
  return data.plan;
}

export async function deleteDietPlan(planId: string): Promise<void> {
  await api.delete(`/diet/plans/${planId}`);
}

export async function searchFoods(search: string): Promise<any[]> {
  const { data } = await api.get("/diet/foods/search", { params: { search } });
  return data;
}

export async function getAllFoods(): Promise<any[]> {
  const { data } = await api.get("/diet/foods");
  return data;
}

export async function addMeal(planId: string, mealData: any): Promise<any> {
  const { data } = await api.post(`/diet/plans/${planId}/meals`, mealData);
  return data.meal;
}

export async function removeMeal(mealId: string): Promise<void> {
  await api.delete(`/diet/meals/${mealId}`);
}

export async function addFoodToMeal(
  mealId: string,
  foodId: string,
  quantidade_g: number
): Promise<any> {
  const { data } = await api.post(`/diet/meals/${mealId}/foods`, {
    foodId,
    quantidade_g,
  });
  return data.mealFood;
}

export async function removeFoodFromMeal(mealFoodId: string): Promise<void> {
  await api.delete(`/diet/meal-foods/${mealFoodId}`);
}

export async function addProgress(peso_kg: number, observacao?: string): Promise<any> {
  const { data } = await api.post("/diet/progress", { peso_kg, observacao });
  return data.progress;
}

export async function getUserProgress(): Promise<any[]> {
  const { data } = await api.get("/diet/progress");
  return data;
}

export interface GenerateDietPreferences {
  culinaria: string[];
  restricoes: string[];
  refeicoes_por_dia: number;
}

export async function generateDietAI(preferences: GenerateDietPreferences): Promise<any> {
  const { data } = await api.post("/diet/generate-ai", { preferences });
  return data.plan;
}
