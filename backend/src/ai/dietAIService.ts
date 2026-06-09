import { ChatGroq } from '@langchain/groq'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { SYSTEM_PROMPT } from './dietPrompt'

export interface UserProfileInput {
  peso_kg: number
  altura_cm: number
  idade: number
  sexo: string
  objetivo: string
  nivel: string
  tdee?: number
}

export interface DietPreferences {
  culinaria: string[]
  restricoes: string[]
  refeicoes_por_dia: number
}

export interface GeneratedFood {
  nome: string
  quantidade: string
  calorias: number
  proteina: number
  carbs: number
  gordura: number
}

export interface GeneratedMeal {
  nome: string
  horario: string
  calorias: number
  alimentos: GeneratedFood[]
}

export interface GeneratedDietPlan {
  planName: string
  dailyCalories: number
  macros: { protein: number; carbs: number; fat: number }
  meals: GeneratedMeal[]
  notes: string
}

const OBJETIVO_LABELS: Record<string, string> = {
  hipertrofia: 'ganho de massa muscular',
  emagrecimento: 'perda de gordura',
  condicionamento: 'condicionamento físico',
  manutencao: 'manutenção do peso',
}

const NIVEL_LABELS: Record<string, string> = {
  iniciante: 'iniciante',
  intermediario: 'intermediário',
  avancado: 'avançado',
}


export async function generateDietPlan(
  userProfile: UserProfileInput,
  preferences: DietPreferences
): Promise<GeneratedDietPlan> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não configurada no ambiente')
  }

  const model = new ChatGroq({
    apiKey,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 4096,
  })

  const parser = new JsonOutputParser<GeneratedDietPlan>()

  const culinaria = preferences.culinaria.length > 0
    ? preferences.culinaria.join(', ')
    : 'brasileira'

  const restricoes = preferences.restricoes.length > 0
    ? `Restrições alimentares: ${preferences.restricoes.join(', ')}.`
    : 'Sem restrições alimentares.'

  const objetivo = OBJETIVO_LABELS[userProfile.objetivo] ?? userProfile.objetivo
  const nivel = NIVEL_LABELS[userProfile.nivel] ?? userProfile.nivel
  const imc = (userProfile.peso_kg / Math.pow(userProfile.altura_cm / 100, 2)).toFixed(1)
  const caloriasMeta = userProfile.tdee
    ? Math.round(
        userProfile.objetivo === 'emagrecimento'
          ? userProfile.tdee - 400
          : userProfile.objetivo === 'hipertrofia'
          ? userProfile.tdee + 300
          : userProfile.tdee
      )
    : 2200

  const humanPrompt = `Crie um plano alimentar completo para uma pessoa com as seguintes características:

- Sexo: ${userProfile.sexo}
- Idade: ${userProfile.idade} anos
- Peso: ${userProfile.peso_kg}kg
- Altura: ${userProfile.altura_cm}cm
- IMC: ${imc}
- Objetivo: ${objetivo}
- Nível de atividade: ${nivel}
- Meta calórica estimada: ${caloriasMeta} kcal/dia
- Número de refeições: ${preferences.refeicoes_por_dia}
- Culinária preferida: ${culinaria}
- ${restricoes}

Crie ${preferences.refeicoes_por_dia} refeições distribuídas ao longo do dia, com alimentos típicos da culinária ${culinaria} e adequados ao objetivo de ${objetivo}.`

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(humanPrompt),
  ]

  try {
    const response = await model.invoke(messages)
    const text = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    const parsed = await parser.invoke(text)
    return parsed
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('A IA retornou uma resposta inválida. Tente novamente.')
    }
    throw err
  }
}
