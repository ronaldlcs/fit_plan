import { dietRepository } from '../repositories/dietRepository'
import { ApiError } from '../utils/apiError'

export const ACTIVE_DIET_PLAN_MESSAGE =
  'Você já possui um plano alimentar ativo. Remova o atual para criar um novo.'

export async function assertNoActiveDiet(userId: string): Promise<void> {
  const plans = await dietRepository.getUserPlans(userId)
  if (plans.length > 0) {
    throw ApiError.conflict(ACTIVE_DIET_PLAN_MESSAGE)
  }
}
