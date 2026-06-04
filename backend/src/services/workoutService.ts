import { workoutRepository } from '../repositories/workoutRepository'
import { userRepository } from '../repositories/userRepository'
import { profileRepository } from '../repositories/profileRepository'
import { ApiError } from '../utils/apiError'

const NIVEL_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

const OBJETIVO_LABELS: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  manutencao: 'Manutenção',
}

export class WorkoutService {
  async createWorkoutPlan(userId: string, planData: any): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const plan = await workoutRepository.createPlan({
      user_id: userId,
      ...planData,
      criado_em: new Date().toISOString(),
    })

    return plan
  }

  async getWorkoutPlan(planId: string): Promise<any> {
    const plan = await workoutRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano de treino não encontrado')
    }

    const sessions = await workoutRepository.getSessionsByPlan(planId)
    const sessionsWithExercises = await Promise.all(
      sessions.map(async (session) => {
        const exercises = await workoutRepository.getSessionExercisesWithDetails(session.id)
        return { ...session, exercicios: exercises }
      })
    )

    return {
      ...plan,
      sessoes: sessionsWithExercises,
    }
  }

  async getUserWorkoutPlans(userId: string): Promise<any[]> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    return await workoutRepository.getUserPlans(userId)
  }

  async updateWorkoutPlan(planId: string, updates: any): Promise<any> {
    const plan = await workoutRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano de treino não encontrado')
    }

    return await workoutRepository.updatePlan(planId, updates)
  }

  async deleteWorkoutPlan(planId: string): Promise<void> {
    const plan = await workoutRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano de treino não encontrado')
    }

    await workoutRepository.deletePlan(planId)
  }

  async addSession(planId: string, sessionData: any): Promise<any> {
    const plan = await workoutRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano de treino não encontrado')
    }

    return await workoutRepository.createSession({
      plano_treino_id: planId,
      ...sessionData,
    })
  }

  async removeSession(sessionId: string): Promise<void> {
    await workoutRepository.deleteSession(sessionId)
  }

  async addExerciseToSession(sessionId: string, exerciseData: any): Promise<any> {
    const exercise = await workoutRepository.getExerciseById(exerciseData.exercicio_id)
    if (!exercise) {
      throw ApiError.notFound('Exercício não encontrado')
    }

    return await workoutRepository.addExerciseToSession({
      sessao_id: sessionId,
      ...exerciseData,
    })
  }

  async removeExerciseFromSession(sessionExerciseId: string): Promise<void> {
    await workoutRepository.removeExerciseFromSession(sessionExerciseId)
  }

  async getAllExercises(): Promise<any[]> {
    return await workoutRepository.getAllExercises()
  }

  async filterExercises(filters: any): Promise<any[]> {
    return await workoutRepository.filterExercises(filters)
  }

  async registerWorkout(userId: string, workoutData: any): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    return await workoutRepository.registerWorkout({
      user_id: userId,
      data_treino: new Date().toISOString(),
      ...workoutData,
    })
  }

  async getUserWorkouts(userId: string): Promise<any[]> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    return await workoutRepository.getUserWorkouts(userId)
  }

  // Gera um plano de treino a partir de um template pré-cadastrado
  // (nível + objetivo) e o salva como plano ativo do usuário.
  async generatePlanFromTemplate(
    userId: string,
    options: { nivel: string; objetivo: string; duracao_semanas?: number }
  ): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const { nivel, objetivo } = options
    const duracao_semanas = options.duracao_semanas ?? 8

    if (!nivel || !objetivo) {
      throw ApiError.badRequest('Nível e objetivo são obrigatórios')
    }

    const template = await workoutRepository.getTemplate(nivel, objetivo)
    if (!template) {
      throw ApiError.notFound(
        'Nenhum template de treino encontrado para essa combinação de nível e objetivo'
      )
    }

    const nomeObjetivo = OBJETIVO_LABELS[objetivo] ?? objetivo
    const nomeNivel = NIVEL_LABELS[nivel] ?? nivel

    const plan = await workoutRepository.createPlan({
      user_id: userId,
      nome: `${nomeObjetivo} — ${nomeNivel}`,
      objetivo: objetivo as any,
      nivel: nivel as any,
      duracao_semanas,
      ativo: true,
      criado_em: new Date().toISOString(),
    })

    // Copia sessões e exercícios do template para o plano do usuário
    const templateSessions = await workoutRepository.getTemplateSessions(template.id)
    for (const tSession of templateSessions) {
      const session = await workoutRepository.createSession({
        plano_treino_id: plan.id,
        nome: tSession.nome,
        ordem: tSession.ordem,
      } as any)

      const tExercises = await workoutRepository.getTemplateSessionExercises(tSession.id)
      for (const tEx of tExercises) {
        await workoutRepository.addExerciseToSession({
          sessao_id: session.id,
          exercicio_id: tEx.exercicio_id,
          series: tEx.series,
          repeticoes: tEx.repeticoes,
          descanso_s: tEx.descanso_s,
          carga_sugerida: tEx.carga_sugerida,
          ordem: tEx.ordem,
        } as any)
      }
    }

    // Garante que apenas o plano recém-gerado fique ativo
    await workoutRepository.setActivePlan(userId, plan.id)

    return await this.getWorkoutPlan(plan.id)
  }

  // Dados do plano ativo do usuário + sessões concluídas hoje (Dashboard)
  async getActivePlan(userId: string): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const active = await workoutRepository.getActivePlan(userId)
    if (!active) {
      return null
    }

    const plan = await this.getWorkoutPlan(active.id)
    const completedToday = await workoutRepository.getCompletedSessionsToday(userId)
    const completedSessionIds = completedToday
      .map((t) => t.sessao_id)
      .filter((id): id is string => Boolean(id))

    return {
      ...plan,
      completedSessionIds,
    }
  }

  async setActivePlan(userId: string, planId: string): Promise<any> {
    const plan = await workoutRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano de treino não encontrado')
    }

    await workoutRepository.setActivePlan(userId, planId)
    return await this.getActivePlan(userId)
  }

  // Registra a conclusão de uma sessão de treino
  async completeSession(
    userId: string,
    data: { plano_treino_id?: string; sessao_id: string; duracao_min?: number; observacao?: string }
  ): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    if (!data.sessao_id) {
      throw ApiError.badRequest('sessao_id é obrigatório')
    }

    const session = await workoutRepository.getSessionById(data.sessao_id)
    if (!session) {
      throw ApiError.notFound('Sessão de treino não encontrada')
    }

    return await workoutRepository.registerWorkout({
      user_id: userId,
      plano_treino_id: data.plano_treino_id ?? session.plano_treino_id,
      sessao_id: data.sessao_id,
      data_treino: new Date().toISOString(),
      duracao_min: data.duracao_min,
      observacao: data.observacao,
    } as any)
  }
}

export const workoutService = new WorkoutService()
