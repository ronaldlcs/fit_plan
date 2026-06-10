import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flame, Lock, Save, Shield, Trophy, User } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import * as userService from "../../services/userService";
import { getUserWorkouts } from "../../services/workoutService";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, setProfile, isLoading, setIsLoading } = useProfile();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workoutLogs, setWorkoutLogs] = useState<{ data_treino: string }[]>([]);

  useEffect(() => {
    getUserWorkouts()
      .then(setWorkoutLogs)
      .catch(() => {});
  }, []);
  const [formData, setFormData] = useState({
    sexo: "masculino",
    data_nascimento: "",
    peso_kg: 0,
    altura_cm: 0,
    objetivo: "manutencao",
    nivel: "iniciante",
    dias_disponiveis: 3,
    tempo_treino_min: 60,
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (profile) return;

      setIsLoading(true);
      setError("");
      try {
        const currentProfile = await userService.getUserProfile();
        if (currentProfile) {
          setProfile(currentProfile);
        }
      } catch {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [profile, setIsLoading, setProfile]);

  useEffect(() => {
    if (!profile) return;

    setFormData({
      sexo: profile.sexo,
      data_nascimento: profile.data_nascimento,
      peso_kg: profile.peso_kg,
      altura_cm: profile.altura_cm,
      objetivo: profile.objetivo,
      nivel: profile.nivel,
      dias_disponiveis: profile.dias_disponiveis,
      tempo_treino_min: profile.tempo_treino_min,
    });
  }, [profile]);

  const totalWorkouts = workoutLogs.length;

  const currentStreak = useMemo(() => {
    if (!workoutLogs.length) return 0;
    const daySet = new Set(
      workoutLogs.map((l) => new Date(l.data_treino).toISOString().split("T")[0])
    );
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split("T")[0];
    const yStr = yesterday.toISOString().split("T")[0];
    if (!daySet.has(todayStr) && !daySet.has(yStr)) return 0;
    let cur = daySet.has(todayStr) ? new Date(today) : new Date(yesterday);
    let streak = 0;
    while (daySet.has(cur.toISOString().split("T")[0])) { streak++; cur.setDate(cur.getDate() - 1); }
    return streak;
  }, [workoutLogs]);

  const achievements = useMemo(() => [
    { label: "Primeiro treino concluído", unlocked: totalWorkouts >= 1, detail: totalWorkouts >= 1 ? "Desbloqueado" : "Complete 1 treino" },
    { label: "Sequência de 7 dias",       unlocked: currentStreak >= 7, detail: currentStreak >= 7 ? "Desbloqueado" : `${currentStreak}/7 dias` },
    { label: "100 treinos registrados",   unlocked: totalWorkouts >= 100, detail: `${totalWorkouts}/100 treinos` },
  ], [totalWorkouts, currentStreak]);

  const profileCompletion = useMemo(() => {
    const values = Object.values(formData);
    const filled = values.filter((value) => value !== "" && value !== 0).length;
    return Math.round((filled / values.length) * 100);
  }, [formData]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const updated = await userService.updateUserProfile({
        ...formData,
        sexo: formData.sexo as "masculino" | "feminino" | "outro",
        objetivo: formData.objetivo as "manutencao" | "emagrecimento" | "hipertrofia" | "condicionamento",
        nivel: formData.nivel as "iniciante" | "intermediario" | "avancado",
      });
      setProfile(updated);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const firstName = user?.nome?.split(" ")[0] || "Atleta";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Card className="border-border overflow-hidden">
        <div/>
        <CardContent className="p-6 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Minha conta</p>
              <h2 className="text-2xl font-semibold text-foreground">{firstName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="w-fit">Perfil {profileCompletion}% completo</Badge>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-orange-50 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-orange-700">Continue registrando seus dados para melhorar os planos de treino e dieta.</p>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Dados do perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="sexo">Sexo</label>
                  <select
                    id="sexo"
                    className="w-full border border-border rounded-md bg-input-background px-3 py-2 text-sm"
                    value={formData.sexo}
                    onChange={(event) => setFormData((prev) => ({ ...prev, sexo: event.target.value }))}
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="nascimento">Data de nascimento</label>
                  <Input
                    id="nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(event) => setFormData((prev) => ({ ...prev, data_nascimento: event.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="peso">Peso (kg)</label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={formData.peso_kg || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, peso_kg: Number(event.target.value || 0) }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="altura">Altura (cm)</label>
                  <Input
                    id="altura"
                    type="number"
                    step="1"
                    value={formData.altura_cm || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, altura_cm: Number(event.target.value || 0) }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="objetivo">Objetivo</label>
                  <select
                    id="objetivo"
                    className="w-full border border-border rounded-md bg-input-background px-3 py-2 text-sm"
                    value={formData.objetivo}
                    onChange={(event) => setFormData((prev) => ({ ...prev, objetivo: event.target.value }))}
                  >
                    <option value="emagrecimento">Emagrecimento</option>
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="condicionamento">Condicionamento</option>
                    <option value="manutencao">Manutencao</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="nivel">Nivel</label>
                  <select
                    id="nivel"
                    className="w-full border border-border rounded-md bg-input-background px-3 py-2 text-sm"
                    value={formData.nivel}
                    onChange={(event) => setFormData((prev) => ({ ...prev, nivel: event.target.value }))}
                  >
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediario</option>
                    <option value="avancado">Avancado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="dias">Dias disponiveis</label>
                  <Input
                    id="dias"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.dias_disponiveis || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, dias_disponiveis: Number(event.target.value || 0) }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="tempo">Tempo de treino (min)</label>
                  <Input
                    id="tempo"
                    type="number"
                    step="5"
                    value={formData.tempo_treino_min || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, tempo_treino_min: Number(event.target.value || 0) }))
                    }
                  />
                </div>
              </div>

              <Button type="submit" className="gap-2" disabled={isLoading}>
                <Save className="w-4 h-4" /> {isLoading ? "Salvando..." : "Salvar perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" /> Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Sessao autenticada com token e refresh token.</p>
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {achievements.map((a) => (
                <div key={a.label} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${a.unlocked ? "bg-yellow-50 text-yellow-800" : "bg-muted/50 text-muted-foreground"}`}>
                  {a.unlocked
                    ? <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0" />
                    : <Lock className="w-4 h-4 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.label}</p>
                    <p className="text-xs opacity-70">{a.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
