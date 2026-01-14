import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, Legend 
} from "recharts";
import { TrendingUp, Users, MousePointerClick, FileText } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const { getAuthHeader } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/analytics`, { headers: getAuthHeader() });
      setAnalytics(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
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

  // Prepare pie chart data for application statuses
  const statusData = analytics?.applications_by_status 
    ? Object.entries(analytics.applications_by_status).map(([key, value]) => ({
        name: key === 'pending' ? 'Ожидают' : key === 'approved' ? 'Одобрено' : 'Отклонено',
        value
      }))
    : [];

  // Sample data if no real data
  const usersData = analytics?.users_by_day?.length > 0 
    ? analytics.users_by_day 
    : [
        { date: "01.12", count: 5 },
        { date: "02.12", count: 8 },
        { date: "03.12", count: 12 },
        { date: "04.12", count: 7 },
        { date: "05.12", count: 15 },
      ];

  const appsData = analytics?.applications_by_day?.length > 0
    ? analytics.applications_by_day
    : [
        { date: "01.12", count: 2 },
        { date: "02.12", count: 5 },
        { date: "03.12", count: 3 },
        { date: "04.12", count: 8 },
        { date: "05.12", count: 4 },
      ];

  const clicksData = analytics?.clicks_by_mfo?.length > 0
    ? analytics.clicks_by_mfo.slice(0, 5)
    : [
        { name: "МФО 1", clicks: 45 },
        { name: "МФО 2", clicks: 32 },
        { name: "МФО 3", clicks: 28 },
      ];

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Аналитика</h1>
        <p className="text-zinc-500">Подробная статистика работы бота</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Пользователей</p>
                <p className="text-2xl font-bold text-white">{analytics?.total_users || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Заявок</p>
                <p className="text-2xl font-bold text-white">{analytics?.total_applications || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Переходов</p>
                <p className="text-2xl font-bold text-white">{analytics?.total_clicks || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Конверсия</p>
                <p className="text-2xl font-bold text-white">
                  {analytics?.total_clicks > 0 
                    ? ((analytics.total_applications / analytics.total_clicks) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users Over Time */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Пользователи за неделю</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usersData}>
                  <defs>
                    <linearGradient id="colorUsersAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717A" 
                    fontSize={12}
                    tickFormatter={(value) => value.slice(5) || value}
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
                    fill="url(#colorUsersAnalytics)"
                    name="Пользователи"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Applications Over Time */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Заявки за неделю</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717A" 
                    fontSize={12}
                    tickFormatter={(value) => value.slice(5) || value}
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
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    name="Заявки"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Статусы заявок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0A0A0A', 
                        border: '1px solid #27272A',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-zinc-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  Нет данных для отображения
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MFO Clicks */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Топ МФО по переходам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clicksData} layout="vertical">
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
                  <Bar dataKey="clicks" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Переходы" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
