import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

interface WorkoutSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SessionFormData) => Promise<void>;
}

export interface SessionFormData {
  nome: string;
  dias: string[];
  grupo_muscular: string;
}

const DIAS_SEMANA = [
  { value: "segunda", label: "Segunda" },
  { value: "terca", label: "Terça" },
  { value: "quarta", label: "Quarta" },
  { value: "quinta", label: "Quinta" },
  { value: "sexta", label: "Sexta" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

const GRUPOS = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Glúteos", "Core", "Full Body"];

function validate(data: SessionFormData) {
  const errors: Partial<Record<keyof SessionFormData, string>> = {};
  if (!data.nome.trim()) errors.nome = "Nome é obrigatório";
  return errors;
}

export function WorkoutSessionModal({ open, onOpenChange, onSubmit }: WorkoutSessionModalProps) {
  const [form, setForm] = useState<SessionFormData>({ nome: "", dias: [], grupo_muscular: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof SessionFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SessionFormData, boolean>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ nome: "", dias: [], grupo_muscular: "" });
      setErrors({});
      setTouched({});
    }
  }, [open]);

  const toggleDia = (dia: string) => {
    setForm((prev) => ({
      ...prev,
      dias: prev.dias.includes(dia) ? prev.dias.filter((d) => d !== dia) : [...prev.dias, dia],
    }));
  };

  const handleNomeChange = (value: string) => {
    const next = { ...form, nome: value };
    setForm(next);
    if (touched.nome) setErrors(validate(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nome: true });
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
          <DialogTitle>Nova Sessão de Treino</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="session-nome">Nome da sessão</Label>
            <Input
              id="session-nome"
              placeholder="Ex: Push — Peito e Tríceps"
              value={form.nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, nome: true }))}
              className={errors.nome && touched.nome ? "border-red-500" : ""}
            />
            {errors.nome && touched.nome && (
              <p className="text-xs text-red-500">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Dias da semana</Label>
            <div className="grid grid-cols-4 gap-2">
              {DIAS_SEMANA.map((dia) => (
                <label key={dia.value} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={form.dias.includes(dia.value)}
                    onCheckedChange={() => toggleDia(dia.value)}
                  />
                  <span className="text-xs">{dia.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Grupo muscular foco</Label>
            <div className="flex gap-1.5 flex-wrap">
              {GRUPOS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, grupo_muscular: p.grupo_muscular === g ? "" : g }))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.grupo_muscular === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Sessão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
