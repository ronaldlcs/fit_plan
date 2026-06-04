import supabase from '../config/database'
import {
  PlanoTreino,
  SessaoTreino,
  SessaoExercicio,
  TreinoRealizado,
} from '../models/WorkoutPlan'
import {
  TemplateTreino,
  TemplateSessao,
  TemplateSessaoExercicio,
} from '../models/WorkoutTemplate'
import { Exercicio } from '../models/Exercicio'

export class WorkoutRepository {
  // Planos de treino
  async getPlanById(planId: string): Promise<PlanoTreino | null> {
    const { data, error } = await supabase
      .from('planos_treino')
      .select('*')
      .eq('id', planId)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as PlanoTreino
  }

  async getUserPlans(userId: string): Promise<PlanoTreino[]> {
    const { data, error } = await supabase
      .from('planos_treino')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })

    if (error) throw error
    return (data as PlanoTreino[]) || []
  }

  async createPlan(plan: Partial<PlanoTreino>): Promise<PlanoTreino> {
    const { data, error } = await supabase
      .from('planos_treino')
      .insert([plan])
      .select()
      .single()

    if (error) throw error
    return data as PlanoTreino
  }

  async updatePlan(planId: string, updates: Partial<PlanoTreino>): Promise<PlanoTreino> {
    const { data, error } = await supabase
      .from('planos_treino')
      .update(updates)
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return data as PlanoTreino
  }

  async deletePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('planos_treino')
      .delete()
      .eq('id', planId)

    if (error) throw error
  }

  // Sessões de treino
  async getSessionsByPlan(planId: string): Promise<SessaoTreino[]> {
    const { data, error } = await supabase
      .from('sessoes_treino')
      .select('*')
      .eq('plano_treino_id', planId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as SessaoTreino[]) || []
  }

  async createSession(session: Partial<SessaoTreino>): Promise<SessaoTreino> {
    const { data, error } = await supabase
      .from('sessoes_treino')
      .insert([session])
      .select()
      .single()

    if (error) throw error
    return data as SessaoTreino
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessoes_treino')
      .delete()
      .eq('id', sessionId)

    if (error) throw error
  }

  // Exercícios em sessões
  async addExerciseToSession(
    sessionExercise: Partial<SessaoExercicio>
  ): Promise<SessaoExercicio> {
    const { data, error } = await supabase
      .from('sessoes_exercicios')
      .insert([sessionExercise])
      .select()
      .single()

    if (error) throw error
    return data as SessaoExercicio
  }

  async removeExerciseFromSession(sessionExerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('sessoes_exercicios')
      .delete()
      .eq('id', sessionExerciseId)

    if (error) throw error
  }

  async getSessionExercises(sessionId: string): Promise<SessaoExercicio[]> {
    const { data, error } = await supabase
      .from('sessoes_exercicios')
      .select('*')
      .eq('sessao_id', sessionId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as SessaoExercicio[]) || []
  }

  // Exercícios da sessão já com os detalhes do exercício (nome, grupo, etc.)
  async getSessionExercisesWithDetails(
    sessionId: string
  ): Promise<(SessaoExercicio & { exercicio: Exercicio | null })[]> {
    const { data, error } = await supabase
      .from('sessoes_exercicios')
      .select('*, exercicio:exercicios(*)')
      .eq('sessao_id', sessionId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as (SessaoExercicio & { exercicio: Exercicio | null })[]) || []
  }

  async getSessionById(sessionId: string): Promise<SessaoTreino | null> {
    const { data, error } = await supabase
      .from('sessoes_treino')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as SessaoTreino
  }

  // Exercícios
  async getAllExercises(): Promise<Exercicio[]> {
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .order('nome')

    if (error) throw error
    return (data as Exercicio[]) || []
  }

  async getExerciseById(exerciseId: string): Promise<Exercicio | null> {
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .eq('id', exerciseId)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as Exercicio
  }

  async filterExercises(filters: {
    nivel?: string
    grupo_muscular_id?: number
    equipamento?: string
  }): Promise<Exercicio[]> {
    let query = supabase.from('exercicios').select('*')

    if (filters.nivel) query = query.eq('nivel', filters.nivel)
    if (filters.grupo_muscular_id) query = query.eq('grupo_muscular_id', filters.grupo_muscular_id)
    if (filters.equipamento) query = query.eq('equipamento', filters.equipamento)

    const { data, error } = await query.order('nome')

    if (error) throw error
    return (data as Exercicio[]) || []
  }

  // Treinos realizados
  async registerWorkout(workout: Partial<TreinoRealizado>): Promise<TreinoRealizado> {
    const { data, error } = await supabase
      .from('treinos_realizados')
      .insert([workout])
      .select()
      .single()

    if (error) throw error
    return data as TreinoRealizado
  }

  async getUserWorkouts(userId: string, limit: number = 30): Promise<TreinoRealizado[]> {
    const { data, error } = await supabase
      .from('treinos_realizados')
      .select('*')
      .eq('user_id', userId)
      .order('data_treino', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as TreinoRealizado[]) || []
  }

  async getWorkoutById(workoutId: string): Promise<TreinoRealizado | null> {
    const { data, error } = await supabase
      .from('treinos_realizados')
      .select('*')
      .eq('id', workoutId)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as TreinoRealizado
  }

  // Plano ativo do usuário (refletido no Dashboard)
  async getActivePlan(userId: string): Promise<PlanoTreino | null> {
    const { data, error } = await supabase
      .from('planos_treino')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(1)

    if (error) throw error
    return (data && data.length > 0 ? (data[0] as PlanoTreino) : null)
  }

  // Marca um plano como ativo e desativa os demais do usuário
  async setActivePlan(userId: string, planId: string): Promise<void> {
    const { error: clearError } = await supabase
      .from('planos_treino')
      .update({ ativo: false })
      .eq('user_id', userId)

    if (clearError) throw clearError

    const { error } = await supabase
      .from('planos_treino')
      .update({ ativo: true })
      .eq('id', planId)

    if (error) throw error
  }

  // Treinos realizados de hoje (para saber quais sessões foram concluídas)
  async getCompletedSessionsToday(userId: string): Promise<TreinoRealizado[]> {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('treinos_realizados')
      .select('*')
      .eq('user_id', userId)
      .gte('data_treino', start.toISOString())

    if (error) throw error
    return (data as TreinoRealizado[]) || []
  }

  // ── Templates de treino (planos pré-cadastrados) ──
  async getTemplate(
    nivel: string,
    objetivo: string
  ): Promise<TemplateTreino | null> {
    const { data, error } = await supabase
      .from('templates_treino')
      .select('*')
      .eq('nivel', nivel)
      .eq('objetivo', objetivo)
      .single()

    if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
    return data as TemplateTreino
  }

  async getTemplateSessions(templateId: string): Promise<TemplateSessao[]> {
    const { data, error } = await supabase
      .from('templates_sessoes')
      .select('*')
      .eq('template_id', templateId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as TemplateSessao[]) || []
  }

  async getTemplateSessionExercises(
    templateSessaoId: string
  ): Promise<TemplateSessaoExercicio[]> {
    const { data, error } = await supabase
      .from('templates_sessoes_exercicios')
      .select('*')
      .eq('template_sessao_id', templateSessaoId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as TemplateSessaoExercicio[]) || []
  }
}

export const workoutRepository = new WorkoutRepository()
