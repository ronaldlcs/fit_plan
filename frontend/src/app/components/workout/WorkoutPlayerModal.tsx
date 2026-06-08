import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Dumbbell, Timer, Weight, Trophy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import type { SessionExerciseDetail, WorkoutPlan, WorkoutSession } from "../../../types/workout";

interface WorkoutPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: WorkoutPlan | null;
  session: WorkoutSession | null;
  onComplete: (
    sessionId: string,
    payload: { plano_treino_id?: string; duracao_min?: number }
  ) => Promise<void>;
}

export function WorkoutPlayerModal({ open, onOpenChange, plan, session, onComplete }: WorkoutPlayerModalProps) {
  const exercises = useMemo<SessionExerciseDetail[]>(
    () => session?.exercicios ?? [],
    [session]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setDoneIds(new Set());
      setFinishing(false);
      setFinished(false);
      setStartedAt(Date.now());
    }
  }, [open, session?.id]);

  const total = exercises.length;
  const completedCount = doneIds.size;
  const current = exercises[currentIndex];
  const allDone = total > 0 && completedCount === total;

  const markCurrentDone = () => {
    if (!current) return;
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.add(current.id);
      return next;
    });
    // Avança para o próximo exercício ainda não concluído
    const nextIndex = exercises.findIndex(
      (ex, i) => i > currentIndex && !doneIds.has(ex.id)
    );
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else {
      const firstPending = exercises.findIndex((ex) => ex.id !== current.id && !doneIds.has(ex.id));
      if (firstPending !== -1) setCurrentIndex(firstPending);
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    setFinishing(true);
    try {
      const duracao_min = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      await onComplete(session.id, {
        plano_treino_id: plan?.id,
        duracao_min,
      });
      setFinished(true);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {session?.nome ?? "Treino"}
          </DialogTitle>
          <DialogDescription>
            {plan?.nome ? `${plan.nome} · ` : ""}
            {total} exercícios nesta sessão
          </DialogDescription>
        </DialogHeader>

        {finished ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Sessão concluída! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {session?.nome} registrada com sucesso.
              </p>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Progresso */}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{completedCount} de {total} concluídos</span>
                <span>{total > 0 ? Math.round((completedCount / total) * 100) : 0}%</span>
              </div>
              <Progress value={total > 0 ? (completedCount / total) * 100 : 0} className="h-2" />
            </div>

            {/* Exercício atual em destaque */}
            {current && !allDone && (
              <div className="rounded-xl border border-border bg-muted/30 p-5 text-center space-y-3">
                <Badge variant="secondary" className="text-[10px]">
                  Exercício {currentIndex + 1} de {total}
                </Badge>
                <h3 className="text-xl font-semibold text-foreground">
                  {current.exercicio?.nome ?? "Exercício"}
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" /> {current.series} séries
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> {current.repeticoes} reps
                  </span>
                  {current.carga_sugerida && (
                    <span className="flex items-center gap-1">
                      <Weight className="w-4 h-4" /> {current.carga_sugerida}
                    </span>
                  )}
                </div>
                {current.descanso_s ? (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Timer className="w-3.5 h-3.5" /> Descanso sugerido: {current.descanso_s}s
                  </p>
                ) : null}
                <Button className="w-full gap-2" onClick={markCurrentDone}>
                  <CheckCircle2 className="w-4 h-4" /> Concluir exercício
                </Button>
              </div>
            )}

            {/* Lista de exercícios com status */}
            <div className="space-y-1.5">
              {exercises.map((ex, i) => {
                const isDone = doneIds.has(ex.id);
                const isCurrent = i === currentIndex && !isDone && !allDone;
                return (
                  <button
                    type="button"
                    key={ex.id}
                    onClick={() => !isDone && setCurrentIndex(i)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      isDone ? "bg-green-50" : isCurrent ? "bg-primary/5 border border-primary/30" : "bg-muted/40 hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isDone ? "bg-green-500 text-white" : "border-2 border-border"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {ex.exercicio?.nome ?? "Exercício"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {ex.series} × {ex.repeticoes}
                        {ex.carga_sugerida ? ` · ${ex.carga_sugerida}` : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full gap-2"
              variant={allDone ? "default" : "outline"}
              onClick={handleFinish}
              disabled={finishing || total === 0}
            >
              {finishing ? "Registrando..." : allDone ? "Finalizar sessão" : "Finalizar mesmo assim"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
