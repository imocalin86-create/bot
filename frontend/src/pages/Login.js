import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Bot, Loader2 } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ email: "", password: "", name: "" });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success("Успешный вход!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData.email, registerData.password, registerData.name);
      toast.success("Регистрация успешна!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 mb-4">
            <Bot className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">MicroLoan Bot</h1>
          <p className="text-zinc-500">Админ-панель управления ботом</p>
        </div>

        <Card className="bg-[#0A0A0A] border-white/10">
          <Tabs defaultValue="login">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-[#121212]">
                <TabsTrigger value="login" data-testid="login-tab">Вход</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Регистрация</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-zinc-400">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="bg-[#121212] border-white/10 focus:border-blue-500"
                      required
                      data-testid="login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-zinc-400">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-[#121212] border-white/10 focus:border-blue-500"
                      required
                      data-testid="login-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-500 hover:bg-blue-600 btn-glow"
                    disabled={loading}
                    data-testid="login-submit"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Войти
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-zinc-400">Имя</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Ваше имя"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="bg-[#121212] border-white/10 focus:border-blue-500"
                      required
                      data-testid="register-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-zinc-400">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="bg-[#121212] border-white/10 focus:border-blue-500"
                      required
                      data-testid="register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-zinc-400">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="bg-[#121212] border-white/10 focus:border-blue-500"
                      required
                      data-testid="register-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-500 hover:bg-blue-600 btn-glow"
                    disabled={loading}
                    data-testid="register-submit"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Зарегистрироваться
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-zinc-600 text-sm mt-6">
          Панель управления Telegram ботом микрозаймов
        </p>
      </div>
    </div>
  );
}
