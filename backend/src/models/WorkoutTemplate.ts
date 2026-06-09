import { Objetivo, Nivel } from './User'
import { Exercicio } from './Exercicio'

export interface TemplateTreino {
  id: string
  nome: string
  descricao: string | null
  objetivo: Objetivo
  nivel: Nivel
  criado_em: string
}

export interface TemplateSessao {
  id: string
  template_id: string
  nome: string | null
  ordem: number | null
}

export interface TemplateSessaoExercicio {
  id: string
  template_sessao_id: string
  exercicio_id: string
  series: number | null
  repeticoes: string | null
  descanso_s: number
  carga_sugerida: string | null
  ordem: number | null
}

// Relacionamentos

export type TemplateSessaoExercicioComDetalhes = TemplateSessaoExercicio & {
  exercicio: Exercicio | null
}

export type TemplateSessaoCompleta = TemplateSessao & {
  exercicios: TemplateSessaoExercicioComDetalhes[]
}

export type TemplateTreinoCompleto = TemplateTreino & {
  sessoes: TemplateSessaoCompleta[]
}
