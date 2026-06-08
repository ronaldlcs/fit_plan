-- ============================================================
-- FITPLAN — Treino: base + Templates + colunas de execução/ativo
-- Migration idempotente e auto-suficiente.
-- Cria as tabelas base de treino se faltarem, semeia o catálogo
-- de exercícios se estiver vazio e então cria os templates.
-- Pré-requisito: enums já existentes (objetivo_enum, nivel_enum,
-- dia_semana_enum) — criados pelo database/init.sql.
-- Pode ser rodada várias vezes sem quebrar dados existentes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 0a. Correção de nomenclatura: o banco tem 'sessao_exercicios'
--     (singular), mas todo o código usa 'sessoes_exercicios'
--     (plural). Renomeia só se a versão plural ainda não existir.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'sessao_exercicios'
     )
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'sessoes_exercicios'
     )
  THEN
    ALTER TABLE sessao_exercicios RENAME TO sessoes_exercicios;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 0. Tabelas base de treino (criadas só se ainda não existirem)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS grupos_musculares (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS exercicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    grupo_muscular_id INTEGER REFERENCES grupos_musculares(id),
    equipamento VARCHAR(80),
    nivel nivel_enum DEFAULT 'iniciante',
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos_treino (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(120),
    objetivo objetivo_enum,
    nivel nivel_enum,
    duracao_semanas INTEGER DEFAULT 12,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessoes_treino (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plano_treino_id UUID REFERENCES planos_treino(id) ON DELETE CASCADE,
    nome VARCHAR(80),
    dia_semana dia_semana_enum,
    ordem INTEGER
);

CREATE TABLE IF NOT EXISTS sessoes_exercicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sessao_id UUID REFERENCES sessoes_treino(id) ON DELETE CASCADE,
    exercicio_id UUID REFERENCES exercicios(id),
    series INTEGER,
    repeticoes VARCHAR(20),
    descanso_s INTEGER DEFAULT 60,
    ordem INTEGER
);

CREATE TABLE IF NOT EXISTS treinos_realizados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plano_treino_id UUID REFERENCES planos_treino(id),
    data_treino DATE,
    duracao_min INTEGER,
    observacao TEXT
);

-- ------------------------------------------------------------
-- 1. Seed do catálogo (apenas se estiver vazio)
-- ------------------------------------------------------------

INSERT INTO grupos_musculares (nome)
SELECT v.nome
FROM (VALUES
  ('Peito'), ('Costas'), ('Ombros'), ('Bíceps'), ('Tríceps'),
  ('Abdômen'), ('Glúteos'), ('Quadríceps'), ('Posterior de Coxa'),
  ('Panturrilha'), ('Corpo Todo')
) AS v(nome)
WHERE NOT EXISTS (SELECT 1 FROM grupos_musculares);

INSERT INTO exercicios (nome, descricao, grupo_muscular_id, equipamento, nivel)
SELECT t.nome, t.descricao, g.id, t.equipamento, t.nivel::nivel_enum
FROM (VALUES
  ('Supino reto com barra', 'Exercicio composto para peitoral', 'Peito', 'barra', 'intermediario'),
  ('Flexao de bracos', 'Exercicio de peso corporal para peitoral e triceps', 'Peito', 'peso corporal', 'iniciante'),
  ('Remada curvada', 'Exercicio composto para costas', 'Costas', 'barra', 'intermediario'),
  ('Puxada na frente', 'Exercicio para dorsais', 'Costas', 'polia', 'iniciante'),
  ('Desenvolvimento militar', 'Exercicio para ombros', 'Ombros', 'halteres', 'intermediario'),
  ('Rosca direta', 'Exercicio isolado para biceps', 'Bíceps', 'barra', 'iniciante'),
  ('Triceps pulley', 'Exercicio isolado para triceps', 'Tríceps', 'polia', 'iniciante'),
  ('Prancha abdominal', 'Exercicio isometrico para core', 'Abdômen', 'peso corporal', 'iniciante'),
  ('Agachamento livre', 'Exercicio composto para quadriceps e gluteos', 'Quadríceps', 'barra', 'intermediario'),
  ('Levantamento terra romeno', 'Exercicio para posterior de coxa e gluteos', 'Posterior de Coxa', 'barra', 'avancado')
) AS t(nome, descricao, grupo, equipamento, nivel)
JOIN grupos_musculares g ON g.nome = t.grupo
WHERE NOT EXISTS (SELECT 1 FROM exercicios);

-- ------------------------------------------------------------
-- 2. Ajustes não destrutivos nas tabelas existentes
-- ------------------------------------------------------------

-- Plano ativo do usuário (refletido no Dashboard)
ALTER TABLE planos_treino
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT false;

-- Carga sugerida por exercício na sessão (ex: "Moderada", "12kg")
ALTER TABLE sessoes_exercicios
  ADD COLUMN IF NOT EXISTS carga_sugerida VARCHAR(40);

-- Vincular um treino realizado à sessão concluída (saber A/B/C concluída hoje)
ALTER TABLE treinos_realizados
  ADD COLUMN IF NOT EXISTS sessao_id UUID REFERENCES sessoes_treino(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 3. Tabelas de template (planos pré-cadastrados)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS templates_treino (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    objetivo objetivo_enum NOT NULL,
    nivel nivel_enum NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (objetivo, nivel)
);

CREATE TABLE IF NOT EXISTS templates_sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES templates_treino(id) ON DELETE CASCADE,
    nome VARCHAR(80),
    ordem INTEGER
);

