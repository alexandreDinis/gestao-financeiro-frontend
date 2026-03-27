"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { User, Mail, Lock, Building } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    tenantName: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Mock logic until API is fully ready
      // await api.post("/auth/register", formData);
      
      // Temporary Mock:
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1000);

    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar conta. Verifique os dados fornecidos.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
          CRIAR <span className="neon-text">CONTA</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece a gerenciar suas finanças agora.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="glass-panel border-t-primary/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Assinatura SaaS</CardTitle>
            <CardDescription className="text-center">
              Preencha os dados para iniciar seu período gratuito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-destructive/20 border border-destructive/50 text-destructive text-sm p-3 rounded-md text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    id="nome" 
                    type="text" 
                    placeholder="João Silva" 
                    value={formData.nome}
                    onChange={handleChange}
                    className="pl-10 bg-black/40 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-black/40 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantName">Nome da Empresa/Residência</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    id="tenantName" 
                    type="text" 
                    placeholder="Residência Silva" 
                    value={formData.tenantName}
                    onChange={handleChange}
                    className="pl-10 bg-black/40 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <PasswordInput 
                    id="senha" 
                    value={formData.senha}
                    onChange={handleChange}
                    className="pl-10 bg-black/40 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary/80 hover:bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-300 mt-6"
                disabled={isLoading}
              >
                {isLoading ? "Criando Conta..." : "Registrar Conta"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Já possui uma conta?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
