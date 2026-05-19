import supabase from "../config/database";
import { hashPassword } from "./hashPassword";

export async function seedAdminUser() {
  try {
    const adminEmail = "admin@admin.com";
    const adminPassword = "admin"; // Senha padrão para o admin

    // Verifica se o admin já existe
    const { data: existingAdmin, error: searchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .single();

    // PGRST116 significa que não encontrou nenhum resultado, o que é esperado se for o primeiro setup
    if (searchError && searchError.code !== "PGRST116") {
      console.error("Erro ao buscar usuário admin:", searchError);
      return;
    }

    if (!existingAdmin) {
      const senhaHash = await hashPassword(adminPassword);

      const { error: insertError } = await supabase.from("users").insert([
        {
          nome: "Administrador",
          email: adminEmail,
          senha_hash: senhaHash,
        },
      ]);

      if (insertError) {
        console.error("Erro ao criar usuário admin principal:", insertError);
      } else {
        console.log(
          `Usuário admin criado com sucesso! Email: ${adminEmail} | Senha: ${adminPassword}`,
        );
      }
    } else {
      console.log("Usuário admin já existe no banco de dados.");
    }
  } catch (error) {
    console.error("Erro no script de seed do admin:", error);
  }
}