CREATE TABLE IF NOT EXISTS templates_sessoes_exercicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_sessao_id UUID REFERENCES templates_sessoes(id) ON DELETE CASCADE,
    exercicio_id UUID REFERENCES exercicios(id),
    series INTEGER,
    repeticoes VARCHAR(20),
    descanso_s INTEGER DEFAULT 60,
    carga_sugerida VARCHAR(40),
    ordem INTEGER
);

-- ------------------------------------------------------------
-- 4. Seed dos templates (9 combinações: 3 níveis × 3 objetivos)
--    Idempotente: limpa e recria apenas as linhas de template.
-- ------------------------------------------------------------

TRUNCATE TABLE templates_treino RESTART IDENTITY CASCADE;

DO $$
DECLARE
  v_nivel       nivel_enum;
  v_obj         objetivo_enum;
  v_template_id UUID;
  v_sessao_id   UUID;
  v_series      INTEGER;
  v_reps        VARCHAR;
  v_descanso    INTEGER;
  v_carga       VARCHAR;
  v_obj_label   VARCHAR;
  v_nivel_label VARCHAR;
  niveis        nivel_enum[]    := ARRAY['iniciante','intermediario','avancado']::nivel_enum[];
  objetivos     objetivo_enum[] := ARRAY['hipertrofia','emagrecimento','condicionamento']::objetivo_enum[];
BEGIN
  FOREACH v_nivel IN ARRAY niveis LOOP
    FOREACH v_obj IN ARRAY objetivos LOOP

      -- Parâmetros de treino variam conforme o objetivo
      IF v_obj = 'hipertrofia' THEN
        v_series := 4; v_reps := '8-12'; v_descanso := 75; v_carga := 'Moderada a pesada';
        v_obj_label := 'Hipertrofia';
      ELSIF v_obj = 'emagrecimento' THEN
        v_series := 3; v_reps := '12-15'; v_descanso := 45; v_carga := 'Leve a moderada';
        v_obj_label := 'Emagrecimento';
      ELSE
        v_series := 3; v_reps := '15-20'; v_descanso := 30; v_carga := 'Leve';
        v_obj_label := 'Condicionamento';
      END IF;

      -- Iniciante treina com menos volume; avançado com mais
      IF v_nivel = 'iniciante' THEN
        v_series := GREATEST(v_series - 1, 2);
        v_nivel_label := 'Iniciante';
      ELSIF v_nivel = 'intermediario' THEN
        v_nivel_label := 'Intermediário';
      ELSE
        v_series := v_series + 1;
        v_nivel_label := 'Avançado';
      END IF;

      INSERT INTO templates_treino (nome, descricao, objetivo, nivel)
      VALUES (
        'Plano ' || v_obj_label || ' — ' || v_nivel_label,
        'Treino ABC focado em ' || lower(v_obj_label) || ' para nível ' || lower(v_nivel_label) || '.',
        v_obj, v_nivel
      )
      RETURNING id INTO v_template_id;

      -- ── Treino A — Peito e Tríceps ──
      INSERT INTO templates_sessoes (template_id, nome, ordem)
      VALUES (v_template_id, 'Treino A — Peito e Tríceps', 1)
      RETURNING id INTO v_sessao_id;

      INSERT INTO templates_sessoes_exercicios
        (template_sessao_id, exercicio_id, series, repeticoes, descanso_s, carga_sugerida, ordem)
      SELECT v_sessao_id, e.id, v_series, v_reps, v_descanso, v_carga, t.ord
      FROM (VALUES
        ('Supino reto com barra', 1),
        ('Flexao de bracos', 2),
        ('Desenvolvimento militar', 3),
        ('Triceps pulley', 4)
      ) AS t(nome, ord)
      JOIN exercicios e ON e.nome = t.nome;

      -- ── Treino B — Costas e Bíceps ──
      INSERT INTO templates_sessoes (template_id, nome, ordem)
      VALUES (v_template_id, 'Treino B — Costas e Bíceps', 2)
      RETURNING id INTO v_sessao_id;

      INSERT INTO templates_sessoes_exercicios
        (template_sessao_id, exercicio_id, series, repeticoes, descanso_s, carga_sugerida, ordem)
      SELECT v_sessao_id, e.id, v_series, v_reps, v_descanso, v_carga, t.ord
      FROM (VALUES
        ('Remada curvada', 1),
        ('Puxada na frente', 2),
        ('Rosca direta', 3)
      ) AS t(nome, ord)
      JOIN exercicios e ON e.nome = t.nome;

      -- ── Treino C — Pernas e Core ──
      INSERT INTO templates_sessoes (template_id, nome, ordem)
      VALUES (v_template_id, 'Treino C — Pernas e Core', 3)
      RETURNING id INTO v_sessao_id;

      INSERT INTO templates_sessoes_exercicios
        (template_sessao_id, exercicio_id, series, repeticoes, descanso_s, carga_sugerida, ordem)
      SELECT v_sessao_id, e.id, v_series, v_reps, v_descanso, v_carga, t.ord
      FROM (VALUES
        ('Agachamento livre', 1),
        ('Levantamento terra romeno', 2),
        ('Prancha abdominal', 3)
      ) AS t(nome, ord)
      JOIN exercicios e ON e.nome = t.nome;

    END LOOP;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5. Índices úteis
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_planos_treino_ativo ON planos_treino (user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_treinos_realizados_sessao ON treinos_realizados (sessao_id);
