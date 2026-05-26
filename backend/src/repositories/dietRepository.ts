import supabase from '../config/database'
import {
  PlanoAlimentar,
  Refeicao,
  RefeicaoAlimento,
  Alimento,
  ProgressoUsuario,
} from '../models/DietPlan'
import { ApiError } from '../utils/apiError'

export class DietRepository {
  // Planos alimentares
  async getPlanById(planId: string): Promise<PlanoAlimentar | null> {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('id', planId)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as PlanoAlimentar
  }

  async getUserPlans(userId: string): Promise<PlanoAlimentar[]> {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })

    if (error) throw error
    return (data as PlanoAlimentar[]) || []
  }

  async createPlan(plan: Partial<PlanoAlimentar>): Promise<PlanoAlimentar> {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .insert([plan])
      .select()
      .single()

    if (error) throw error
    return data as PlanoAlimentar
  }

  async updatePlan(planId: string, updates: Partial<PlanoAlimentar>): Promise<PlanoAlimentar> {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .update(updates)
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return data as PlanoAlimentar
  }

  async deletePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('planos_alimentares')
      .delete()
      .eq('id', planId)

    if (error) throw error
  }

  // Refeições
  async getMealsByPlan(planId: string): Promise<Refeicao[]> {
    const { data, error } = await supabase
      .from('refeicoes')
      .select('*')
      .eq('plano_id', planId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as Refeicao[]) || []
  }

  async createMeal(meal: Partial<Refeicao>): Promise<Refeicao> {
    const { data, error } = await supabase
      .from('refeicoes')
      .insert([meal])
      .select()
      .single()

    if (error) throw error
    return data as Refeicao
  }

  async deleteMeal(mealId: string): Promise<void> {
    const { error } = await supabase
      .from('refeicoes')
      .delete()
      .eq('id', mealId)

    if (error) throw error
  }

  // Alimentos em refeições
  async addFoodToMeal(mealFood: Partial<RefeicaoAlimento>): Promise<RefeicaoAlimento> {
    const { data, error } = await supabase
      .from('refeicao_alimentos')
      .insert([mealFood])
      .select()
      .single()

    if (error) throw error
    return data as RefeicaoAlimento
  }

  async removeFoodFromMeal(mealFoodId: string): Promise<void> {
    const { error } = await supabase
      .from('refeicao_alimentos')
      .delete()
      .eq('id', mealFoodId)

    if (error) throw error
  }

  async getMealFoods(mealId: string): Promise<RefeicaoAlimento[]> {
    const { data, error } = await supabase
      .from('refeicao_alimentos')
      .select('*')
      .eq('refeicao_id', mealId)

    if (error) throw error
    return (data as RefeicaoAlimento[]) || []
  }

  // Alimentos
  async getAllFoods(): Promise<Alimento[]> {
    const { data, error } = await supabase
      .from('alimentos')
      .select('*')
      .order('nome')

    if (error) throw error
    return (data as Alimento[]) || []
  }

  async getFoodById(foodId: string): Promise<Alimento | null> {
    const { data, error } = await supabase
      .from('alimentos')
      .select('*')
      .eq('id', foodId)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as Alimento
  }

  async getFoodByName(nome: string): Promise<Alimento | null> {
    const { data, error } = await supabase
      .from('alimentos')
      .select('*')
      .ilike('nome', nome)
      .order('nome')
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return null
    return data[0] as Alimento
  }

  async createFood(food: Partial<Alimento>): Promise<Alimento> {
    const { data, error } = await supabase
      .from('alimentos')
      .insert([food])
      .select()
      .single()

    if (error) throw error
    return data as Alimento
  }

  async searchFoods(searchTerm: string): Promise<Alimento[]> {
    const { data, error } = await supabase
      .from('alimentos')
      .select('*')
      .ilike('nome', `%${searchTerm}%`)
      .limit(20)

    if (error) throw error
    return (data as Alimento[]) || []
  }

  // Progresso
  async addProgress(progress: Partial<ProgressoUsuario>): Promise<ProgressoUsuario> {
    const { data, error } = await supabase
      .from('progresso_usuario')
      .insert([progress])
      .select()
      .single()

    if (error) throw error
    return data as ProgressoUsuario
  }

  async getUserProgress(userId: string, limit: number = 30): Promise<ProgressoUsuario[]> {
    const { data, error } = await supabase
      .from('progresso_usuario')
      .select('*')
      .eq('user_id', userId)
      .order('data_registro', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as ProgressoUsuario[]) || []
  }
}

export const dietRepository = new DietRepository()
