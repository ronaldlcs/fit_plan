import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Trophy, Target, Flame, Scale, Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import * as dietService from "../../services/dietService";
import * as workoutService from "../../services/workoutService";
import * as userService from "../../services/userService";
import type { UserProfile } from "../../types/user";
import type { WorkoutLog } from "../../types/workout";

const TIME_RANGE_DAYS: Record<string, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "8M": 240,
  "1Y": 365,
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
}

function getISOWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    ) + 1;
  return `S${weekNum}`;
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const daySet = new Set(
    dates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split("T")[0];
    })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (!daySet.has(todayStr) && !daySet.has(yesterdayStr)) return 0;

  let current = daySet.has(todayStr) ? new Date(today) : new Date(yesterday);
  let streak = 0;

  while (daySet.has(current.toISOString().split("T")[0])) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState("8M");
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [progress, logs, stats] = await Promise.all([
          dietService.getUserProgress(),
          workoutService.getUserWorkouts(),
          userService.getUserStats(),
        ]);
        setProgressHistory(progress);
        setWorkoutLogs(logs);
        setProfile(stats.profile ?? null);
      } catch {
        // silently fail — show empty states
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  // Weight chart filtered by time range
  const weightChartData = useMemo(() => {
    const days = TIME_RANGE_DAYS[timeRange] ?? 240;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return [...progressHistory]
      .filter((p) => new Date(p.data_registro) >= cutoff)
      .sort(
        (a, b) =>
          new Date(a.data_registro).getTime() -
          new Date(b.data_registro).getTime()
      )
      .map((p) => ({ date: formatShortDate(p.data_registro), weight: p.peso_kg }));
  }, [progressHistory, timeRange]);

  // Workout frequency — last 8 weeks
  const workoutFreqData = useMemo(() => {
    const now = new Date();
    const ordered: string[] = [];
    const counts: Record<string, number> = {};

    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = getISOWeekLabel(d);
      if (!counts[label]) {
        counts[label] = 0;
        ordered.push(label);
      }
    }

    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 56);

    workoutLogs.forEach((log) => {
      const date = new Date(log.data_treino);
      if (date >= cutoff) {
        const label = getISOWeekLabel(date);
        counts[label] = (counts[label] ?? 0) + 1;
      }
    });

    return ordered.map((week) => ({ week, workouts: counts[week] ?? 0 }));
  }, [workoutLogs]);

  // Activity calendar — last 4 complete weeks
  const calendarData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const daySet = new Set(
      workoutLogs.map((log) => {
        const d = new Date(log.data_treino);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      })
    );

    // Start on the Monday 4 weeks ago
    const start = new Date(now);
    start.setDate(start.getDate() - 27);
    const dow = start.getDay();
    start.setDate(start.getDate() + (dow === 0 ? -6 : 1 - dow));

    return Array.from({ length: 4 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        return daySet.has(date.toISOString().split("T")[0]);
      })
    );
  }, [workoutLogs]);

  const currentStreak = useMemo(
    () => calcStreak(workoutLogs.map((l) => l.data_treino)),
    [workoutLogs]
  );

  const monthlyWorkouts = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return workoutLogs.filter((l) => new Date(l.data_treino) >= startOfMonth)
      .length;
  }, [workoutLogs]);

  const avgWorkoutsPerWeek = useMemo(() => {
    if (workoutFreqData.length === 0) return "0";
    const total = workoutFreqData.reduce((s, w) => s + w.workouts, 0);
    return (total / workoutFreqData.length).toFixed(1);
  }, [workoutFreqData]);

  const bmi = useMemo(() => {
    if (!profile?.peso_kg || !profile?.altura_cm) return null;
    const h = profile.altura_cm / 100;
    return (profile.peso_kg / (h * h)).toFixed(1);
  }, [profile]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return "";
    const v = Number(bmi);
    if (v < 18.5) return "Abaixo do peso";
    if (v < 25) return "Normal";
    if (v < 30) return "Sobrepeso";
    return "Obesidade";
  }, [bmi]);

  const currentWeight = useMemo(() => {
    if (progressHistory.length > 0) {
      const latest = [...progressHistory].sort(
        (a, b) =>
          new Date(b.data_registro).getTime() -
          new Date(a.data_registro).getTime()
      );
      return latest[0].peso_kg as number;
    }
    return profile?.peso_kg ?? null;
  }, [progressHistory, profile]);

  const weightChange = useMemo(() => {
    if (weightChartData.length < 2) return null;
    const diff =
      weightChartData[weightChartData.length - 1].weight -
      weightChartData[0].weight;
    return { value: Math.abs(diff).toFixed(1), up: diff > 0 };
  }, [weightChartData]);

  // Monthly workout goal progress (target 20)
  const monthlyGoalProgress = Math.min((monthlyWorkouts / 20) * 100, 100);

  // Weight goal progress based on objetivo
  const weightGoalProgress = useMemo(() => {
    if (!profile?.peso_kg || weightChartData.length < 2) return null;
    const initial = weightChartData[0].weight;
    const current = weightChartData[weightChartData.length - 1].weight;
    const objetivo = profile.objetivo;

    if (objetivo === "emagrecimento") {
      const targetLoss = initial * 0.05; // goal: lose 5%
      const lost = initial - current;
      return {
        label: "Perda de Peso",
        current: `${current}kg`,
        target: `${(initial - targetLoss).toFixed(1)}kg`,
        progress: Math.min(Math.max((lost / targetLoss) * 100, 0), 100),
      };
    }
    if (objetivo === "hipertrofia") {
      const targetGain = initial * 0.03; // goal: gain 3%
      const gained = current - initial;
      return {
        label: "Ganho de Massa",
        current: `${current}kg`,
        target: `${(initial + targetGain).toFixed(1)}kg`,
        progress: Math.min(Math.max((gained / targetGain) * 100, 0), 100),
      };
    }
    return null;
  }, [profile, weightChartData]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Progresso & Análise
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe sua evolução ao longo do tempo
          </p>
        </div>
        <div className="flex gap-1">
          {["1M", "3M", "6M", "8M", "1Y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Peso Atual</p>
            </div>
            <p className="text-xl font-semibold text-foreground">
              {currentWeight ? `${currentWeight}kg` : "–"}
            </p>
            {weightChange && (
              <div className="flex items-center gap-1 mt-1">
                {weightChange.up ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    weightChange.up ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {weightChange.up ? "+" : "-"}
                  {weightChange.value}kg
                </span>
                <span className="text-xs text-muted-foreground">no período</span>
              </div>
            )}
            {!weightChange && (
              <p className="text-xs text-muted-foreground mt-1">
                {progressHistory.length === 0
                  ? "Sem registros ainda"
                  : "Apenas 1 registro"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">IMC</p>
            <p className="text-xl font-semibold text-foreground">
              {bmi ?? "–"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {bmiCategory || (profile ? "Sem dados de perfil" : "Configure seu perfil")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Treinos no Mês</p>
            </div>
            <p className="text-xl font-semibold text-foreground">
              {monthlyWorkouts}
            </p>
            <p className="text-xs text-muted-foreground mt-1">meta: 20 treinos</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Sequência</p>
            </div>
            <p className="text-xl font-semibold text-foreground">
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStreak > 0 ? "Mantendo o ritmo!" : "Faça um treino hoje"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="body">
        <TabsList className="mb-4">
          <TabsTrigger value="body">Composição Corporal</TabsTrigger>
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
          <TabsTrigger value="records">Recordes</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="space-y-6">
          {/* Weight Chart */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Histórico de Peso</CardTitle>
                {weightChange && (
                  <div
                    className={`flex items-center gap-1 ${
                      weightChange.up ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {weightChange.up ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">
                      {weightChange.up ? "+" : "-"}
                      {weightChange.value}kg total
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {weightChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weightChartData}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#030213" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#030213" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#717182" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#717182" }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 1", "dataMax + 1"]}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                      formatter={(v) => [`${v}kg`, "Peso"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#030213"
                      strokeWidth={2}
                      fill="url(#weightGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Scale className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Sem registros de peso no período
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registre seu peso na aba de Dieta para ver o gráfico
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequency" className="space-y-6">
          {/* Workout Frequency Bar Chart */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Frequência de Treinos</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Média: {avgWorkoutsPerWeek}/semana
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Últimas 8 semanas
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {workoutLogs.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={workoutFreqData} barSize={28}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "#717182" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#717182" }}
                      axisLine={false}
                      tickLine={false}
                      width={20}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                      formatter={(v) => [v, "Treinos"]}
                    />
                    <Bar
                      dataKey="workouts"
                      fill="#030213"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-36 text-center">
                  <Dumbbell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum treino registrado ainda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Calendar */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Calendário de Atividades</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Menos</span>
                  <div className="flex gap-0.5">
                    {[0.1, 0.3, 0.6, 0.8, 1].map((o, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-sm bg-primary"
                        style={{ opacity: o }}
                      />
                    ))}
                  </div>
                  <span>Mais</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                  (d) => (
                    <span
                      key={d}
                      className="text-[10px] text-muted-foreground w-6 text-center"
                    >
                      {d}
                    </span>
                  )
                )}
              </div>
              <div className="space-y-1.5">
                {calendarData.map((week, wi) => (
                  <div key={wi} className="flex gap-2">
                    {week.map((active, di) => (
                      <div
                        key={di}
                        className={`w-6 h-6 rounded-sm transition-colors ${
                          active ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <Flame className="w-3 h-3 inline text-orange-500 mr-1" />
                {currentStreak > 0 ? (
                  <>
                    <strong>Sequência atual: {currentStreak} dias</strong>
                    {" · "}
                  </>
                ) : null}
                {monthlyWorkouts} treinos este mês
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recordes Pessoais</CardTitle>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Registro de PRs em breve
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  O acompanhamento de recordes pessoais por exercício será
                  disponibilizado em uma próxima atualização.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Goals Progress */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Progresso de Metas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Monthly Workouts Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Treinos no Mês
                </span>
                <span className="text-sm font-semibold">
                  {Math.round(monthlyGoalProgress)}%
                </span>
              </div>
              <Progress value={monthlyGoalProgress} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Atual: {monthlyWorkouts}</span>
                <span>Meta: 20</span>
              </div>
            </div>

            {/* Weight Goal */}
            {weightGoalProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {weightGoalProgress.label}
                  </span>
                  <span className="text-sm font-semibold">
                    {Math.round(weightGoalProgress.progress)}%
                  </span>
                </div>
                <Progress value={weightGoalProgress.progress} className="h-2.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Atual: {weightGoalProgress.current}</span>
                  <span>Meta: {weightGoalProgress.target}</span>
                </div>
              </div>
            )}

            {/* Streak Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Sequência de Treinos
                </span>
                <span className="text-sm font-semibold">
                  {Math.round(Math.min((currentStreak / 30) * 100, 100))}%
                </span>
              </div>
              <Progress
                value={Math.min((currentStreak / 30) * 100, 100)}
                className="h-2.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Atual: {currentStreak} dias</span>
                <span>Meta: 30 dias</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
