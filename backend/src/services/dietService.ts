import { dietRepository } from '../repositories/dietRepository'
import { userRepository } from '../repositories/userRepository'
import { profileRepository } from '../repositories/profileRepository'
import { ApiError } from '../utils/apiError'
import { generateDietPlan, type DietPreferences } from '../ai/dietAIService'

export class DietService {
  async createDietPlan(userId: string, planData: any): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const plan = await dietRepository.createPlan({
      user_id: userId,
      ...planData,
      criado_em: new Date().toISOString(),
    })

    return plan
  }

  async getDietPlan(planId: string): Promise<any> {
    const plan = await dietRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano alimentar não encontrado')
    }

    const meals = await dietRepository.getMealsByPlan(planId)
    const mealsWithFoods = await Promise.all(
      meals.map(async (meal) => {
        const foods = await dietRepository.getMealFoods(meal.id)
        return { ...meal, alimentos: foods }
      })
    )

    return {
      ...plan,
      refeicoes: mealsWithFoods,
    }
  }

  async getUserDietPlans(userId: string): Promise<any[]> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    return await dietRepository.getUserPlans(userId)
  }

  async updateDietPlan(planId: string, updates: any): Promise<any> {
    const plan = await dietRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano alimentar não encontrado')
    }

    return await dietRepository.updatePlan(planId, updates)
  }

  async deleteDietPlan(planId: string): Promise<void> {
    const plan = await dietRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano alimentar não encontrado')
    }

    await dietRepository.deletePlan(planId)
  }

  async addMeal(planId: string, mealData: any): Promise<any> {
    const plan = await dietRepository.getPlanById(planId)
    if (!plan) {
      throw ApiError.notFound('Plano alimentar não encontrado')
    }

    return await dietRepository.createMeal({
      plano_id: planId,
      ...mealData,
    })
  }

  async removeMeal(mealId: string): Promise<void> {
    await dietRepository.deleteMeal(mealId)
  }

  async addFoodToMeal(mealId: string, foodId: string, quantidade_g: number): Promise<any> {
    const food = await dietRepository.getFoodById(foodId)
    if (!food) {
      throw ApiError.notFound('Alimento não encontrado')
    }

    return await dietRepository.addFoodToMeal({
      refeicao_id: mealId,
      alimento_id: foodId,
      quantidade_g,
    })
  }

  async removeFoodFromMeal(mealFoodId: string): Promise<void> {
    await dietRepository.removeFoodFromMeal(mealFoodId)
  }

  async searchFoods(searchTerm: string): Promise<any[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return []
    }

    return await dietRepository.searchFoods(searchTerm)
  }

  async getAllFoods(): Promise<any[]> {
    return await dietRepository.getAllFoods()
  }

  async addProgress(userId: string, peso_kg: number, observacao?: string): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    return await dietRepository.addProgress({
      user_id: userId,
      peso_kg,
      observacao,
      data_registro: new Date().toISOString(),
    })
  }

  async getUserProgress(userId: string): Promise<any[]> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    return await dietRepository.getUserProgress(userId)
  }

  async generateDietAIPlan(userId: string, preferences: DietPreferences): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const profile = await profileRepository.findByUserId(userId)

    const today = new Date()
    let idade = 25
    if (profile?.data_nascimento) {
      const birth = new Date(profile.data_nascimento)
      idade = today.getFullYear() - birth.getFullYear()
      if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
      ) {
        idade--
      }
    }

    const userProfileInput = {
      peso_kg: profile?.peso_kg ?? 70,
      altura_cm: profile?.altura_cm ?? 170,
      idade,
      sexo: profile?.sexo ?? 'masculino',
      objetivo: profile?.objetivo ?? 'manutencao',
      nivel: profile?.nivel ?? 'intermediario',
    }

    const generated = await generateDietPlan(userProfileInput, preferences)

    const savedPlan = await dietRepository.createPlan({
      user_id: userId,
      nome: generated.planName,
      objetivo: userProfileInput.objetivo as any,
      calorias_alvo: generated.dailyCalories,
      criado_em: new Date().toISOString(),
    })

    return { ...savedPlan, preview: generated }
  }
}

export const dietService = new DietService()
