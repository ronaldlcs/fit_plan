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
  Heart,
  Droplets,
  Dumbbell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
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
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";
import * as userService from "../../services/userService";
import type { ActiveWorkoutPlan, WorkoutSession } from "../../types/workout";
import { WorkoutPlayerModal } from "../components/workout/WorkoutPlayerModal";

const weeklyData = [
  { day: "Mon", calories: 420, minutes: 45 },
  { day: "Tue", calories: 350, minutes: 30 },
  { day: "Wed", calories: 510, minutes: 55 },
  { day: "Thu", calories: 290, minutes: 25 },
  { day: "Fri", calories: 640, minutes: 65 },
  { day: "Sat", calories: 480, minutes: 50 },
  { day: "Sun", calories: 0, minutes: 0 },
];

const activityData = [
  { day: "Mon", value: 8200 },
  { day: "Tue", value: 6500 },
  { day: "Wed", value: 9100 },
  { day: "Thu", value: 7800 },
  { day: "Fri", value: 10200 },
  { day: "Sat", value: 5400 },
  { day: "Sun", value: 3200 },
];

const todayExercises = [
  { name: "Bench Press", sets: 4, reps: "8-10", done: true, weight: "80kg" },
  { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", done: true, weight: "30kg" },
  { name: "Cable Flyes", sets: 3, reps: "12-15", done: false, weight: "15kg" },
  { name: "Tricep Pushdowns", sets: 3, reps: "12-15", done: false, weight: "25kg" },
  { name: "Dips", sets: 3, reps: "10-12", done: false, weight: "BW" },
];

const upcomingWorkouts = [
  { day: "Tomorrow", name: "Back & Biceps", duration: "55 min", icon: "💪" },
  { day: "Thu", name: "Rest Day", duration: "Recovery", icon: "😴" },
  { day: "Fri", name: "Leg Day", duration: "60 min", icon: "🦵" },
];

const recentActivity = [
  {
    user: "Alex M.",
    action: "completed Chest Day",
    time: "2h ago",
    avatar: "AM",
    img: "https://images.unsplash.com/photo-1517963628607-235ccdd5476c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=40",
  },
  {
    user: "Sam K.",
    action: "set new PR on Deadlift",
    time: "4h ago",
    avatar: "SK",
    img: null,
  },
  {
    user: "You",
    action: "logged morning run",
    time: "6h ago",
    avatar: "JD",
    img: "https://images.unsplash.com/photo-1770664615015-ad137461ccf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=40",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getActivePlan, completeSession } = useWorkout();
  const [stats, setStats] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<ActiveWorkoutPlan | null>(null);
  const [playerSession, setPlayerSession] = useState<WorkoutSession | null>(null);

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

  const loadActivePlan = useCallback(async () => {
    try {
      const data = await getActivePlan();
      setActivePlan(data);
    } catch {
      setActivePlan(null);
    }
  }, [getActivePlan]);

  useEffect(() => {
    void loadActivePlan();
  }, [loadActivePlan]);

  const planSessions = activePlan?.sessoes ?? [];
  const completedSessionIds = new Set(activePlan?.completedSessionIds ?? []);

  const handleCompleteSession = async (
    sessionId: string,
    payload: { plano_treino_id?: string; duracao_min?: number }
  ) => {
    await completeSession(sessionId, payload);
    await loadActivePlan();
  };

  // Estatísticas de exercícios: usa o plano ativo quando disponível, senão demo
  const totalExercises = activePlan
    ? planSessions.length
    : todayExercises.length;
  const completedCount = activePlan
    ? planSessions.filter((s) => completedSessionIds.has(s.id)).length
    : todayExercises.filter((exercise) => exercise.done).length;

  const firstName = useMemo(() => {
    if (!user?.nome) return "Atleta";
    return user.nome.split(" ")[0];
  }, [user?.nome]);

  const caloriasHoje = stats?.calorias_hoje ?? 0;
  const metaCalorias = stats?.meta_calorias ?? 2500;
  const treinosNoMes = stats?.treinos_mes ?? stats?.treinos_semana ?? 0;
  const aguaLitros = stats?.agua_litros ?? 0;
  const minutosAtivos = stats?.tempo_atividade_min ?? stats?.tempo_treino_min ?? 0;
  const streakDias = stats?.streak_dias ?? 14;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1766287453739-c3ffc3f37d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm opacity-75">Good afternoon,</p>
              <h2 className="text-2xl font-semibold mt-0.5">{firstName}! 👋</h2>
              <p className="text-sm opacity-75 mt-1">
                You&apos;re on a <span className="font-semibold text-orange-300">{streakDias}-day streak</span>. Keep it up!
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-center bg-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-semibold">{completedCount}/{totalExercises}</p>
                <p className="text-xs opacity-75">Exercises</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-semibold">{caloriasHoje}</p>
                <p className="text-xs opacity-75">Cal Burned</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-semibold">{minutosAtivos}</p>
                <p className="text-xs opacity-75">Min Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Daily Calories",
            value: String(caloriasHoje),
            goal: String(metaCalorias),
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50",
            progress: Math.min((caloriasHoje / metaCalorias) * 100, 100),
          },
          {
            label: "Active Minutes",
            value: String(minutosAtivos),
            goal: "60 min",
            icon: Zap,
            color: "text-yellow-500",
            bg: "bg-yellow-50",
            progress: Math.min((minutosAtivos / 60) * 100, 100),
          },
          {
            label: "Workouts Done",
            value: String(treinosNoMes),
            goal: "this month",
            icon: Trophy,
            color: "text-purple-500",
            bg: "bg-purple-50",
            progress: Math.min((treinosNoMes / 20) * 100, 100),
          },
          {
            label: "Hydration",
            value: `${aguaLitros}L`,
            goal: "3L goal",
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {activePlan ? "Seu Plano Ativo" : "Today's Workout"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activePlan
                      ? `${activePlan.nome ?? "Plano de treino"} · ${planSessions.length} sessões`
                      : "Chest & Triceps · 55 min"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {completedCount}/{totalExercises} {activePlan ? "hoje" : "done"}
                  </Badge>
                  <Button size="sm" className="gap-1.5 h-8" onClick={() => navigate("/workouts")}>
                    {activePlan ? (<><Dumbbell className="w-3 h-3" /> Ver planos</>) : (<><Play className="w-3 h-3" /> Continue</>)}
                  </Button>
                </div>
              </div>
              <Progress
                value={totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}
                className="mt-3 h-2"
              />
            </CardHeader>
            <CardContent className="pt-0">
              {activePlan ? (
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
                              Concluído hoje
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1 shrink-0"
                              onClick={() => setPlayerSession(session)}
                            >
                              <Play className="w-3 h-3" /> Iniciar Treino
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {todayExercises.map((exercise, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        exercise.done ? "bg-green-50" : "bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          exercise.done
                            ? "bg-green-500 text-white"
                            : "border-2 border-border"
                        }`}
                      >
                        {exercise.done && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            exercise.done
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {exercise.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {exercise.weight}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Activity Chart */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Weekly Calories Burned</CardTitle>
                <Badge variant="secondary" className="text-xs">This Week</Badge>
              </div>
            </CardHeader>
            <CardContent>
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
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value} cal`, "Calories"]}
                  />
                  <Bar dataKey="calories" fill="#030213" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Workouts */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Upcoming</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {upcomingWorkouts.map((workout, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-xl">{workout.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{workout.name}</p>
                    <p className="text-xs text-muted-foreground">{workout.duration}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {workout.day}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step Count */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daily Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-semibold text-foreground">8,241</p>
                <p className="text-sm text-muted-foreground">of 10,000 goal</p>
              </div>
              <Progress value={82} className="h-3 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>5k</span>
                <span>10k</span>
              </div>
              <ResponsiveContainer width="100%" height={70} className="mt-3">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="stepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#030213" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#030213" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#030213"
                    strokeWidth={2}
                    fill="url(#stepGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    {activity.img && <AvatarImage src={activity.img} />}
                    <AvatarFallback className="text-xs">{activity.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Goals */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monthly Goals</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              Edit Goals <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Flame, label: "Lose 2kg", value: 65, detail: "1.3kg / 2kg", color: "text-orange-500" },
              { icon: Trophy, label: "20 Workouts", value: 90, detail: "18 / 20", color: "text-purple-500" },
              { icon: Heart, label: "Improve VO2", value: 40, detail: "Level 3 / 5", color: "text-red-500" },
              { icon: Target, label: "Run 50km", value: 56, detail: "28km / 50km", color: "text-green-500" },
            ].map((goal) => (
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
