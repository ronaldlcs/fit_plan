import { Request, Response, NextFunction } from 'express'
import { dietService } from '../services/dietService'
import { ApiError } from '../utils/apiError'

export class DietController {
  async createDietPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const planData = req.body

      const plan = await dietService.createDietPlan(userId, planData)

      res.status(201).json({
        message: 'Plano alimentar criado com sucesso',
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  async getDietPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params

      const plan = await dietService.getDietPlan(planId)

      res.json(plan)
    } catch (error) {
      next(error)
    }
  }

  async getUserDietPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const plans = await dietService.getUserDietPlans(userId)

      res.json(plans)
    } catch (error) {
      next(error)
    }
  }

  async updateDietPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params
      const updates = req.body

      const plan = await dietService.updateDietPlan(planId, updates)

      res.json({
        message: 'Plano alimentar atualizado com sucesso',
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteDietPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params

      await dietService.deleteDietPlan(planId)

      res.json({
        message: 'Plano alimentar deletado com sucesso',
      })
    } catch (error) {
      next(error)
    }
  }

  async addMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params
      const mealData = req.body

      const meal = await dietService.addMeal(planId, mealData)

      res.status(201).json({
        message: 'Refeição adicionada com sucesso',
        meal,
      })
    } catch (error) {
      next(error)
    }
  }

  async removeMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mealId } = req.params

      await dietService.removeMeal(mealId)

      res.json({
        message: 'Refeição removida com sucesso',
      })
    } catch (error) {
      next(error)
    }
  }

  async addFoodToMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mealId } = req.params
      const { foodId, quantidade_g } = req.body

      if (!foodId || !quantidade_g) {
        throw ApiError.badRequest('foodId e quantidade_g são obrigatórios')
      }

      const mealFood = await dietService.addFoodToMeal(mealId, foodId, quantidade_g)

      res.status(201).json({
        message: 'Alimento adicionado à refeição com sucesso',
        mealFood,
      })
    } catch (error) {
      next(error)
    }
  }

  async removeFoodFromMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mealFoodId } = req.params

      await dietService.removeFoodFromMeal(mealFoodId)

      res.json({
        message: 'Alimento removido da refeição com sucesso',
      })
    } catch (error) {
      next(error)
    }
  }

  async searchFoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query

      if (!search || typeof search !== 'string') {
        throw ApiError.badRequest('Parâmetro search é obrigatório')
      }

      const foods = await dietService.searchFoods(search)

      res.json(foods)
    } catch (error) {
      next(error)
    }
  }

  async getAllFoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const foods = await dietService.getAllFoods()

      res.json(foods)
    } catch (error) {
      next(error)
    }
  }

  async addProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const { peso_kg, observacao } = req.body

      if (!peso_kg) {
        throw ApiError.badRequest('peso_kg é obrigatório')
      }

      const progress = await dietService.addProgress(userId, peso_kg, observacao)

      res.status(201).json({
        message: 'Progresso registrado com sucesso',
        progress,
      })
    } catch (error) {
      next(error)
    }
  }

  async getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const progress = await dietService.getUserProgress(userId)

      res.json(progress)
    } catch (error) {
      next(error)
    }
  }

  async generateDietAI(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      if (!userId) {
        throw ApiError.unauthorized('Usuário não autenticado')
      }

      const { preferences } = req.body

      const result = await dietService.generateDietAIPlan(userId, {
        culinaria: preferences?.culinaria ?? [],
        restricoes: preferences?.restricoes ?? [],
        refeicoes_por_dia: preferences?.refeicoes_por_dia ?? 5,
      })

      res.status(201).json({
        message: 'Plano alimentar gerado com sucesso',
        plan: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const dietController = new DietController()
