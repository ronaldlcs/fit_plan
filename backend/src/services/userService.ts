import { User, UserResponse } from '../models/User'
import { userRepository } from '../repositories/userRepository'
import { profileRepository } from '../repositories/profileRepository'
import { profileService } from './profileService'
import { ApiError } from '../utils/apiError'

export class UserService {
  async getUserById(id: string): Promise<UserResponse> {
    const user = await userRepository.findById(id)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const { senha_hash: _, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await userRepository.findByEmail(email)
    if (!user) return null

    const { senha_hash: _, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  }

  async updateUser(id: string, updates: { nome?: string; email?: string }): Promise<UserResponse> {
    const user = await userRepository.findById(id)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    const updated = await userRepository.update(id, updates)
    const { senha_hash: _, ...userWithoutPassword } = updated
    return userWithoutPassword as UserResponse
  }

  async deleteUser(id: string): Promise<void> {
    const user = await userRepository.findById(id)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    // Deletar profile associado (se existir)
    const profile = await profileRepository.findByUserId(id)
    if (profile) {
      await profileRepository.delete(id)
    }

    // Deletar usuário
    await userRepository.delete(id)
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado')
    }

    // enrichProfileWithCalculations adiciona imc, tmb, tdee, idade
    const profile = await profileService.getProfile(userId)

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
      profile: profile || null,
    }
  }
}

export const userService = new UserService()
