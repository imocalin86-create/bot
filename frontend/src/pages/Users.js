import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { User, Calendar, Clock, MessageCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Users() {
  const { getAuthHeader } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`, { headers: getAuthHeader() });
      setUsers(res.data);
    } catch (error) {
      toast.error("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Пользователи</h1>
        <p className="text-zinc-500">Список пользователей Telegram бота</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.length}</p>
              <p className="text-sm text-zinc-500">Всего</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.username).length}
              </p>
              <p className="text-sm text-zinc-500">С username</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => {
                  const created = new Date(u.created_at);
                  const today = new Date();
                  return created.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-sm text-zinc-500">Сегодня</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => {
                  const last = new Date(u.last_activity);
                  const now = new Date();
                  return (now - last) < 24 * 60 * 60 * 1000;
                }).length}
              </p>
              <p className="text-sm text-zinc-500">Активны 24ч</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="table-header">Пользователь</TableHead>
                <TableHead className="table-header">Telegram ID</TableHead>
                <TableHead className="table-header">Username</TableHead>
                <TableHead className="table-header">Регистрация</TableHead>
                <TableHead className="table-header">Последняя активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                    Нет пользователей
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-white/10 table-row" data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {(user.first_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.first_name} {user.last_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="mono text-zinc-400">{user.telegram_id}</span>
                    </TableCell>
                    <TableCell>
                      {user.username ? (
                        <a 
                          href={`https://t.me/${user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          @{user.username}
                        </a>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(user.last_activity)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
