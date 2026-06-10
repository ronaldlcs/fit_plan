import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Bookmark, ChevronRight, Play, Dumbbell } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { getAllExercises } from "../../services/workoutService";
import type { Exercise } from "../../types/workout";

const NIVEL_LABEL: Record<string, string> = {
  iniciante: "Beginner",
  intermediario: "Intermediate",
  avancado: "Advanced",
};

const NIVEL_COLORS: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
};

const MUSCLE_COLOR: Record<string, string> = {
  Peito: "bg-purple-100",
  Costas: "bg-blue-100",
  Pernas: "bg-green-100",
  Ombros: "bg-orange-100",
  Bíceps: "bg-yellow-100",
  Tríceps: "bg-indigo-100",
  Core: "bg-teal-100",
  Glúteos: "bg-pink-100",
};

const MUSCLE_EMOJI: Record<string, string> = {
  Peito: "🏋️",
  Costas: "🤸",
  Pernas: "🦵",
  Ombros: "⬆️",
  Bíceps: "💪",
  Tríceps: "💪",
  Core: "🧘",
  Glúteos: "🍑",
};

function ExerciseSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3 mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [bookmarked, setBookmarked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("fitplan_bookmarks") ?? "[]") as string[]; }
    catch { return []; }
  });

  useEffect(() => {
    getAllExercises()
      .then((data) => setExercises(data))
      .catch(() => setExercises([]))
      .finally(() => setIsLoading(false));
  }, []);

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises.forEach((e) => {
      if (e.grupo_muscular?.nome) groups.add(e.grupo_muscular.nome);
    });
    return ["All", ...Array.from(groups).sort()];
  }, [exercises]);

  const equipmentList = useMemo(() => {
    const eqs = new Set<string>();
    exercises.forEach((e) => {
      if (e.equipamento) eqs.add(e.equipamento);
    });
    return ["All", ...Array.from(eqs).sort()];
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const muscleName = e.grupo_muscular?.nome ?? "";
      const matchesMuscle = selectedMuscle === "All" || muscleName === selectedMuscle;
      const matchesEquip =
        selectedEquipment === "All" || (e.equipamento ?? "") === selectedEquipment;
      const matchesSearch = e.nome.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMuscle && matchesEquip && matchesSearch;
    });
  }, [exercises, selectedMuscle, selectedEquipment, searchQuery]);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
      try { localStorage.setItem("fitplan_bookmarks", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const getColor = (e: Exercise) =>
    MUSCLE_COLOR[e.grupo_muscular?.nome ?? ""] ?? "bg-gray-100";

  const getEmoji = (e: Exercise) =>
    MUSCLE_EMOJI[e.grupo_muscular?.nome ?? ""] ?? "🏃";

  const getDifficultyLabel = (nivel: string) => NIVEL_LABEL[nivel] ?? nivel;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Exercise Library</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Carregando..." : `${exercises.length}+ exercícios com guias detalhados`}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Bookmark className="w-3 h-3 mr-1" /> {bookmarked.length} salvos
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar exercícios..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Muscle Group Filter */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Grupo Muscular</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {muscleGroups.map((group) => (
            <Button
              key={group}
              variant={selectedMuscle === group ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setSelectedMuscle(group)}
            >
              {group}
            </Button>
          ))}
        </div>
      </div>

      {/* Equipment Filter */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Equipamento</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {equipmentList.map((eq) => (
            <Button
              key={eq}
              variant={selectedEquipment === eq ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setSelectedEquipment(eq)}
            >
              {eq}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">{filtered.length} exercício(s) encontrado(s)</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => <ExerciseSkeleton key={i} />)
          : filtered.map((exercise) => {
              const difficulty = getDifficultyLabel(exercise.nivel);
              return (
                <Card
                  key={exercise.id}
                  className="border-border cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => setSelectedExercise(exercise)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${getColor(exercise)} flex items-center justify-center text-xl shrink-0`}
                      >
                        {getEmoji(exercise)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{exercise.nome}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(exercise.id);
                            }}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                          >
                            <Bookmark
                              className={`w-4 h-4 transition-colors ${
                                bookmarked.includes(exercise.id)
                                  ? "text-primary fill-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {exercise.grupo_muscular?.nome && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              {exercise.grupo_muscular.nome}
                            </Badge>
                          )}
                          {exercise.equipamento && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              {exercise.equipamento}
                            </Badge>
                          )}
                          <Badge
                            className={`text-[10px] py-0 px-1.5 border-0 ${
                              NIVEL_COLORS[difficulty] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {difficulty}
                          </Badge>
                        </div>
                        {exercise.descricao && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {exercise.descricao}
                          </p>
                        )}
                        <div className="flex items-center justify-end mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExercise(exercise);
                            }}
                          >
                            Ver detalhes <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        {selectedExercise && (
          <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-xl ${getColor(selectedExercise)} flex items-center justify-center text-xl`}
                >
                  {getEmoji(selectedExercise)}
                </span>
                {selectedExercise.nome}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {selectedExercise.grupo_muscular?.nome && (
                  <Badge variant="secondary">{selectedExercise.grupo_muscular.nome}</Badge>
                )}
                {selectedExercise.equipamento && (
                  <Badge variant="outline">{selectedExercise.equipamento}</Badge>
                )}
                <Badge
                  className={`border-0 ${
                    NIVEL_COLORS[getDifficultyLabel(selectedExercise.nivel)] ??
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {getDifficultyLabel(selectedExercise.nivel)}
                </Badge>
              </div>

              {selectedExercise.descricao ? (
                <p className="text-sm text-muted-foreground">{selectedExercise.descricao}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem descrição disponível.</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => toggleBookmark(selectedExercise.id)}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarked.includes(selectedExercise.id) ? "fill-current" : ""
                    }`}
                  />
                  {bookmarked.includes(selectedExercise.id) ? "Salvo" : "Salvar"}
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setSelectedExercise(null)}>
                  <Play className="w-4 h-4" /> Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
