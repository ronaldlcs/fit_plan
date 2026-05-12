import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface WorkoutPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanFormData) => Promise<void>;
  initialData?: Partial<PlanFormData>;
  title?: string;
}

export interface PlanFormData {
  nome: string;
  objetivo: string;
  nivel: string;
  duracao_semanas: number;
}

const OBJETIVO_OPTIONS = [
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "condicionamento", label: "Condicionamento" },
  { value: "manutencao", label: "Manutenção" },
];

const NIVEL_OPTIONS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

function validate(data: PlanFormData) {
  const errors: Partial<Record<keyof PlanFormData, string>> = {};
  if (!data.nome.trim()) errors.nome = "Nome é obrigatório";
  if (data.nome.trim().length > 80) errors.nome = "Máximo 80 caracteres";
  if (!data.objetivo) errors.objetivo = "Selecione um objetivo";
  if (!data.nivel) errors.nivel = "Selecione o nível";
  if (!data.duracao_semanas || data.duracao_semanas < 1) errors.duracao_semanas = "Mínimo 1 semana";
  if (data.duracao_semanas > 52) errors.duracao_semanas = "Máximo 52 semanas";
  return errors;
}

export function WorkoutPlanModal({ open, onOpenChange, onSubmit, initialData, title = "Novo Plano de Treino" }: WorkoutPlanModalProps) {
  const [form, setForm] = useState<PlanFormData>({
    nome: "",
    objetivo: "",
    nivel: "",
    duracao_semanas: 8,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof PlanFormData, boolean>>>({});

  useEffect(() => {
    if (open) {
      setForm({
        nome: initialData?.nome ?? "",
        objetivo: initialData?.objetivo ?? "",
        nivel: initialData?.nivel ?? "",
        duracao_semanas: initialData?.duracao_semanas ?? 8,
      });
      setErrors({});
      setTouched({});
    }
  }, [open, initialData]);

  const touch = (field: keyof PlanFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: keyof PlanFormData, value: string | number) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) {
      setErrors(validate(next));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { nome: true, objetivo: true, nivel: true, duracao_semanas: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os campos para criar ou editar um plano de treino.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do plano</Label>
            <Input
              id="nome"
              placeholder="Ex: PPL — Push Pull Legs"
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              onBlur={() => touch("nome")}
              className={errors.nome && touched.nome ? "border-red-500" : ""}
            />
            {errors.nome && touched.nome && (
              <p className="text-xs text-red-500">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Objetivo</Label>
            <Select
              value={form.objetivo}
              onValueChange={(v) => { handleChange("objetivo", v); touch("objetivo"); }}
            >
              <SelectTrigger className={errors.objetivo && touched.objetivo ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                {OBJETIVO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.objetivo && touched.objetivo && (
              <p className="text-xs text-red-500">{errors.objetivo}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Nível</Label>
            <Select
              value={form.nivel}
              onValueChange={(v) => { handleChange("nivel", v); touch("nivel"); }}
            >
              <SelectTrigger className={errors.nivel && touched.nivel ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                {NIVEL_OPTIONS.map((n) => (
                  <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.nivel && touched.nivel && (
              <p className="text-xs text-red-500">{errors.nivel}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="semanas">Duração (semanas)</Label>
            <Input
              id="semanas"
              type="number"
              min={1}
              max={52}
              value={form.duracao_semanas}
              onChange={(e) => handleChange("duracao_semanas", Number(e.target.value))}
              onBlur={() => touch("duracao_semanas")}
              className={errors.duracao_semanas && touched.duracao_semanas ? "border-red-500" : ""}
            />
            {errors.duracao_semanas && touched.duracao_semanas && (
              <p className="text-xs text-red-500">{errors.duracao_semanas}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
