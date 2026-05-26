import { dietRepository } from '../repositories/dietRepository'
import { userRepository } from '../repositories/userRepository'
import { profileRepository } from '../repositories/profileRepository'
import { ApiError } from '../utils/apiError'
import { generateDietPlan, type DietPreferences, type GeneratedDietPlan } from '../ai/dietAIService'
import type { TipoRefeicao } from '../models/DietPlan'

const MEAL_TYPE_BY_INDEX: TipoRefeicao[] = [
  'cafe_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'jantar',
  'ceia',
]

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const inferMealType = (name: string | null | undefined, index: number): TipoRefeicao | null => {
  if (name) {
    const normalized = normalizeText(name)
    if (normalized.includes('cafe') && normalized.includes('manha')) return 'cafe_manha'
    if (normalized.includes('almoco')) return 'almoco'
    if (normalized.includes('jantar')) return 'jantar'
    if (normalized.includes('ceia')) return 'ceia'
    if (normalized.includes('lanche') && normalized.includes('manha')) return 'lanche_manha'
    if (normalized.includes('lanche') && normalized.includes('tarde')) return 'lanche_tarde'
    if (normalized.includes('lanche')) {
      return MEAL_TYPE_BY_INDEX[index] ?? 'lanche_tarde'
    }
  }

  return MEAL_TYPE_BY_INDEX[index] ?? null
}

const parseTime = (value: string | null | undefined): string | null => {
  if (!value) return null
  const match = value.match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = match[1].padStart(2, '0')
  const minutes = match[2]
  return `${hours}:${minutes}`
}

const parseQuantityGrams = (value: string | null | undefined): number | null => {
  if (!value) return null
  const normalized = value.toLowerCase().replace(',', '.')
  const match = normalized.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  if (normalized.includes('kg')) return amount * 1000
  return amount
}

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

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

  async saveGeneratedDietPlan(userId: string, generated: GeneratedDietPlan): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const profile = await profileRepository.findByUserId(userId)
    const objetivo = profile?.objetivo ?? 'manutencao'

    const planName = generated.planName?.trim()
    const plan = await dietRepository.createPlan({
      user_id: userId,
      nome: planName ? planName.slice(0, 120) : 'Plano IA',
      objetivo,
      calorias_alvo: Number.isFinite(generated.dailyCalories)
        ? Math.round(generated.dailyCalories)
        : null,
      criado_em: new Date().toISOString(),
    })

    const meals = generated.meals ?? []

    for (let index = 0; index < meals.length; index += 1) {
      const meal = meals[index]
      const createdMeal = await dietRepository.createMeal({
        plano_id: plan.id,
        tipo: inferMealType(meal.nome, index),
        horario: parseTime(meal.horario),
        ordem: index + 1,
      })

      const foods = meal.alimentos ?? []
      for (const food of foods) {
        const foodName = typeof food.nome === 'string' ? food.nome.trim() : ''
        if (!foodName) continue

        const existing = await dietRepository.getFoodByName(foodName)
        const alimento = existing
          ? existing
          : await dietRepository.createFood({
              nome: foodName,
              calorias: parseNumber(food.calorias),
              proteinas_g: parseNumber(food.proteina),
              carboidratos_g: parseNumber(food.carbs),
              gorduras_g: parseNumber(food.gordura),
            })

        await dietRepository.addFoodToMeal({
          refeicao_id: createdMeal.id,
          alimento_id: alimento.id,
          quantidade_g: parseQuantityGrams(food.quantidade),
        })
      }
    }

    return await this.getDietPlan(plan.id)
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

    try {
      const generated = await generateDietPlan(userProfileInput, preferences)
      return generated
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error
      }

      const message = typeof error?.message === 'string' ? error.message : ''

      if (message.includes('GROQ_API_KEY')) {
        throw ApiError.serviceUnavailable('GROQ_API_KEY não configurada no backend')
      }

      if (message.toLowerCase().includes('resposta inválida')) {
        throw ApiError.serviceUnavailable('A IA retornou uma resposta inválida. Tente novamente.')
      }

      throw ApiError.serviceUnavailable('Falha ao gerar plano com IA. Tente novamente.')
    }
  }
}

export const dietService = new DietService()
