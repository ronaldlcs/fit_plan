import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Flame,
  Dumbbell,
  Play,
  Plus,
  Star,
  Users,
  ChevronRight,
  Filter,
  Trash2,
  Pencil,
  ChevronDown,
  LayoutList,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Sparkles } from "lucide-react";
import { useWorkout } from "../../hooks/useWorkout";
import { getWorkoutPlan } from "../../services/workoutService";
import type { WorkoutPlan, WorkoutSession } from "../../types/workout";
import { WorkoutPlanModal, type PlanFormData } from "../components/workout/WorkoutPlanModal";
import { WorkoutSessionModal, type SessionFormData } from "../components/workout/WorkoutSessionModal";
import { ExercisePickerModal, type ExerciseConfig } from "../components/workout/ExercisePickerModal";
import { GenerateWorkoutModal } from "../components/workout/GenerateWorkoutModal";
import { WorkoutPlayerModal } from "../components/workout/WorkoutPlayerModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const DISCOVER_PLANS = [
  { id: 1, name: "Push Pull Legs", category: "Strength", duration: "60 min", calories: "450-550", level: "Intermediate", days: 6, rating: 4.8, enrolled: 2341, progress: 35, image: "https://images.unsplash.com/photo-1517963628607-235ccdd5476c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", color: "from-purple-900/70", tags: ["Hypertrophy", "Muscle Gain"], active: true },
  { id: 2, name: "HIIT Cardio Blast", category: "HIIT", duration: "30 min", calories: "300-400", level: "Advanced", days: 4, rating: 4.6, enrolled: 1820, progress: 0, image: "https://images.unsplash.com/photo-1724763750965-e61e1fe6a540?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", color: "from-red-900/70", tags: ["Fat Loss", "Endurance"], active: false },
  { id: 3, name: "Morning Yoga Flow", category: "Yoga", duration: "45 min", calories: "150-200", level: "Beginner", days: 5, rating: 4.9, enrolled: 3102, progress: 0, image: "https://images.unsplash.com/photo-1767611125032-20b291ec1c5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", color: "from-teal-900/70", tags: ["Flexibility", "Mindfulness"], active: false },
  { id: 4, name: "Cycling Intervals", category: "Cardio", duration: "45 min", calories: "400-500", level: "Intermediate", days: 3, rating: 4.7, enrolled: 987, progress: 0, image: "https://images.unsplash.com/photo-1635706055150-5827085ca635?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", color: "from-blue-900/70", tags: ["Endurance", "Cardio"], active: false },
];

const CATEGORIES = ["All", "Strength", "Cardio", "HIIT", "Yoga"];
const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
};

function PlanCardSkeleton() {
  return (
    <Card className="border-border overflow-hidden">
      <Skeleton className="h-44 w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full mt-3" />
      </CardContent>
    </Card>
  );
}

function MyPlanCardSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

