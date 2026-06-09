import { Request, Response, NextFunction } from 'express'
import { workoutService } from '../services/workoutService'
import { ApiError } from '../utils/apiError'

export class WorkoutController {
  async createWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const planData = req.body

      const plan = await workoutService.createWorkoutPlan(userId, planData)

      res.status(201).json({
        message: 'Plano de treino criado com sucesso',
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  async getWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params

      const plan = await workoutService.getWorkoutPlan(planId)

      res.json(plan)
    } catch (error) {
      next(error)
    }
  }

  async getUserWorkoutPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const plans = await workoutService.getUserWorkoutPlans(userId)

      res.json(plans)
    } catch (error) {
      next(error)
    }
  }

  async updateWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params
      const updates = req.body

      const plan = await workoutService.updateWorkoutPlan(planId, updates)

      res.json({
        message: 'Plano de treino atualizado com sucesso',
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params

      await workoutService.deleteWorkoutPlan(planId)

      res.json({
        message: 'Plano de treino deletado com sucesso',
      })
    } catch (error) {
      next(error)
    }
  }

  async addSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params
      const sessionData = req.body

      const session = await workoutService.addSession(planId, sessionData)

      res.status(201).json({
        message: 'Sessão de treino adicionada com sucesso',
        session,
      })
    } catch (error) {
      next(error)
    }
  }

  async removeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params

      await workoutService.removeSession(sessionId)

      res.json({
        message: 'Sessão de treino removida com sucesso',
      })
    } catch (error) {
      next(error)
    }
  }

  async addExerciseToSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params
      const exerciseData = req.body

      const exercise = await workoutService.addExerciseToSession(sessionId, exerciseData)

      res.status(201).json({
        message: 'Exercício adicionado à sessão com sucesso',
        exercise,
      })
    } catch (error) {
      next(error)
    }
  }

  async removeExerciseFromSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionExerciseId } = req.params

      await workoutService.removeExerciseFromSession(sessionExerciseId)

      res.json({
        message: 'Exercício removido da sessão com sucesso',
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllExercises(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercises = await workoutService.getAllExercises()

      res.json(exercises)
    } catch (error) {
      next(error)
    }
  }

  async filterExercises(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query

      const exercises = await workoutService.filterExercises(filters as any)

      res.json(exercises)
    } catch (error) {
      next(error)
    }
  }

  async registerWorkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const workoutData = req.body

      const workout = await workoutService.registerWorkout(userId, workoutData)

      res.status(201).json({
        message: 'Treino registrado com sucesso',
        workout,
      })
    } catch (error) {
      next(error)
    }
  }

  async getUserWorkouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const workouts = await workoutService.getUserWorkouts(userId)

      res.json(workouts)
    } catch (error) {
      next(error)
    }
  }

  async generatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const { preferences } = req.body

      const plan = await workoutService.generatePlanFromTemplate(userId, {
        nivel: preferences?.nivel,
        objetivo: preferences?.objetivo,
        duracao_semanas: preferences?.duracao_semanas,
      })

      res.status(201).json({
        message: 'Plano de treino gerado com sucesso',
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  async getActivePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const plan = await workoutService.getActivePlan(userId)

      res.json(plan)
    } catch (error) {
      next(error)
    }
  }

  async setActivePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const { planId } = req.params

      const plan = await workoutService.setActivePlan(userId, planId)

      res.json({
        message: 'Plano de treino ativado com sucesso',
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  async completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const { sessionId } = req.params
      const { plano_treino_id, duracao_min, observacao } = req.body

      const workout = await workoutService.completeSession(userId, {
        sessao_id: sessionId,
        plano_treino_id,
        duracao_min,
        observacao,
      })

      res.status(201).json({
        message: 'Sessão concluída e registrada com sucesso',
        workout,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const workoutController = new WorkoutController()
