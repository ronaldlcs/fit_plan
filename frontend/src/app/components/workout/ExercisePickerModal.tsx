import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Filter, Plus, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import type { Exercise } from "../../../types/workout";

interface ExercisePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExercise: (exerciseId: string, config: ExerciseConfig) => Promise<void>;
  filterExercisesFn: (filters: any) => Promise<Exercise[]>;
}

export interface ExerciseConfig {
  series: number;
  repeticoes: string;
  peso_kg?: string;
  descanso_s: number;
}

const MUSCLE_GROUPS = ["Todos", "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Core", "Glúteos"];
const LEVELS = ["Todos", "iniciante", "intermediario", "avancado"];
const EQUIPMENT = ["Todos", "Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight", "Resistance Band"];

const LEVEL_COLORS: Record<string, string> = {
  iniciante: "bg-green-100 text-green-700",
  intermediario: "bg-yellow-100 text-yellow-700",
  avancado: "bg-red-100 text-red-700",
};

const defaultConfig: ExerciseConfig = { series: 3, repeticoes: "10-12", peso_kg: "", descanso_s: 60 };

export function ExercisePickerModal({ open, onOpenChange, onAddExercise, filterExercisesFn }: ExercisePickerModalProps) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [levelFilter, setLevelFilter] = useState("Todos");
  const [equipFilter, setEquipFilter] = useState("Todos");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [config, setConfig] = useState<ExerciseConfig>(defaultConfig);
  const [adding, setAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, muscle: string, level: string, equip: string) => {
    setSearching(true);
    try {
      const filters: any = {};
      if (q.trim()) filters.nome = q.trim();
      if (muscle !== "Todos") filters.grupo_muscular = muscle;
      if (level !== "Todos") filters.nivel = level;
      if (equip !== "Todos") filters.equipamento = equip;
      const result = await filterExercisesFn(filters);
      setExercises(result);
    } finally {
      setSearching(false);
    }
  }, [filterExercisesFn]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query, muscleFilter, levelFilter, equipFilter);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, muscleFilter, levelFilter, equipFilter, open, runSearch]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setMuscleFilter("Todos");
      setLevelFilter("Todos");
      setEquipFilter("Todos");
      setSelected(null);
      setConfig(defaultConfig);
      setAddedCount(0);
    }
  }, [open]);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      await onAddExercise(selected.id, config);
      setAddedCount((n) => n + 1);
      setSelected(null);
      setConfig(defaultConfig);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Exercício</DialogTitle>
          <DialogDescription className="sr-only">
            Pesquise e selecione um exercício para adicionar à sessão de treino.
          </DialogDescription>
        </DialogHeader>

        {addedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {addedCount} exercício{addedCount !== 1 ? "s" : ""} adicionado{addedCount !== 1 ? "s" : ""} à sessão
            </span>
          </div>
        )}

        {selected ? (
          <div className="space-y-4 flex-1 overflow-y-auto py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium text-sm">{selected.nome}</p>
                <p className="text-xs text-muted-foreground">{selected.equipamento} · {selected.nivel}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Trocar</Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Séries</Label>
                <Input
                  type="number" min={1} max={10}
                  value={config.series}
                  onChange={(e) => setConfig((p) => ({ ...p, series: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Repetições</Label>
                <Input
                  placeholder="Ex: 10-12 ou 15"
                  value={config.repeticoes}
                  onChange={(e) => setConfig((p) => ({ ...p, repeticoes: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peso (kg) — opcional</Label>
                <Input
                  placeholder="Ex: 50 ou corpo"
                  value={config.peso_kg}
                  onChange={(e) => setConfig((p) => ({ ...p, peso_kg: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descanso (segundos)</Label>
                <Input
                  type="number" min={0} max={300} step={15}
                  value={config.descanso_s}
                  onChange={(e) => setConfig((p) => ({ ...p, descanso_s: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Voltar</Button>
              <Button className="flex-1 gap-2" onClick={handleAdd} disabled={adding || !config.repeticoes}>
                <Plus className="w-4 h-4" />
                {adding ? "Adicionando..." : "Adicionar à Sessão"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {MUSCLE_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setMuscleFilter(g)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors min-h-[32px] ${
                      muscleFilter === g ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevelFilter(l)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors min-h-[32px] ${
                      levelFilter === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {l === "Todos" ? "Todos os níveis" : l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {searching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))
              ) : exercises.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum exercício encontrado</p>
                  <p className="text-xs mt-1">Tente outros filtros</p>
                </div>
              ) : (
                exercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelected(ex)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ex.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{ex.equipamento}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 ${LEVEL_COLORS[ex.nivel] ?? ""}`}>
                        {ex.nivel}
                      </Badge>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
