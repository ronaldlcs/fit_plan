import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Play,
  Weight,
  Ruler,
  Target,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { getUserProfile } from "../../../services/userService";
import type {
  GenerateWorkoutPreferences,
  SessionExerciseDetail,
  WorkoutPlan,
  WorkoutSession,
} from "../../../types/workout";
import type { UserProfile } from "../../../types/user";

interface GenerateWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prefs: GenerateWorkoutPreferences) => Promise<WorkoutPlan>;
  onStartSession?: (plan: WorkoutPlan, session: WorkoutSession) => void;
}

const NIVEL_OPTIONS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const OBJETIVO_OPTIONS = [
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "condicionamento", label: "Condicionamento" },
];

const DURACAO_OPTIONS = [
  { value: 4, label: "4 semanas" },
  { value: 8, label: "8 semanas" },
  { value: 12, label: "12 semanas" },
];

const LOADING_MESSAGES = [
  "Analisando seu perfil...",
  "Selecionando os melhores exercícios...",
  "Montando suas sessões A, B e C...",
  "Ajustando séries e cargas...",
  "Finalizando seu plano personalizado...",
];

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: any) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function GenerateWorkoutModal({ open, onOpenChange, onGenerate, onStartSession }: GenerateWorkoutModalProps) {
  const [nivel, setNivel] = useState("iniciante");
  const [objetivo, setObjetivo] = useState("hipertrofia");
  const [duracao, setDuracao] = useState(8);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [generated, setGenerated] = useState<WorkoutPlan | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const msgInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;

    // Reseta o estado e pré-preenche com o perfil do usuário
    setGenerated(null);
    setNivel("iniciante");
    setObjetivo("hipertrofia");
    setDuracao(8);

    let active = true;
    setProfileLoading(true);
    getUserProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        if (data?.nivel) setNivel(data.nivel);
        if (data?.objetivo && OBJETIVO_OPTIONS.some((o) => o.value === data.objetivo)) {
          setObjetivo(data.objetivo);
        }
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (msgInterval.current) clearInterval(msgInterval.current);
    };
  }, []);

  const startLoadingMessages = () => {
    let i = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    msgInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 1600);
  };

  const stopLoadingMessages = () => {
    if (msgInterval.current) clearInterval(msgInterval.current);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(null);
    startLoadingMessages();
    const startedAt = Date.now();
    try {
      const plan = await onGenerate({ nivel, objetivo, duracao_semanas: duracao });
      // Garante a sensação de "gerando agora" mesmo se o backend responder rápido
      const elapsed = Date.now() - startedAt;
      if (elapsed < 2400) {
        await new Promise((r) => setTimeout(r, 2400 - elapsed));
      }
      setGenerated(plan);
      setExpandedSession(plan.sessoes?.[0]?.id ?? null);
    } finally {
      stopLoadingMessages();
      setLoading(false);
    }
  };

  const sessions = generated?.sessoes ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Plano de Treino
          </DialogTitle>
          <DialogDescription>
            Escolha suas preferências e gere um plano de treino personalizado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {!generated && (
            <>
              {/* Nível */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /> Nível
                </Label>
                <OptionGrid options={NIVEL_OPTIONS} value={nivel} onChange={setNivel} />
              </div>

              {/* Objetivo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-muted-foreground" /> Objetivo
                </Label>
                <OptionGrid options={OBJETIVO_OPTIONS} value={objetivo} onChange={setObjetivo} />
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label>Duração</Label>
                <OptionGrid options={DURACAO_OPTIONS} value={duracao} onChange={setDuracao} />
              </div>

              {/* Dados do perfil (somente leitura) */}
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Dados que serão usados na geração
                </p>
                {profileLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : profile ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 rounded-lg bg-background p-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Weight className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Peso</p>
                        <p className="text-sm font-semibold text-foreground">{profile.peso_kg} kg</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg bg-background p-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Altura</p>
                        <p className="text-sm font-semibold text-foreground">{profile.altura_cm} cm</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Complete seu perfil para usar peso e altura na geração. O plano será gerado mesmo assim.
                  </p>
                )}
              </div>

              <Button className="w-full gap-2" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {loadingMsg}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Plano
                  </>
                )}
              </Button>
            </>
          )}

          {/* Plano gerado (revelação) */}
          {generated && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">{generated.nome ?? "Plano gerado"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sessions.length} sessões · {generated.duracao_semanas} semanas · {generated.objetivo}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setGenerated(null)}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Gerar de novo
                </Button>
              </div>

              <div className="space-y-2">
                {sessions.map((session) => {
                  const exercicios: SessionExerciseDetail[] = session.exercicios ?? [];
                  const isExpanded = expandedSession === session.id;
                  return (
                    <div key={session.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{session.nome ?? `Sessão ${session.ordem}`}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {exercicios.length} exercícios
                          </Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-1.5 border-t border-border bg-muted/20">
                          {exercicios.map((ex) => (
                            <div
                              key={ex.id}
                              className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                            >
                              <p className="text-xs font-medium text-foreground">
                                {ex.exercicio?.nome ?? "Exercício"}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{ex.series}x{ex.repeticoes}</span>
                                {ex.carga_sugerida && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {ex.carga_sugerida}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {onStartSession && (
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs gap-1 mt-2"
                              onClick={() => onStartSession(generated, session)}
                            >
                              <Play className="w-3 h-3" /> Iniciar esta sessão
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => onOpenChange(false)}>
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
