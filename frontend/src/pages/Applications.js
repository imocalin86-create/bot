import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, User, Phone, Building2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  pending: { label: "Ожидает", color: "bg-amber-500/20 text-amber-500 border-amber-500/30", icon: Clock },
  approved: { label: "Одобрено", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30", icon: CheckCircle },
  rejected: { label: "Отклонено", color: "bg-red-500/20 text-red-500 border-red-500/30", icon: XCircle }
};

export default function Applications() {
  const { getAuthHeader } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API}/applications`, { headers: getAuthHeader() });
      setApplications(res.data);
    } catch (error) {
      toast.error("Ошибка загрузки заявок");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${appId}/status?status=${newStatus}`, {}, { headers: getAuthHeader() });
      toast.success("Статус обновлен");
      fetchApplications();
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const filteredApps = filter === "all" 
    ? applications 
    : applications.filter(app => app.status === filter);

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
    <div className="space-y-6" data-testid="applications-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Заявки</h1>
          <p className="text-zinc-500">Управление заявками пользователей</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 bg-[#121212] border-white/10" data-testid="filter-select">
            <SelectValue placeholder="Фильтр" />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0A0A] border-white/10">
            <SelectItem value="all">Все заявки</SelectItem>
            <SelectItem value="pending">Ожидают</SelectItem>
            <SelectItem value="approved">Одобрены</SelectItem>
            <SelectItem value="rejected">Отклонены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {applications.filter(a => a.status === "pending").length}
              </p>
              <p className="text-sm text-zinc-500">Ожидают</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {applications.filter(a => a.status === "approved").length}
              </p>
              <p className="text-sm text-zinc-500">Одобрено</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {applications.filter(a => a.status === "rejected").length}
              </p>
              <p className="text-sm text-zinc-500">Отклонено</p>
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
                <TableHead className="table-header">МФО</TableHead>
                <TableHead className="table-header">Сумма</TableHead>
                <TableHead className="table-header">Срок</TableHead>
                <TableHead className="table-header">Телефон</TableHead>
                <TableHead className="table-header">Дата</TableHead>
                <TableHead className="table-header">Статус</TableHead>
                <TableHead className="table-header text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                    Нет заявок
                  </TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => {
                  const status = statusConfig[app.status];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={app.id} className="border-white/10 table-row" data-testid={`app-row-${app.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          <div>
                            <p className="font-medium text-white">{app.user_name}</p>
                            <p className="text-xs text-zinc-500 mono">ID: {app.user_telegram_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300">{app.mfo_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {app.amount.toLocaleString()} ₽
                      </TableCell>
                      <TableCell className="text-zinc-400">{app.term} дн.</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300 mono">{app.phone || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {formatDate(app.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select 
                          value={app.status} 
                          onValueChange={(value) => handleStatusChange(app.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-[#121212] border-white/10" data-testid={`status-select-${app.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10">
                            <SelectItem value="pending">Ожидает</SelectItem>
                            <SelectItem value="approved">Одобрить</SelectItem>
                            <SelectItem value="rejected">Отклонить</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
