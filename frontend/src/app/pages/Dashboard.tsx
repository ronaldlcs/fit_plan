import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Flame,
  Zap,
  Trophy,
  Clock,
  ChevronRight,
  Play,
  CheckCircle2,
  Target,
  TrendingUp,
  Droplets,
  Dumbbell,
  CalendarCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";
import * as userService from "../../services/userService";
import * as workoutService from "../../services/workoutService";
import * as dietService from "../../services/dietService";
import { addNotification } from "../../services/notificationStore";
import type { ActiveWorkoutPlan, WorkoutLog, WorkoutSession } from "../../types/workout";
import { WorkoutPlayerModal } from "../components/workout/WorkoutPlayerModal";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildWeeklyData(logs: WorkoutLog[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split("T")[0];

    const dayLogs = logs.filter((l) => {
      const ld = new Date(l.data_treino);
      ld.setHours(0, 0, 0, 0);
      return ld.toISOString().split("T")[0] === dayStr;
    });

    const minutes = dayLogs.reduce((s, l) => s + (l.duracao_min ?? 0), 0);
    return { day: DAY_LABELS[d.getDay()], minutes, treinos: dayLogs.length };
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getActivePlan, completeSession } = useWorkout();
  const [stats, setStats] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<ActiveWorkoutPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [playerSession, setPlayerSession] = useState<WorkoutSession | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [dietPlanCalories, setDietPlanCalories] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await userService.getUserStats();
        setStats(data);
      } catch {
        setStats(null);
      }
    };
    void loadStats();
  }, []);

  useEffect(() => {
    workoutService
      .getUserWorkouts()
      .then((logs) => setWorkoutLogs(logs))
      .catch(() => setWorkoutLogs([]));
  }, []);

  useEffect(() => {
    dietService
      .getUserDietPlans()
      .then((plans) => setDietPlanCalories(plans[0]?.calorias_alvo ?? 0))
      .catch(() => {});
  }, []);

  const loadActivePlan = useCallback(async () => {
    setIsLoadingPlan(true);
    try {
      const data = await getActivePlan();
      setActivePlan(data);
    } catch {
      setActivePlan(null);
    } finally {
      setIsLoadingPlan(false);
    }
  }, [getActivePlan]);

  useEffect(() => {
    void loadActivePlan();
  }, [loadActivePlan]);

  const planSessions = useMemo(() => activePlan?.sessoes ?? [], [activePlan]);
  const completedSessionIds = useMemo(
    () => new Set(activePlan?.completedSessionIds ?? []),
    [activePlan]
  );

  const handleCompleteSession = async (
    sessionId: string,
    payload: { plano_treino_id?: string; duracao_min?: number }
  ) => {
    await completeSession(sessionId, payload);
    await loadActivePlan();
    addNotification({
      icon: "✅",
      title: "Sessão concluída!",
      body: payload.duracao_min
        ? `Você treinou por ${payload.duracao_min} minuto${payload.duracao_min !== 1 ? "s" : ""}. Ótimo trabalho!`
        : "Mais uma sessão no banco. Continue assim!",
      category: "workout",
    });
  };

  const firstName = useMemo(() => {
    if (!user?.nome) return "Atleta";
    return user.nome.split(" ")[0];
  }, [user?.nome]);

  const profile = stats?.profile ?? null;
  // calorias do plano alimentar ativo (planejado para o dia)
  const caloriasHoje = dietPlanCalories;
  // TDEE calculado pelo backend a partir do perfil (peso, altura, sexo, idade)
  const metaCalorias = profile?.tdee ?? 2500;
  // água lida do localStorage (compartilhado com a página de Nutrição)
  // Usa useState + visibilitychange para re-sincronizar quando o usuário volta ao Dashboard
  const [aguaLitros, setAguaLitros] = useState(() => {
    try {
      const key = `fitplan_water_${new Date().toISOString().split("T")[0]}`;
      return (parseInt(localStorage.getItem(key) ?? "0", 10) || 0) / 4;
    } catch { return 0; }
  });
  useEffect(() => {
    const readWater = () => {
      try {
        const key = `fitplan_water_${new Date().toISOString().split("T")[0]}`;
        setAguaLitros((parseInt(localStorage.getItem(key) ?? "0", 10) || 0) / 4);
      } catch { setAguaLitros(0); }
    };
    document.addEventListener("visibilitychange", readWater);
    return () => document.removeEventListener("visibilitychange", readWater);
  }, []);

  const monthlyWorkouts = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return workoutLogs.filter((l) => new Date(l.data_treino) >= start).length;
  }, [workoutLogs]);

  const currentStreak = useMemo(() => {
    if (workoutLogs.length === 0) return 0;
    const daySet = new Set(
      workoutLogs.map((l) => {
        const d = new Date(l.data_treino);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      })
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split("T")[0];
    const yStr = yesterday.toISOString().split("T")[0];
    if (!daySet.has(todayStr) && !daySet.has(yStr)) return 0;
    let cur = daySet.has(todayStr) ? new Date(today) : new Date(yesterday);
    let streak = 0;
    while (daySet.has(cur.toISOString().split("T")[0])) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }, [workoutLogs]);

  const minutosHoje = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return workoutLogs
      .filter((l) => new Date(l.data_treino).toISOString().split("T")[0] === todayStr)
      .reduce((s, l) => s + (l.duracao_min ?? 0), 0);
  }, [workoutLogs]);

  const weeklyData = useMemo(() => buildWeeklyData(workoutLogs), [workoutLogs]);

  const treinosEstaSemana = useMemo(
    () => weeklyData.reduce((s, d) => s + d.treinos, 0),
    [weeklyData]
  );

  const diasDisponiveis = profile?.dias_disponiveis ?? 5;

  const totalExercises = planSessions.length;
  const completedCount = planSessions.filter((s) => completedSessionIds.has(s.id)).length;

  const upcomingSessions = useMemo(
    () => planSessions.filter((s) => !completedSessionIds.has(s.id)).slice(0, 3),
    [planSessions, completedSessionIds]
  );

  const goals = useMemo(() => {
    const objetivo = profile?.objetivo ?? "";
    const list = [
      {
        icon: Trophy,
        label: "Treinos no Mês",
        value: Math.round(Math.min((monthlyWorkouts / 20) * 100, 100)),
        detail: `${monthlyWorkouts} / 20`,
        color: "text-purple-500",
      },
      {
        icon: Flame,
        label: "Sequência",
        value: Math.round(Math.min((currentStreak / 30) * 100, 100)),
        detail: `${currentStreak} / 30 dias`,
        color: "text-orange-500",
      },
      {
        icon: Zap,
        label: "Treinos esta semana",
        value: Math.round(Math.min((treinosEstaSemana / diasDisponiveis) * 100, 100)),
        detail: `${treinosEstaSemana} / ${diasDisponiveis} dias`,
        color: "text-yellow-500",
      },
    ];

    if (objetivo === "emagrecimento") {
      list.push({
        icon: TrendingUp,
        label: "Meta: Emagrecer",
        value: Math.min(Math.round((monthlyWorkouts / 12) * 100), 100),
        detail: `${monthlyWorkouts} treinos este mês`,
        color: "text-green-500",
      });
    } else if (objetivo === "hipertrofia") {
      list.push({
        icon: Dumbbell,
        label: "Meta: Hipertrofia",
        value: Math.min(Math.round((monthlyWorkouts / 16) * 100), 100),
        detail: `${monthlyWorkouts} treinos este mês`,
        color: "text-blue-500",
      });
    } else {
      list.push({
        icon: Target,
        label: "Condicionamento",
        value: Math.min(Math.round((treinosEstaSemana / diasDisponiveis) * 100), 100),
        detail: `${treinosEstaSemana} treinos esta semana`,
        color: "text-green-500",
      });
    }

    return list;
  }, [monthlyWorkouts, currentStreak, treinosEstaSemana, diasDisponiveis, profile]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground">
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm opacity-75">Bem-vindo de volta,</p>
              <h2 className="text-2xl font-semibold mt-0.5">{firstName}!</h2>
              {currentStreak > 0 ? (
                <p className="text-sm opacity-75 mt-1">
                  Sequência de{" "}
                  <span className="font-semibold text-orange-300">{currentStreak} dias</span>. Continue assim!
                </p>
              ) : (
                <p className="text-sm opacity-75 mt-1">Que tal fazer um treino hoje?</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="text-center bg-white/10 rounded-xl px-3 py-2 flex-1 min-w-[72px]">
                <p className="text-xl font-semibold">
                  {isLoadingPlan ? "–" : `${completedCount}/${totalExercises}`}
                </p>
                <p className="text-xs opacity-75">Sessões</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-3 py-2 flex-1 min-w-[72px]">
                <p className="text-xl font-semibold">{monthlyWorkouts}</p>
                <p className="text-xs opacity-75">Treinos/mês</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-3 py-2 flex-1 min-w-[72px]">
                <p className="text-xl font-semibold">{minutosHoje}</p>
                <p className="text-xs opacity-75">Min Hoje</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Calorias do Dia",
            value: String(caloriasHoje),
            goal: `meta: ${metaCalorias} kcal`,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50",
            progress: metaCalorias > 0 ? Math.min((caloriasHoje / metaCalorias) * 100, 100) : 0,
          },
          {
            label: "Minutos Ativos",
            value: String(minutosHoje),
            goal: "meta: 60 min",
            icon: Zap,
            color: "text-yellow-500",
            bg: "bg-yellow-50",
            progress: Math.min((minutosHoje / 60) * 100, 100),
          },
          {
            label: "Treinos no Mês",
            value: String(monthlyWorkouts),
            goal: "meta: 20 treinos",
            icon: Trophy,
            color: "text-purple-500",
            bg: "bg-purple-50",
            progress: Math.min((monthlyWorkouts / 20) * 100, 100),
          },
          {
            label: "Hidratação",
            value: `${aguaLitros}L`,
            goal: "meta: 3L",
            icon: Droplets,
            color: "text-blue-500",
            bg: "bg-blue-50",
            progress: Math.min((aguaLitros / 3) * 100, 100),
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.goal}</p>
              <Progress value={stat.progress} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {activePlan ? "Seu Plano Ativo" : "Nenhum Plano Ativo"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {activePlan
                      ? `${activePlan.nome ?? "Plano de treino"} · ${planSessions.length} sessões`
                      : "Crie um plano para começar a treinar"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {activePlan && (
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {completedCount}/{totalExercises} hoje
                    </Badge>
                  )}
                  <Button size="sm" className="gap-1.5 h-10" onClick={() => navigate("/workouts")}>
                    <Dumbbell className="w-3 h-3" /> {activePlan ? "Ver planos" : "Criar plano"}
                  </Button>
                </div>
              </div>
              {activePlan && (
                <Progress
                  value={totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}
                  className="mt-3 h-2"
                />
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingPlan ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">Carregando plano...</p>
                </div>
              ) : activePlan ? (
                planSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Este plano ainda não possui sessões.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {planSessions.map((session) => {
                      const done = completedSessionIds.has(session.id);
                      const exCount = (session.exercicios ?? []).length;
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            done ? "bg-green-50" : "bg-muted/50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              done ? "bg-green-500 text-white" : "bg-purple-100 text-purple-600"
                            }`}
                          >
                            {done ? <CheckCircle2 className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {session.nome ?? `Sessão ${session.ordem}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{exCount} exercícios</p>
                          </div>
                          {done ? (
                            <Badge variant="outline" className="text-xs shrink-0 text-green-600 border-green-200">
                              Concluído
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="h-10 text-xs gap-1 shrink-0"
                              onClick={() => setPlayerSession(session)}
                            >
                              <Play className="w-3 h-3" /> Iniciar
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Dumbbell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum plano ativo no momento</p>
                  <Button size="sm" className="mt-3 gap-2" onClick={() => navigate("/workouts")}>
                    Criar plano
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Activity Chart — dados reais */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Minutos de Treino — Esta Semana</CardTitle>
                <Badge variant="secondary" className="text-xs">7 dias</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyData.some((d) => d.minutes > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "#717182" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#717182" }}
                      axisLine={false}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(value) => [`${value} min`, "Duração"]}
                    />
                    <Bar dataKey="minutes" fill="#030213" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-44 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum treino registrado esta semana</p>
                  <p className="text-xs text-muted-foreground mt-1">Conclua uma sessão para ver o gráfico</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Sessions */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Próximas Sessões</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-9 gap-1" onClick={() => navigate("/workouts")}>
                  Ver tudo <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {isLoadingPlan ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Carregando...</p>
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-4">
                  <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    {activePlan ? "Todas as sessões concluídas!" : "Nenhum plano ativo"}
                  </p>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-xl">🏋️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.nome ?? `Sessão ${session.ordem}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(session.exercicios ?? []).length} exercícios
                        {session.dia_semana ? ` · ${session.dia_semana}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="h-10 w-10 shrink-0 p-0"
                      onClick={() => setPlayerSession(session)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Weekly Activity Summary */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Atividade Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-semibold text-foreground">{treinosEstaSemana}</p>
                <p className="text-sm text-muted-foreground">
                  de {diasDisponiveis} treinos planejados
                </p>
              </div>
              <Progress
                value={diasDisponiveis > 0 ? Math.min((treinosEstaSemana / diasDisponiveis) * 100, 100) : 0}
                className="h-3 mb-3"
              />
              <div className="grid grid-cols-7 gap-1 mt-3">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-sm ${d.treinos > 0 ? "bg-primary" : "bg-muted"}`}
                    />
                    <span className="text-[9px] text-muted-foreground">{d.day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Goals — dados reais */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Metas do Mês</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-9 gap-1" onClick={() => navigate("/profile")}>
              Ver perfil <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {goals.map((goal) => (
              <div key={goal.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <goal.icon className={`w-4 h-4 ${goal.color}`} />
                    <span className="text-sm font-medium text-foreground">{goal.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{goal.value}%</span>
                </div>
                <Progress value={goal.value} className="h-2" />
                <p className="text-xs text-muted-foreground">{goal.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <WorkoutPlayerModal
        open={!!playerSession}
        onOpenChange={(v) => { if (!v) setPlayerSession(null); }}
        plan={activePlan}
        session={playerSession}
        onComplete={handleCompleteSession}
      />
    </div>
  );
}
