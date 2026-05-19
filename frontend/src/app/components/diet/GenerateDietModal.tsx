import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Check, Utensils } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import type { GenerateDietPreferences } from "../../../services/dietService";

interface GenerateDietModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prefs: GenerateDietPreferences) => Promise<any>;
  onSave: (plan: any) => Promise<void>;
}

const CULINARIA_OPTIONS = [
  { value: "brasileira", label: "Brasileira" },
  { value: "mediterranea", label: "Mediterrânea" },
  { value: "asiatica", label: "Asiática" },
  { value: "americana", label: "Americana" },
];

const LOADING_MESSAGES = [
  "Analisando seu perfil...",
  "Calculando suas macros...",
  "Montando seu cardápio...",
  "Balanceando os nutrientes...",
  "Finalizando seu plano personalizado...",
];

export function GenerateDietModal({ open, onOpenChange, onGenerate, onSave }: GenerateDietModalProps) {
  const [culinaria, setCulinaria] = useState<string[]>(["brasileira"]);
  const [refeicoes, setRefeicoes] = useState("5");
  const [restricoes, setRestricoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [preview, setPreview] = useState<any>(null);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const msgInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setCulinaria(["brasileira"]);
      setRefeicoes("5");
      setRestricoes("");
      setPreview(null);
      setSaved(false);
    }
  }, [open]);

  const toggleCulinaria = (val: string) => {
    setCulinaria((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const startLoadingMessages = () => {
    let i = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    msgInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 2200);
  };

  const stopLoadingMessages = () => {
    if (msgInterval.current) clearInterval(msgInterval.current);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setPreview(null);
    startLoadingMessages();
    try {
      const restricoesArr = restricoes
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const result = await onGenerate({
        culinaria,
        restricoes: restricoesArr,
        refeicoes_por_dia: Number(refeicoes),
      });

      setPreview(result?.preview ?? result);
      setExpandedMeal(0);
    } finally {
      stopLoadingMessages();
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await onSave(preview);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const meals: any[] = preview?.meals ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Plano Alimentar com IA
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {!preview && (
            <>
              {/* Culinária */}
              <div className="space-y-2">
                <Label>Culinária preferida</Label>
                <div className="flex gap-2 flex-wrap">
                  {CULINARIA_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={culinaria.includes(opt.value)}
                        onCheckedChange={() => toggleCulinaria(opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Refeições por dia */}
              <div className="space-y-1.5">
                <Label>Refeições por dia</Label>
                <Select value={refeicoes} onValueChange={setRefeicoes}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["3", "4", "5", "6"].map((n) => (
                      <SelectItem key={n} value={n}>{n} refeições</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Restrições */}
              <div className="space-y-1.5">
                <Label htmlFor="restricoes">Restrições alimentares (opcional)</Label>
                <Textarea
                  id="restricoes"
                  placeholder="Ex: lactose, glúten, amendoim — separados por vírgula"
                  value={restricoes}
                  onChange={(e) => setRestricoes(e.target.value)}
                  className="resize-none h-20"
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={loading || culinaria.length === 0}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {loadingMsg}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Plano com IA
                  </>
                )}
              </Button>
            </>
          )}

          {/* Preview do plano gerado */}
          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">{preview.planName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{preview.dailyCalories} kcal/dia</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setPreview(null); setSaved(false); }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Gerar de novo
                </Button>
              </div>

              {/* Macros */}
              {preview.macros && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Proteína", value: preview.macros.protein, color: "bg-indigo-100 text-indigo-700" },
                    { label: "Carboidratos", value: preview.macros.carbs, color: "bg-amber-100 text-amber-700" },
                    { label: "Gordura", value: preview.macros.fat, color: "bg-green-100 text-green-700" },
                  ].map((m) => (
                    <div key={m.label} className={`rounded-xl p-3 text-center ${m.color}`}>
                      <p className="text-lg font-semibold">{m.value}g</p>
                      <p className="text-xs font-medium">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Refeições expandíveis */}
              <div className="space-y-2">
                {meals.map((meal: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
                    >
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{meal.nome}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{meal.horario}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{meal.calorias} kcal</span>
                        {expandedMeal === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    {expandedMeal === i && (
                      <div className="px-4 pb-3 space-y-1.5 border-t border-border bg-muted/20">
                        {(meal.alimentos ?? []).map((food: any, fi: number) => (
                          <div key={fi} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                            <div>
                              <p className="text-xs font-medium text-foreground">{food.nome}</p>
                              <p className="text-[10px] text-muted-foreground">{food.quantidade}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>P:{food.proteina}g</span>
                              <span>C:{food.carbs}g</span>
                              <span>G:{food.gordura}g</span>
                              <span className="font-medium text-foreground">{food.calorias} kcal</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {preview.notes && (
                <p className="text-xs text-muted-foreground italic bg-muted/40 rounded-lg p-3">{preview.notes}</p>
              )}

              {saved ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                  <Check className="w-4 h-4" /> Plano salvo com sucesso!
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Plano"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
