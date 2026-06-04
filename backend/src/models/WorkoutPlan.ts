import { Objetivo, Nivel } from './User'
import { Exercicio } from './Exercicio'

export type DiaSemana =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo'

export interface PlanoTreino {
  id: string
  user_id: string
  nome: string | null
  objetivo: Objetivo | null
  nivel: Nivel | null
  duracao_semanas: number
  ativo: boolean
  criado_em: string
}

export interface SessaoTreino {
  id: string
  plano_treino_id: string
  nome: string | null
  dia_semana: DiaSemana | null
  ordem: number | null
}

export interface SessaoExercicio {
  id: string
  sessao_id: string
  exercicio_id: string
  series: number | null
  repeticoes: string | null
  descanso_s: number
  carga_sugerida: string | null
  ordem: number | null
}

export interface TreinoRealizado {
  id: string
  user_id: string
  plano_treino_id: string | null
  sessao_id: string | null
  data_treino: string
  duracao_min: number | null
  observacao: string | null
}

// Relacionamentos

export type SessaoExercicioComDetalhes = SessaoExercicio & {
  exercicio: Exercicio
}

export type SessaoTreinoComExercicios = SessaoTreino & {
  exercicios: SessaoExercicioComDetalhes[]
}

export type PlanoTreinoCompleto = PlanoTreino & {
  sessoes: SessaoTreinoComExercicios[]
}

// DTOs de criação

export type CreatePlanoTreinoDTO = {
  user_id: string
  nome?: string
  objetivo?: Objetivo
  nivel?: Nivel
  duracao_semanas?: number
}

export type CreateSessaoTreinoDTO = {
  plano_treino_id: string
  nome?: string
  dia_semana?: DiaSemana
  ordem?: number
}

export type CreateSessaoExercicioDTO = {
  sessao_id: string
  exercicio_id: string
  series?: number
  repeticoes?: string
  descanso_s?: number
  ordem?: number
}

export type CreateTreinoRealizadoDTO = {
  user_id: string
  plano_treino_id?: string
  data_treino: string
  duracao_min?: number
  observacao?: string
}

// DTOs de atualização

export type UpdatePlanoTreinoDTO = Partial<{
  nome: string
  objetivo: Objetivo
  nivel: Nivel
  duracao_semanas: number
}>

export type UpdateSessaoTreinoDTO = Partial<{
  nome: string
  dia_semana: DiaSemana
  ordem: number
}>

export type UpdateSessaoExercicioDTO = Partial<{
  exercicio_id: string
  series: number
  repeticoes: string
  descanso_s: number
  ordem: number
}>

export type UpdateTreinoRealizadoDTO = Partial<{
  plano_treino_id: string
  data_treino: string
  duracao_min: number
  observacao: string
}>

// Filtros e relatórios

export type FiltroTreinoRealizadoDTO = {
  user_id: string
  plano_treino_id?: string
  data_inicio?: string
  data_fim?: string
}

export type ResumoTreinos = {
  total_treinos: number
  duracao_media_min: number
  ultimo_treino: string | null
}