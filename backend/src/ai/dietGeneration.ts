import { userRepository } from '../repositories/userRepository'
import { profileRepository } from '../repositories/profileRepository'
import { ApiError } from '../utils/apiError'
import { generateDietPlan, type DietPreferences } from './dietAIService'
import { assertNoActiveDiet } from './dietValidation'

export async function generateDietAIPlan(
  userId: string,
  preferences: DietPreferences
): Promise<any> {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  await assertNoActiveDiet(userId)

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
