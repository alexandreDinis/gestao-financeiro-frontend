"use client";

import { useState } from "react";
import Link from "next/link";
import { setCookie } from "@/lib/cookies";
import { api } from "@/lib/axios";
import { parseJwt } from "@/lib/jwt";
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
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Real API authentication call
      const response = await api.post("/auth/login", { email, senha });
      const token = response.data.data?.accessToken || response.data.accessToken;
      
      if (token) {
         setCookie("access_token", token, 7);
         const decoded = parseJwt(token);
         
         // Branch navigation based on Role
         if (decoded?.role === "SUPER_ADMIN") {
             window.location.href = "/admin";
         } else {
             window.location.href = "/dashboard";
         }
      } else {
         throw new Error("Formato de token inválido");
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao realizar login. Verifique suas credenciais.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
          GESTÃO <span className="neon-text">SAAS</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Controle financeiro do futuro.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="glass-panel border-t-primary/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Informe suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-destructive/20 border border-destructive/50 text-destructive text-sm p-3 rounded-md text-center">
                  {error}
                </div>
              )}
              
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-black/40 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <PasswordInput 
                    id="password" 
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 bg-black/40 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary/80 hover:bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Autenticando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Criar nova assinatura
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