export default function Workouts() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionTargetPlanId, setSessionTargetPlanId] = useState<string | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseTargetSessionId, setExerciseTargetSessionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Geração + execução de plano
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [playerPlan, setPlayerPlan] = useState<WorkoutPlan | null>(null);
  const [playerSession, setPlayerSession] = useState<WorkoutSession | null>(null);
  const [pickerPlan, setPickerPlan] = useState<WorkoutPlan | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);

  const {
    plans,
    isLoading,
    error,
    getUserPlans,
    createPlan,
    updatePlan,
    deletePlan,
    addSession,
    addExerciseToSession,
    filterExercises,
    generatePlan,
    completeSession,
  } = useWorkout();

  useEffect(() => {
    void getUserPlans();
  }, [getUserPlans]);

  const filtered = selectedCategory === "All"
    ? DISCOVER_PLANS
    : DISCOVER_PLANS.filter((p) => p.category === selectedCategory);

  const myPlans = useMemo(() => plans, [plans]);

  const handleCreatePlan = async (data: PlanFormData) => {
    await createPlan({
      nome: data.nome,
      objetivo: data.objetivo,
      nivel: data.nivel,
      duracao_semanas: data.duracao_semanas,
    });
    toast.success("Plano criado com sucesso!");
    setPlanModalOpen(false);
    setEditingPlan(null);
  };

  const handleEditPlan = async (data: PlanFormData) => {
    if (!editingPlan) return;
    await updatePlan(editingPlan.id, {
      nome: data.nome,
      objetivo: data.objetivo,
      nivel: data.nivel,
      duracao_semanas: data.duracao_semanas,
    });
    toast.success("Plano atualizado!");
    setEditingPlan(null);
    setPlanModalOpen(false);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan(deleteTarget.id);
      toast.success("Plano deletado.");
    } catch {
      toast.error("Erro ao deletar plano.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openSessionModal = (planId: string) => {
    setSessionTargetPlanId(planId);
    setSessionModalOpen(true);
  };

  const handleAddSession = async (data: SessionFormData) => {
    if (!sessionTargetPlanId) return;
    await addSession(sessionTargetPlanId, {
      nome: data.nome,
      dia_semana: data.dias[0] ?? null,
    });
    toast.success("Sessão adicionada!");
  };

  const openExercisePicker = (sessionId: string) => {
    setExerciseTargetSessionId(sessionId);
    setExerciseModalOpen(true);
  };

  const handleAddExercise = async (exerciseId: string, config: ExerciseConfig) => {
    if (!exerciseTargetSessionId) return;
    await addExerciseToSession(exerciseTargetSessionId, {
      exercicio_id: exerciseId,
      series: config.series,
      repeticoes: config.repeticoes,
      descanso_s: config.descanso_s,
    });
    toast.success("Exercício adicionado!");
  };

  // ── Geração de plano a partir de template ──
  const handleGenerate = async (prefs: { nivel: string; objetivo: string; duracao_semanas: number }) => {
    const plan = await generatePlan(prefs);
    toast.success("Plano gerado com sucesso!");
    return plan;
  };

  const handleStartSession = (plan: WorkoutPlan, session: WorkoutSession) => {
    setGenerateModalOpen(false);
    setPlayerPlan(plan);
    setPlayerSession(session);
  };

  // ── Execução: abre seletor de sessão para um plano existente ──
  const openStartPicker = async (planId: string) => {
    setPickerLoading(true);
    try {
      const full = await getWorkoutPlan(planId);
      const sessions = full.sessoes ?? [];
      if (sessions.length === 0) {
        toast.error("Este plano ainda não possui sessões. Adicione sessões ou gere um novo plano.");
        return;
      }
      if (sessions.length === 1) {
        setPlayerPlan(full);
        setPlayerSession(sessions[0]);
        return;
      }
      setPickerPlan(full);
    } catch {
      toast.error("Erro ao carregar o plano.");
    } finally {
      setPickerLoading(false);
    }
  };

  const startSessionFromPicker = (session: WorkoutSession) => {
    if (!pickerPlan) return;
    setPlayerPlan(pickerPlan);
    setPlayerSession(session);
    setPickerPlan(null);
  };

  const handleCompleteSession = async (
    sessionId: string,
    payload: { plano_treino_id?: string; duracao_min?: number }
  ) => {
    await completeSession(sessionId, payload);
    toast.success("Sessão concluída e registrada!");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Workout Plans</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Descubra e gerencie seus programas de treino
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => { setEditingPlan(null); setPlanModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Criar manualmente
          </Button>
          <Button className="gap-2" onClick={() => setGenerateModalOpen(true)}>
            <Sparkles className="w-4 h-4" /> Criar Plano
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      ) : null}

      <Tabs defaultValue="my-workouts">
        <TabsList className="mb-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-workouts">Meus Planos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* ── DISCOVER ── */}
        <TabsContent value="discover" className="space-y-4">
          <Card className="border-border bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-40">
                <img src={DISCOVER_PLANS[0].image} alt="Active plan" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="relative p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between h-full">
                  <div>
                    <Badge className="bg-white/20 text-white border-white/30 mb-2 text-xs">Ativo</Badge>
                    <h3 className="text-lg font-semibold">Push Pull Legs</h3>
                    <p className="text-sm opacity-75 mt-0.5">Semana 3 de 12 · 35% concluído</p>
                    <Progress value={35} className="mt-2 h-1.5 w-48 bg-white/20 [&>div]:bg-white" />
                  </div>
                  <Button size="sm" className="bg-white text-primary hover:bg-white/90 mt-4 sm:mt-0 w-fit gap-2">
                    <Play className="w-3 h-3" /> Continuar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {CATEGORIES.map((cat) => (
              <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setSelectedCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((plan) => (
              <Card key={plan.id} className="border-border overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="relative h-44">
                  <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className={`absolute inset-0 bg-linear-to-t ${plan.color} to-transparent`} />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">{plan.category}</Badge>
                      <Badge className={`text-xs ${LEVEL_COLORS[plan.level]}`}>{plan.level}</Badge>
                    </div>
                    <h3 className="text-white font-semibold">{plan.name}</h3>
                  </div>
                  {plan.active && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-white" />}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {plan.duration}</span>
                    <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {plan.calories} cal</span>
                    <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {plan.days}x/sem</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{plan.rating}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.enrolled.toLocaleString()} inscritos</span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {plan.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">{tag}</Badge>
                    ))}
                  </div>
                  <Button className="w-full h-8 text-xs gap-1" variant={plan.active ? "outline" : "default"}>
                    {plan.active ? (<>Ver Progresso <ChevronRight className="w-3 h-3" /></>) : (<>Iniciar <Play className="w-3 h-3" /></>)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── MEUS PLANOS ── */}
        <TabsContent value="my-workouts" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <MyPlanCardSkeleton key={i} />)}
            </div>
          ) : myPlans.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum plano criado</p>
              <p className="text-xs text-muted-foreground mb-4">Gere um plano personalizado ou crie manualmente</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditingPlan(null); setPlanModalOpen(true); }}>
                  <Plus className="w-4 h-4" /> Criar manualmente
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setGenerateModalOpen(true)}>
                  <Sparkles className="w-4 h-4" /> Criar Plano
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myPlans.map((plan) => (
                <Card key={plan.id} className="border-border">
                  <CardContent className="p-4">
                    {/* Header do plano */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{plan.nome || "Plano sem nome"}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.sessoes?.length ?? 0} sessões · {plan.duracao_semanas} semanas · {plan.objetivo}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditPlan(plan)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget({ id: plan.id, name: plan.nome || "este plano" })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedPlan === plan.id ? "rotate-180" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Accordion de sessões */}
                    {expandedPlan === plan.id && (
                      <div className="mt-4 space-y-2 pl-2 border-l-2 border-border ml-5">
                        {(plan.sessoes ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">Nenhuma sessão. Adicione uma abaixo.</p>
                        ) : (
                          (plan.sessoes ?? []).map((sessao) => (
                            <div key={sessao.id} className="flex items-center justify-between gap-2 py-1.5">
                              <div className="flex items-center gap-2">
                                <LayoutList className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm text-foreground">{sessao.nome || `Sessão ${sessao.ordem}`}</span>
                                {sessao.dia_semana && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{sessao.dia_semana}</Badge>
                                )}
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 shrink-0" onClick={() => openExercisePicker(sessao.id)}>
                                <Plus className="w-3 h-3" /> Exercício
                              </Button>
                            </div>
                          ))
                        )}
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1 mt-2" onClick={() => openSessionModal(plan.id)}>
                          <Plus className="w-3 h-3" /> Adicionar Sessão
                        </Button>
                      </div>
                    )}

                    {/* Ações rápidas */}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => openStartPicker(plan.id)} disabled={pickerLoading}>
                        <Play className="w-3 h-3" /> Iniciar Treino
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                        Ver Sessões
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full gap-2" onClick={() => setGenerateModalOpen(true)}>
                <Sparkles className="w-4 h-4" /> Gerar Novo Plano
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── HISTÓRICO ── */}
        <TabsContent value="history">
          <div className="space-y-3">
            {[
              { date: "Seg, 7 Abr", name: "Peito & Tríceps", duration: "52 min", calories: 380, exercises: 5 },
              { date: "Sáb, 5 Abr", name: "Leg Day", duration: "68 min", calories: 510, exercises: 7 },
              { date: "Qui, 3 Abr", name: "Costas & Bíceps", duration: "60 min", calories: 440, exercises: 6 },
              { date: "Ter, 1 Abr", name: "HIIT Cardio", duration: "32 min", calories: 380, exercises: 8 },
              { date: "Seg, 31 Mar", name: "Ombros & Core", duration: "48 min", calories: 310, exercises: 5 },
            ].map((session, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 font-bold text-sm">✓</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{session.name}</p>
                      <p className="text-xs text-muted-foreground">{session.exercises} exercícios · {session.duration} · {session.calories} cal</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{session.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <WorkoutPlanModal
        open={planModalOpen}
        onOpenChange={(v) => { setPlanModalOpen(v); if (!v) setEditingPlan(null); }}
        onSubmit={editingPlan ? handleEditPlan : handleCreatePlan}
        initialData={editingPlan ? { nome: editingPlan.nome ?? "", objetivo: editingPlan.objetivo ?? "", nivel: editingPlan.nivel ?? "", duracao_semanas: editingPlan.duracao_semanas } : undefined}
        title={editingPlan ? "Editar Plano" : "Novo Plano de Treino"}
      />

      <WorkoutSessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        onSubmit={handleAddSession}
      />

      <ExercisePickerModal
        open={exerciseModalOpen}
        onOpenChange={setExerciseModalOpen}
        onAddExercise={handleAddExercise}
        filterExercisesFn={filterExercises}
      />

      <GenerateWorkoutModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onGenerate={handleGenerate}
        onStartSession={handleStartSession}
      />

      <WorkoutPlayerModal
        open={!!playerSession}
        onOpenChange={(v) => { if (!v) { setPlayerSession(null); setPlayerPlan(null); } }}
        plan={playerPlan}
        session={playerSession}
        onComplete={handleCompleteSession}
      />

      {/* Seletor de sessão (quando o plano tem várias sessões) */}
      <Dialog open={!!pickerPlan} onOpenChange={(v) => { if (!v) setPickerPlan(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Qual sessão você vai treinar?</DialogTitle>
            <DialogDescription>
              {pickerPlan?.nome ? `Plano: ${pickerPlan.nome}` : "Escolha a sessão para iniciar"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {(pickerPlan?.sessoes ?? []).map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => startSessionFromPicker(session)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.nome ?? `Sessão ${session.ordem}`}</p>
                    <p className="text-xs text-muted-foreground">{(session.exercicios ?? []).length} exercícios</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar plano?</AlertDialogTitle>
            <AlertDialogDescription>
              O plano "{deleteTarget?.name}" será permanentemente removido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
