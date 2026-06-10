import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Apple, Droplets, Flame, Search, ChevronRight,
  Coffee, Utensils, Moon, Trash2, Sparkles, Salad, Scale,
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useDiet } from "../../hooks/useDiet";
import * as dietService from "../../services/dietService";
import type { DietPlan, Meal } from "../../types/diet";
import type { GeneratedDietPlan } from "../../services/dietService";
import { GenerateDietModal } from "../components/diet/GenerateDietModal";

const MEAL_ICONS: Record<string, React.ElementType> = {
  cafe: Coffee, cafe_da_manha: Coffee, breakfast: Coffee,
  almoco: Utensils, lunch: Utensils,
  lanche: Apple, snack: Apple,
  jantar: Moon, dinner: Moon, janta: Moon,
};

const MEAL_COLORS = [
  "bg-orange-100 text-orange-600",
  "bg-green-100 text-green-600",
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
];

const PIE_COLORS = ["#6366f1", "#f59e0b", "#22c55e"];

function getMealIcon(tipo: string): React.ElementType {
  const key = tipo.toLowerCase().replace(/\s+/g, "_");
  for (const k of Object.keys(MEAL_ICONS)) {
    if (key.includes(k)) return MEAL_ICONS[k]!;
  }
  return Utensils;
}

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
  const navigate = useNavigate();
  const WATER_KEY = `fitplan_water_${new Date().toISOString().split("T")[0]}`;
  const [water, setWater] = useState(() => {
    try { return parseInt(localStorage.getItem(`fitplan_water_${new Date().toISOString().split("T")[0]}`) ?? "0", 10) || 0; }
    catch { return 0; }
  });
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [pendingAIPlan, setPendingAIPlan] = useState<GeneratedDietPlan | null>(null);
  const [fullPlan, setFullPlan] = useState<DietPlan | null>(null);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodResults, setFoodResults] = useState<any[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  const [addFoodTarget, setAddFoodTarget] = useState<{ food: any; mealId: string; quantity: number } | null>(null);

  const {
    plans,
    isLoading,
    error,
    getUserPlans,
    createPlan,
    deletePlan,
    generateDietAI,
    saveGeneratedPlan,
  } = useDiet();

  useEffect(() => {
    void getUserPlans();
  }, [getUserPlans]);

  useEffect(() => {
    try { localStorage.setItem(WATER_KEY, String(water)); } catch {}
  }, [water, WATER_KEY]);

  // Carregar plano completo com refeições/macros quando há plano
  useEffect(() => {
    if (plans.length > 0) {
      const planId = plans[0].id;
      dietService.getDietPlan(planId)
        .then((data) => setFullPlan(data))
        .catch(() => setFullPlan(null));
    } else {
      setFullPlan(null);
    }
  }, [plans]);

  // Histórico de peso para o gráfico semanal
  useEffect(() => {
    dietService.getUserProgress()
      .then((data) => setProgressHistory(data))
      .catch(() => setProgressHistory([]));
  }, []);

  // Busca de alimentos com debounce
  const searchFoods = useCallback(async (term: string) => {
    if (!term.trim()) {
      setFoodResults([]);
      return;
    }
    setFoodSearchLoading(true);
    try {
      const results = await dietService.searchFoods(term);
      setFoodResults(results);
    } catch {
      setFoodResults([]);
    } finally {
      setFoodSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchFoods(foodSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [foodSearch, searchFoods]);

  const hasActivePlan = plans.length > 0;
  const activePlanMessage = "Você já possui um plano alimentar ativo. Remova o atual para criar ou gerar outro.";

  const openGenerateModal = () => {
    if (hasActivePlan) { toast.error(activePlanMessage); return; }
    setGenerateModalOpen(true);
  };

  const handleCreatePlan = async () => {
    if (hasActivePlan) { toast.error(activePlanMessage); return; }
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
    if (hasActivePlan) { toast.error(activePlanMessage); return null; }
    const result = await generateDietAI(prefs);
    setPendingAIPlan(result);
    return result;
  };

  const handleSaveAIPlan = async (plan: GeneratedDietPlan) => {
    try {
      if (hasActivePlan) { toast.error(activePlanMessage); return; }
      await saveGeneratedPlan(plan);
      setPendingAIPlan(null);
      setGenerateModalOpen(false);
      toast.success("Plano salvo em Planos");
    } catch {
      toast.error("Erro ao salvar plano gerado");
    }
  };

  // Macros computados do plano completo
  const macros = useMemo(() => {
    if (!fullPlan?.refeicoes) return null;
    let protein = 0, carbs = 0, fat = 0, totalCal = 0;
    for (const meal of fullPlan.refeicoes) {
      for (const food of (meal.alimentos ?? [])) {
        protein += food.proteinas_total ?? 0;
        carbs += food.carboidratos_total ?? 0;
        fat += food.gorduras_total ?? 0;
        totalCal += food.calorias_total ?? 0;
      }
    }
    return { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat), totalCal: Math.round(totalCal) };
  }, [fullPlan]);

  const calorieGoal = plans[0]?.calorias_alvo ?? 2500;

  const pieData = useMemo(() => {
    if (!macros) return [];
    return [
      { name: "Proteína", value: macros.protein * 4, color: PIE_COLORS[0] },
      { name: "Carbs", value: macros.carbs * 4, color: PIE_COLORS[1] },
      { name: "Gordura", value: macros.fat * 9, color: PIE_COLORS[2] },
    ].filter((d) => d.value > 0);
  }, [macros]);

  const macroGoals = useMemo(() => {
    if (!calorieGoal) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round((calorieGoal * 0.3) / 4),
      carbs: Math.round((calorieGoal * 0.45) / 4),
      fat: Math.round((calorieGoal * 0.25) / 9),
    };
  }, [calorieGoal]);

  // Gráfico de peso (últimos registros)
  const weightChartData = useMemo(() => {
    return [...progressHistory]
      .sort((a, b) => new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime())
      .slice(-10)
      .map((p) => ({
        day: new Date(p.data_registro).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        peso: p.peso_kg,
      }));
  }, [progressHistory]);

  const displayPlans = useMemo(() => {
    if (plans.length > 0) {
      return plans.map((plan) => ({
        id: plan.id,
        name: plan.nome || "Plano sem nome",
        cal: plan.calorias_alvo || 0,
        protein: macros?.protein ?? 0,
        tag: plan.objetivo || "manutencao",
        isReal: true,
      }));
    }
    return [
      { id: "demo-1", name: "Ganho de Massa", cal: 2800, protein: 200, tag: "Alta Proteína", isReal: false },
      { id: "demo-2", name: "Emagrecimento", cal: 1800, protein: 160, tag: "Déficit Calórico", isReal: false },
      { id: "demo-3", name: "Performance", cal: 3000, protein: 180, tag: "Alto Carb", isReal: false },
    ];
  }, [plans, macros]);

  const handleViewDetails = (planId: string) => {
    navigate(`/nutrition/${planId}`);
  };

  const meals: Meal[] = fullPlan?.refeicoes ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-foreground">Nutrition</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-2 h-10" onClick={openGenerateModal} disabled={hasActivePlan}>
            <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Gerar com</span> IA
          </Button>
          <Button className="gap-2 h-10" onClick={handleCreatePlan} disabled={hasActivePlan}>
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo</span> Plano
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      {/* Daily Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calorie Ring — macros reais */}
        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Calorias do Plano</CardTitle></CardHeader>
          <CardContent>
            {macros && pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <PieChart width={120} height={120}>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={56} dataKey="value" startAngle={90} endAngle={-270}>
                      {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${Math.round(v / 4)}g`, ""]} />
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">{macros.totalCal}</span>
                    <span className="text-[10px] text-muted-foreground">kcal</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {[
                    { name: "Proteína", value: macros.protein, goal: macroGoals.protein, color: PIE_COLORS[0] },
                    { name: "Carbs", value: macros.carbs, goal: macroGoals.carbs, color: PIE_COLORS[1] },
                    { name: "Gordura", value: macros.fat, goal: macroGoals.fat, color: PIE_COLORS[2] },
                  ].map((m) => (
                    <div key={m.name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{m.name}</span>
                        <span className="font-medium">{m.value}g / {m.goal}g</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((m.value / Math.max(m.goal, 1)) * 100, 100)}%`, backgroundColor: m.color }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Meta calorias</span>
                      <span className="font-semibold text-foreground">{calorieGoal} kcal</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Flame className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {hasActivePlan ? "Adicione alimentos ao plano para ver os macros" : "Crie um plano alimentar para ver os macros"}
                </p>
              </div>
            )}
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
                <button key={i} onClick={() => setWater(i < water ? i : i + 1)} className={`h-10 rounded-lg transition-colors ${i < water ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-300"}`}>
                  <Droplets className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-10 text-xs" onClick={() => setWater(Math.max(0, water - 1))}>-250ml</Button>
              <Button size="sm" className="flex-1 h-10 text-xs" onClick={() => setWater(Math.min(12, water + 1))}>+250ml</Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Peso */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Histórico de Peso</CardTitle>
              <Scale className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {weightChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#030213" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#030213" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#717182" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#717182" }} axisLine={false} tickLine={false} width={35} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} formatter={(v) => [`${v} kg`, "Peso"]} />
                  <Area type="monotone" dataKey="peso" stroke="#030213" strokeWidth={2} fill="url(#weightGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <Scale className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {weightChartData.length === 1 ? "Apenas 1 registro — adicione mais para ver a tendência" : "Sem registros de peso ainda"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="meals">
        <div className="overflow-x-auto pb-1">
          <TabsList className="mb-4 min-w-max">
            <TabsTrigger value="meals">Refeições do Plano</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>
        </div>

        {/* ── REFEIÇÕES ── */}
        <TabsContent value="meals" className="space-y-4">
          {!hasActivePlan ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Salad className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum plano alimentar ativo</p>
              <p className="text-xs text-muted-foreground mb-4">Crie ou gere um plano para ver suas refeições aqui</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={openGenerateModal}>
                  <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
                </Button>
                <Button size="sm" className="gap-2" onClick={handleCreatePlan}>
                  <Plus className="w-3.5 h-3.5" /> Criar Plano
                </Button>
              </div>
            </div>
          ) : meals.length === 0 ? (
            <div className="text-center py-10 border border-border rounded-xl">
              <Utensils className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">O plano ainda não possui refeições.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(`/nutrition/${plans[0]?.id}`)}>
                Adicionar refeições <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ) : (
            meals.map((meal, idx) => {
              const MealIcon = getMealIcon(meal.tipo);
              const colorClass = MEAL_COLORS[idx % MEAL_COLORS.length];
              const mealCalories = (meal.alimentos ?? []).reduce((s, f) => s + (f.calorias_total ?? 0), 0);
              const mealProtein = (meal.alimentos ?? []).reduce((s, f) => s + (f.proteinas_total ?? 0), 0);
              const mealCarbs = (meal.alimentos ?? []).reduce((s, f) => s + (f.carboidratos_total ?? 0), 0);
              const mealFat = (meal.alimentos ?? []).reduce((s, f) => s + (f.gorduras_total ?? 0), 0);

              return (
                <Card key={meal.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                        <MealIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground capitalize">{meal.tipo}</h3>
                          <span className="text-sm font-semibold text-foreground">{Math.round(mealCalories)} kcal</span>
                        </div>
                        {meal.horario && <p className="text-xs text-muted-foreground">{meal.horario}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  {(meal.alimentos ?? []).length > 0 ? (
                    <CardContent className="pt-0">
                      <div className="space-y-1.5">
                        {(meal.alimentos ?? []).map((food, fi) => (
                          <div key={fi} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-sm text-foreground">{food.alimento?.nome ?? "Alimento"}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {food.quantidade_g && <span className="hidden sm:inline">{food.quantidade_g}g</span>}
                              <span className="hidden sm:inline">{Math.round(food.proteinas_total ?? 0)}g P</span>
                              <span className="hidden sm:inline">{Math.round(food.carboidratos_total ?? 0)}g C</span>
                              <span className="hidden sm:inline">{Math.round(food.gorduras_total ?? 0)}g G</span>
                              <span className="font-medium text-foreground">{Math.round(food.calorias_total ?? 0)} kcal</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                        <span>P: {Math.round(mealProtein)}g</span>
                        <span>C: {Math.round(mealCarbs)}g</span>
                        <span>G: {Math.round(mealFat)}g</span>
                      </div>

                    </CardContent>
                  ) : (
                    <CardContent className="pt-0">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">Nenhum alimento registrado</p>

                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── REGISTRO ── */}
        <TabsContent value="log">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar alimentos..."
                className="pl-9"
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
              />
            </div>
            {foodSearchLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Skeleton className="flex-1 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))}
              </div>
            ) : foodResults.length > 0 ? (
              <div className="space-y-2">
                {foodResults.map((food, i) => (
                  <div key={food.id ?? i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{food.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        P: {food.proteinas_g ?? 0}g · C: {food.carboidratos_g ?? 0}g · G: {food.gorduras_g ?? 0}g
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">{food.calorias ?? 0} kcal</span>
                    <Button
                      size="sm"
                      className="h-10 w-10 shrink-0 p-0"
                      onClick={() => {
                        if (!hasActivePlan) { toast.error("Crie um plano alimentar primeiro."); return; }
                        if (meals.length === 0) { navigate(`/nutrition/${plans[0]?.id}`); return; }
                        setAddFoodTarget({ food, mealId: meals[0]?.id ?? "", quantity: 100 });
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : foodSearch.trim() ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum alimento encontrado para "{foodSearch}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Digite o nome de um alimento para buscar
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── PLANOS ── */}
        <TabsContent value="plans">
          {hasActivePlan && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2 text-sm">
              {activePlanMessage}
            </div>
          )}
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
                <Button size="sm" variant="outline" className="gap-2" onClick={openGenerateModal} disabled={hasActivePlan}>
                  <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
                </Button>
                <Button size="sm" className="gap-2" onClick={handleCreatePlan} disabled={hasActivePlan}>
                  <Plus className="w-3.5 h-3.5" /> Criar Plano
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{displayPlans.length} plano(s)</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={openGenerateModal} disabled={hasActivePlan}>
                  <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPlans.map((plan, index) => (
                  <Card key={plan.id} className="border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="h-32 relative overflow-hidden">
                      <div className={`absolute inset-0 ${["bg-purple-600","bg-orange-600","bg-green-600"][index % 3]}`} />
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
                          <Button size="sm" className="flex-1 h-10 text-xs gap-1" onClick={() => handleViewDetails(plan.id)}>
                            Ver Detalhes <ChevronRight className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-10 w-10 p-0" onClick={() => setDeleteTarget({ id: plan.id, name: plan.name })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full h-10 text-xs gap-1" onClick={openGenerateModal}>
                          Gerar similar <Sparkles className="w-3 h-3" />
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

      {/* Dialog: adicionar alimento pesquisado a uma refeição */}
      <Dialog open={!!addFoodTarget} onOpenChange={(v) => { if (!v) setAddFoodTarget(null); }}>
        <DialogContent className="max-w-sm max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar {addFoodTarget?.food?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Refeição</label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={addFoodTarget?.mealId ?? ""}
                onChange={(e) => setAddFoodTarget((prev) => prev ? { ...prev, mealId: e.target.value } : prev)}
              >
                {meals.map((meal) => (
                  <option key={meal.id} value={meal.id}>{meal.tipo} {meal.horario ? `(${meal.horario})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Quantidade (g)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={addFoodTarget?.quantity ?? 100}
                onChange={(e) => setAddFoodTarget((prev) => prev ? { ...prev, quantity: Number(e.target.value) } : prev)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddFoodTarget(null)}>Cancelar</Button>
            <Button
              className="flex-1"
              onClick={async () => {
                if (!addFoodTarget) return;
                try {
                  await dietService.addFoodToMeal(addFoodTarget.mealId, addFoodTarget.food.id, addFoodTarget.quantity);
                  toast.success("Alimento adicionado com sucesso!");
                  const planId = plans[0]?.id;
                  if (planId) {
                    const updated = await dietService.getDietPlan(planId);
                    setFullPlan(updated);
                  }
                  setAddFoodTarget(null);
                } catch {
                  toast.error("Erro ao adicionar alimento.");
                }
              }}
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GenerateDietModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onGenerate={handleGenerateAI}
        onReset={() => setPendingAIPlan(null)}
        onSave={handleSaveAIPlan}
      />

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
