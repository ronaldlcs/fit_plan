import { useEffect, useMemo, useState } from "react";
import {
  Plus, Apple, Droplets, Flame, Search, ChevronRight,
  Coffee, Utensils, Moon, Trash2, Sparkles, Salad,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useDiet } from "../../hooks/useDiet";
import { GenerateDietModal } from "../components/diet/GenerateDietModal";

const macroData = [
  { name: "Protein", value: 165, color: "#6366f1", goal: 180 },
  { name: "Carbs", value: 210, color: "#f59e0b", goal: 250 },
  { name: "Fat", value: 68, color: "#22c55e", goal: 70 },
];

const pieData = [
  { name: "Protein", value: 165 * 4, color: "#6366f1" },
  { name: "Carbs", value: 210 * 4, color: "#f59e0b" },
  { name: "Fat", value: 68 * 9, color: "#22c55e" },
];

const weeklyCalories = [
  { day: "Seg", calories: 2300, goal: 2500 },
  { day: "Ter", calories: 2150, goal: 2500 },
  { day: "Qua", calories: 2480, goal: 2500 },
  { day: "Qui", calories: 2050, goal: 2500 },
  { day: "Sex", calories: 2600, goal: 2500 },
  { day: "Sáb", calories: 2750, goal: 2500 },
  { day: "Dom", calories: 2145, goal: 2500 },
];

const DEMO_MEALS = [
  { name: "Café da Manhã", icon: Coffee, time: "07:30", calories: 480, color: "bg-orange-100 text-orange-600", items: [{ name: "Aveia com frutas", cal: 320, protein: 12, carbs: 58, fat: 6 }, { name: "Iogurte grego", cal: 130, protein: 15, carbs: 8, fat: 3 }, { name: "Café preto", cal: 5, protein: 0, carbs: 0, fat: 0 }] },
  { name: "Almoço", icon: Utensils, time: "12:30", calories: 720, color: "bg-green-100 text-green-600", items: [{ name: "Frango grelhado", cal: 280, protein: 52, carbs: 0, fat: 7 }, { name: "Arroz integral (150g)", cal: 185, protein: 4, carbs: 38, fat: 1.5 }, { name: "Legumes variados", cal: 95, protein: 4, carbs: 18, fat: 1 }] },
  { name: "Lanche", icon: Apple, time: "16:00", calories: 210, color: "bg-blue-100 text-blue-600", items: [{ name: "Whey Protein", cal: 150, protein: 25, carbs: 8, fat: 3 }, { name: "Banana", cal: 90, protein: 1, carbs: 23, fat: 0 }] },
  { name: "Jantar", icon: Moon, time: "19:00", calories: 0, color: "bg-purple-100 text-purple-600", items: [], upcoming: true },
];

function PlanCardSkeleton() {
  return (
    <Card className="border-border overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-8 w-full mt-2" />
      </CardContent>
    </Card>
  );
}

