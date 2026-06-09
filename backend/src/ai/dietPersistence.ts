import { dietRepository } from '../repositories/dietRepository'
import { userRepository } from '../repositories/userRepository'
import { profileRepository } from '../repositories/profileRepository'
import { ApiError } from '../utils/apiError'
import type { GeneratedDietPlan } from './dietAIService'
import type {
  TipoRefeicao,
  RefeicaoAlimento,
  Alimento,
  RefeicaoAlimentoComDetalhes,
} from '../models/DietPlan'
import { assertNoActiveDiet } from './dietValidation'

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

type MealFoodWithAlimento = RefeicaoAlimento & { alimento: Alimento | null }

const calculateMacroTotal = (value: number | null, quantidade_g: number | null): number | null => {
  if (value === null || value === undefined) return null
  if (!quantidade_g || !Number.isFinite(quantidade_g) || quantidade_g <= 0) return value
  return Number((value * (quantidade_g / 100)).toFixed(2))
}

const buildMealFoodDetails = (food: MealFoodWithAlimento): RefeicaoAlimentoComDetalhes => {
  const alimento = food.alimento ?? {
    id: food.alimento_id,
    nome: 'Alimento',
    calorias: null,
    proteinas_g: null,
    carboidratos_g: null,
    gorduras_g: null,
  }

  return {
    ...food,
    alimento,
    calorias_total: calculateMacroTotal(alimento.calorias, food.quantidade_g ?? null),
    proteinas_total: calculateMacroTotal(alimento.proteinas_g, food.quantidade_g ?? null),
    carboidratos_total: calculateMacroTotal(alimento.carboidratos_g, food.quantidade_g ?? null),
    gorduras_total: calculateMacroTotal(alimento.gorduras_g, food.quantidade_g ?? null),
  }
}

export async function createDietPlan(userId: string, planData: any): Promise<any> {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  await assertNoActiveDiet(userId)

  const plan = await dietRepository.createPlan({
    user_id: userId,
    ...planData,
    criado_em: new Date().toISOString(),
  })

  return plan
}

export async function getDietPlan(planId: string): Promise<any> {
  const plan = await dietRepository.getPlanById(planId)
  if (!plan) {
    throw ApiError.notFound('Plano alimentar não encontrado')
  }

  const meals = await dietRepository.getMealsByPlan(planId)
  const mealsWithFoods = await Promise.all(
    meals.map(async (meal) => {
      const foods = await dietRepository.getMealFoods(meal.id)
      const foodsWithDetails = foods.map(buildMealFoodDetails)
      return { ...meal, alimentos: foodsWithDetails }
    })
  )

  return {
    ...plan,
    refeicoes: mealsWithFoods,
  }
}

export async function getUserDietPlans(userId: string): Promise<any[]> {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  return await dietRepository.getUserPlans(userId)
}

export async function updateDietPlan(planId: string, updates: any): Promise<any> {
  const plan = await dietRepository.getPlanById(planId)
  if (!plan) {
    throw ApiError.notFound('Plano alimentar não encontrado')
  }

  return await dietRepository.updatePlan(planId, updates)
}

export async function deleteDietPlan(planId: string): Promise<void> {
  const plan = await dietRepository.getPlanById(planId)
  if (!plan) {
    throw ApiError.notFound('Plano alimentar não encontrado')
  }

  await dietRepository.deletePlan(planId)
}

export async function addMeal(planId: string, mealData: any): Promise<any> {
  const plan = await dietRepository.getPlanById(planId)
  if (!plan) {
    throw ApiError.notFound('Plano alimentar não encontrado')
  }

  return await dietRepository.createMeal({
    plano_id: planId,
    ...mealData,
  })
}

export async function removeMeal(mealId: string): Promise<void> {
  await dietRepository.deleteMeal(mealId)
}

export async function addFoodToMeal(
  mealId: string,
  foodId: string,
  quantidade_g: number
): Promise<any> {
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

export async function removeFoodFromMeal(mealFoodId: string): Promise<void> {
  await dietRepository.removeFoodFromMeal(mealFoodId)
}

export async function searchFoods(searchTerm: string): Promise<any[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return []
  }

  return await dietRepository.searchFoods(searchTerm)
}

export async function getAllFoods(): Promise<any[]> {
  return await dietRepository.getAllFoods()
}

export async function addProgress(
  userId: string,
  peso_kg: number,
  observacao?: string
): Promise<any> {
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

export async function getUserProgress(userId: string): Promise<any[]> {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  return await dietRepository.getUserProgress(userId)
}

export async function saveGeneratedDietPlan(
  userId: string,
  generated: GeneratedDietPlan
): Promise<any> {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  await assertNoActiveDiet(userId)

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

  return await getDietPlan(plan.id)
}
