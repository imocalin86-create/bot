import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, Building2, FileText, MousePointerClick, Clock, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/stats`, { headers: getAuthHeader() }),
        axios.get(`${API}/analytics`, { headers: getAuthHeader() })
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Пользователи", 
      value: stats?.total_users || 0, 
      icon: Users, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      title: "МФО", 
      value: stats?.total_mfos || 0, 
      icon: Building2, 
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    { 
      title: "Заявки", 
      value: stats?.total_applications || 0, 
      icon: FileText, 
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    { 
      title: "Переходы", 
      value: stats?.total_clicks || 0, 
      icon: MousePointerClick, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      title: "Ожидают", 
      value: stats?.pending_applications || 0, 
      icon: Clock, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      title: "Конверсия", 
      value: `${stats?.conversion_rate || 0}%`, 
      icon: TrendingUp, 
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
  ];

  // Prepare chart data
  const usersChartData = analytics?.users_by_day?.length > 0 
    ? analytics.users_by_day 
    : [
        { date: "2024-01", count: 0 },
        { date: "2024-02", count: 0 },
        { date: "2024-03", count: 0 },
      ];

  const clicksChartData = analytics?.clicks_by_mfo?.length > 0
    ? analytics.clicks_by_mfo
    : [
        { name: "Нет данных", clicks: 0 }
      ];

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Дашборд</h1>
        <p className="text-zinc-500">Обзор статистики Telegram бота</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="bg-[#0A0A0A] border-white/10 card-hover animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
            data-testid={`stat-${stat.title.toLowerCase()}`}
          >
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users Chart */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Новые пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usersChartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717A" 
                    fontSize={12}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis stroke="#71717A" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0A0A0A', 
                      border: '1px solid #27272A',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clicks by MFO */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Переходы по МФО</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clicksChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis type="number" stroke="#71717A" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#71717A" 
                    fontSize={12}
                    width={100}
                    tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0A0A0A', 
                      border: '1px solid #27272A',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="clicks" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Status */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Статус заявок</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-3xl font-bold text-amber-500">
                {analytics?.applications_by_status?.pending || 0}
              </p>
              <p className="text-sm text-zinc-400 mt-1">Ожидают</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-3xl font-bold text-emerald-500">
                {analytics?.applications_by_status?.approved || 0}
              </p>
              <p className="text-sm text-zinc-400 mt-1">Одобрено</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-3xl font-bold text-red-500">
                {analytics?.applications_by_status?.rejected || 0}
              </p>
              <p className="text-sm text-zinc-400 mt-1">Отклонено</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
