import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Bot, Copy, ExternalLink, CheckCircle } from "lucide-react";

export default function Settings() {
  const { admin } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const botToken = "7806638733:AAFJcKj0-d8efDlOmN5EXMc7BnuwN1BWANM";
  const botUsername = "@mikrozaymy_bot";

  const copyToken = () => {
    navigator.clipboard.writeText(botToken);
    setCopied(true);
    toast.success("Токен скопирован");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Настройки</h1>
        <p className="text-zinc-500">Конфигурация бота и аккаунта</p>
      </div>

      {/* Bot Info */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            Telegram бот
          </CardTitle>
          <CardDescription>Информация о подключенном боте</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#121212] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-white">MicroLoan Bot</p>
                <p className="text-sm text-zinc-500">{botUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm text-emerald-500">Активен</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Bot Token</Label>
            <div className="flex gap-2">
              <Input
                value={botToken.slice(0, 20) + "..."}
                readOnly
                className="bg-[#121212] border-white/10 mono"
              />
              <Button 
                variant="outline" 
                onClick={copyToken}
                className="shrink-0"
                data-testid="copy-token-btn"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <a 
            href={`https://t.me/${botUsername.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-500 hover:underline"
          >
            Открыть бота в Telegram <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Аккаунт администратора</CardTitle>
          <CardDescription>Ваши данные для входа</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Имя</Label>
              <Input
                value={admin?.name || ""}
                readOnly
                className="bg-[#121212] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Email</Label>
              <Input
                value={admin?.email || ""}
                readOnly
                className="bg-[#121212] border-white/10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Инструкция по запуску бота</CardTitle>
          <CardDescription>Как запустить Telegram бота</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm font-medium">1</span>
              <p className="text-zinc-300">Убедитесь, что бот запущен на сервере командой:</p>
            </div>
            <pre className="p-4 rounded-lg bg-[#121212] border border-white/10 text-zinc-300 mono text-sm overflow-x-auto">
              python telegram_bot.py
            </pre>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm font-medium">2</span>
              <p className="text-zinc-300">Добавьте МФО в разделе "МФО" админ-панели</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm font-medium">3</span>
              <p className="text-zinc-300">Настройте тексты бота в разделе "Контент"</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm font-medium">4</span>
              <p className="text-zinc-300">Бот готов к работе! Пользователи могут начать с /start</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Возможности бота</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Каталог МФО", desc: "Список всех активных микрофинансовых организаций" },
              { title: "Калькулятор займа", desc: "Расчет переплаты и итоговой суммы" },
              { title: "Подача заявки", desc: "Оформление заявки на займ прямо в боте" },
              { title: "Сравнение предложений", desc: "Сортировка МФО по ставке и условиям" },
              { title: "Аналитика переходов", desc: "Отслеживание кликов по каждому МФО" },
              { title: "Статистика пользователей", desc: "Данные о всех пользователях бота" },
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#121212] border border-white/10">
                <h4 className="font-medium text-white mb-1">{feature.title}</h4>
                <p className="text-sm text-zinc-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