export default function Nutrition() {
  const [water, setWater] = useState(6);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { plans, isLoading, error, getUserPlans, createPlan, deletePlan, generateDietAI } = useDiet();

  useEffect(() => {
    void getUserPlans();
  }, [getUserPlans]);

  const handleCreatePlan = async () => {
    const nome = window.prompt("Nome do plano alimentar:");
    if (!nome) return;
    const objetivo = window.prompt("Objetivo (manutencao, emagrecimento, hipertrofia, condicionamento):", "manutencao");
    if (!objetivo) return;
    const calorias = window.prompt("Calorias alvo (kcal):", "2000");
    if (!calorias) return;
    try {
      await createPlan({ nome, objetivo, calorias_alvo: Number(calorias) });
      toast.success("Plano criado!");
    } catch {
      toast.error("Erro ao criar plano.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan(deleteTarget.id);
      toast.success("Plano removido.");
    } catch {
      toast.error("Erro ao remover plano.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleGenerateAI = async (prefs: any) => {
    return await generateDietAI(prefs);
  };

  const handleSaveGeneratedPlan = async (preview: any) => {
    await getUserPlans();
    toast.success("Plano gerado pela IA salvo com sucesso!");
    setGenerateModalOpen(false);
  };

  const displayPlans = useMemo(() => {
    if (plans.length > 0) {
      return plans.map((plan) => ({
        id: plan.id,
        name: plan.nome || "Plano sem nome",
        cal: plan.calorias_alvo || 0,
        protein: 0,
        tag: plan.objetivo || "manutencao",
        isReal: true,
      }));
    }
    return [
      { id: "demo-1", name: "Ganho de Massa", cal: 2800, protein: 200, tag: "Alta Proteína", isReal: false },
      { id: "demo-2", name: "Emagrecimento", cal: 1800, protein: 160, tag: "Déficit Calórico", isReal: false },
      { id: "demo-3", name: "Performance", cal: 3000, protein: 180, tag: "Alto Carb", isReal: false },
    ];
  }, [plans]);

  const totalCalories = DEMO_MEALS.reduce((sum, m) => sum + m.calories, 0);
  const calorieGoal = plans[0]?.calorias_alvo ?? 2500;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Nutrition</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setGenerateModalOpen(true)}>
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </Button>
          <Button className="gap-2" onClick={handleCreatePlan}>
            <Plus className="w-4 h-4" /> Novo Plano
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      {/* Daily Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calorie Ring */}
        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Calorias do Dia</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <PieChart width={120} height={120}>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={56} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${Math.round(v / (v === pieData[2].value ? 9 : 4))}g`, ""]} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold">{totalCalories}</span>
                  <span className="text-[10px] text-muted-foreground">kcal</span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {macroData.map((macro) => (
                  <div key={macro.name}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">{macro.name}</span>
                      <span className="font-medium">{macro.value}g / {macro.goal}g</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(macro.value / macro.goal) * 100}%`, backgroundColor: macro.color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Restante</span>
                    <span className="font-semibold text-foreground">{calorieGoal - totalCalories} kcal</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water Tracker */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Hidratação</CardTitle>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-3xl font-semibold text-foreground">{water * 250}ml</p>
              <p className="text-sm text-muted-foreground">de 3.000ml meta</p>
              <Progress value={(water / 12) * 100} className="mt-2 h-2.5" />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <button key={i} onClick={() => setWater(i < water ? i : i + 1)} className={`h-8 rounded-lg transition-colors ${i < water ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-300"}`}>
                  <Droplets className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWater(Math.max(0, water - 1))}>-250ml</Button>
              <Button size="sm" className="flex-1 text-xs" onClick={() => setWater(Math.min(12, water + 1))}>+250ml</Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendência Semanal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyCalories}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#030213" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#030213" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#717182" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#717182" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} formatter={(v) => [`${v} kcal`, "Calorias"]} />
                <Area type="monotone" dataKey="calories" stroke="#030213" strokeWidth={2} fill="url(#calGrad)" />
                <Area type="monotone" dataKey="goal" stroke="#e5e7eb" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="meals">
        <TabsList className="mb-4">
          <TabsTrigger value="meals">Refeições de Hoje</TabsTrigger>
          <TabsTrigger value="log">Registro</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>

        {/* ── REFEIÇÕES ── */}
        <TabsContent value="meals" className="space-y-4">
          {DEMO_MEALS.map((meal) => (
            <Card key={meal.name} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${meal.color} flex items-center justify-center shrink-0`}>
                    <meal.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{meal.name}</h3>
                      {(meal as any).upcoming ? (
                        <Badge variant="outline" className="text-xs">Próxima</Badge>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{meal.calories} kcal</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{meal.time}</p>
                  </div>
                </div>
              </CardHeader>
              {!(meal as any).upcoming ? (
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {meal.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-sm text-foreground">{item.name}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="hidden sm:inline">{item.protein}g P</span>
                          <span className="hidden sm:inline">{item.carbs}g C</span>
                          <span className="hidden sm:inline">{item.fat}g G</span>
                          <span className="font-medium text-foreground">{item.cal} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs gap-1 w-full">
                    <Plus className="w-3 h-3" /> Adicionar à {meal.name}
                  </Button>
                </CardContent>
              ) : (
                <CardContent className="pt-0">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Nenhum alimento registrado</p>
                    <Button size="sm" className="gap-2 h-7 text-xs"><Plus className="w-3 h-3" /> Registrar Jantar</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* ── REGISTRO ── */}
        <TabsContent value="log">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Pesquisar alimentos..." className="pl-9" />
            </div>
            <div className="space-y-2">
              {[
                { name: "Frango (100g)", cal: 165, protein: 31, carbs: 0, fat: 3.6 },
                { name: "Arroz Integral (100g)", cal: 123, protein: 2.7, carbs: 25, fat: 1 },
                { name: "Whey Protein", cal: 150, protein: 25, carbs: 8, fat: 3 },
                { name: "Ovos (2 unid)", cal: 156, protein: 12, carbs: 1.2, fat: 11 },
                { name: "Abacate (100g)", cal: 160, protein: 2, carbs: 9, fat: 15 },
              ].map((food, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">P: {food.protein}g · C: {food.carbs}g · G: {food.fat}g</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{food.cal} cal</span>
                  <Button size="sm" className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── PLANOS ── */}
        <TabsContent value="plans">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <PlanCardSkeleton key={i} />)}
            </div>
          ) : displayPlans.length === 0 || (plans.length === 0 && !isLoading) ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Salad className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum plano alimentar</p>
              <p className="text-xs text-muted-foreground mb-4">Crie manualmente ou gere um com IA</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setGenerateModalOpen(true)}>
                  <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
                </Button>
                <Button size="sm" className="gap-2" onClick={handleCreatePlan}>
                  <Plus className="w-3.5 h-3.5" /> Criar Plano
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Botão de IA em destaque */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{displayPlans.length} plano(s)</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setGenerateModalOpen(true)}>
                  <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPlans.map((plan, index) => (
                  <Card key={plan.id} className="border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="h-32 relative overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1606859191214-25806e8e2423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" alt={plan.name} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 ${["bg-purple-600","bg-orange-600","bg-green-600"][index % 3]} opacity-60`} />
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <h3 className="text-white font-semibold">{plan.name}</h3>
                        <Badge className="bg-white/20 text-white border-white/30 text-xs w-fit mt-1">{plan.tag}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-muted-foreground">{plan.cal} kcal/dia</span>
                        {plan.protein > 0 && <span className="text-muted-foreground">{plan.protein}g proteína</span>}
                      </div>
                      {plan.isReal ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs gap-1">
                            Ver Detalhes <ChevronRight className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={() => setDeleteTarget({ id: plan.id, name: plan.name })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full h-8 text-xs gap-1">
                          Aplicar Plano <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal IA */}
      <GenerateDietModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onGenerate={handleGenerateAI}
        onSave={handleSaveGeneratedPlan}
      />

      {/* Confirmar deleção */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover plano?</AlertDialogTitle>
            <AlertDialogDescription>
              O plano "{deleteTarget?.name}" será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
