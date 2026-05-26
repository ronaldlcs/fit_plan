import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { getDietPlan } from "../../services/dietService";
import type { DietPlan, MealFoodDetail } from "../../types/diet";

const MEAL_LABELS: Record<string, string> = {
  cafe_manha: "Café da manhã",
  lanche_manha: "Lanche da manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da tarde",
  jantar: "Jantar",
  ceia: "Ceia",
};

const formatMealType = (tipo?: string | null) => {
  if (!tipo) return "Refeição";
  return MEAL_LABELS[tipo] ?? tipo;
};

const formatQuantity = (quantidade?: number | null) => {
  if (!quantidade || quantidade <= 0) return "—";
  return `${quantidade}g`;
};

const formatNumber = (value?: number | null, suffix: string = "") => {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)}${suffix}`;
};

const getFoodName = (food: MealFoodDetail) => food.alimento?.nome ?? "Alimento";

export default function DietPlanDetails() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setError("Plano não encontrado.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPlan = async () => {
      try {
        const data = await getDietPlan(planId);
        if (isMounted) {
          setPlan(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro ao carregar plano");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchPlan();

    return () => {
      isMounted = false;
    };
  }, [planId]);

  const meals = useMemo(() => {
    const list = plan?.refeicoes ?? [];
    return [...list].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [plan]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/nutrition")}> 
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{plan?.nome ?? "Plano alimentar"}</h2>
            <p className="text-xs text-muted-foreground">
              {plan?.objetivo ?? "manutencao"} · {formatNumber(plan?.calorias_alvo, " kcal/dia")}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {!error && meals.length === 0 && (
        <div className="rounded-md border border-border bg-muted/40 text-muted-foreground px-3 py-8 text-center text-sm">
          Nenhuma refeição cadastrada para este plano.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {meals.map((meal) => (
          <Card key={meal.id} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">
                    {formatMealType(meal.tipo)}
                  </CardTitle>
                  {meal.horario && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {meal.horario}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {(meal.alimentos ?? []).length} alimento(s)
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(meal.alimentos ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum alimento registrado.</p>
              ) : (
                (meal.alimentos ?? []).map((food) => {
                  const calories = food.calorias_total ?? food.alimento?.calorias ?? null;
                  const protein = food.proteinas_total ?? food.alimento?.proteinas_g ?? null;
                  const carbs = food.carboidratos_total ?? food.alimento?.carboidratos_g ?? null;
                  const fat = food.gorduras_total ?? food.alimento?.gorduras_g ?? null;

                  return (
                    <div
                      key={food.id}
                      className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{getFoodName(food)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatQuantity(food.quantidade_g)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>P:{formatNumber(protein, "g")}</span>
                        <span>C:{formatNumber(carbs, "g")}</span>
                        <span>G:{formatNumber(fat, "g")}</span>
                        <span className="font-medium text-foreground">
                          {formatNumber(calories, " kcal")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
