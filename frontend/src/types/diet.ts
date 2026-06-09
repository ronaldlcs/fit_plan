export interface Food {
  id: string;
  nome: string;
  calorias: number | null;
  proteinas_g: number | null;
  carboidratos_g: number | null;
  gorduras_g: number | null;
}

export interface Meal {
  id: string;
  plano_id: string;
  tipo: string;
  horario: string | null;
  ordem: number | null;
  alimentos?: MealFoodDetail[];
}

export interface MealFoodDetail {
  id: string;
  refeicao_id: string;
  alimento_id: string;
  quantidade_g: number | null;
  alimento?: Food | null;
  calorias_total?: number | null;
  proteinas_total?: number | null;
  carboidratos_total?: number | null;
  gorduras_total?: number | null;
}

export interface DietPlan {
  id: string;
  user_id: string;
  nome: string | null;
  objetivo: string | null;
  calorias_alvo: number | null;
  criado_em: string;
  refeicoes?: Meal[];
}

export interface FoodProgress {
  id: string;
  user_id: string;
  data_registro: string;
  peso_kg: number;
  observacao: string | null;
}
