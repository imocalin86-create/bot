import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultContents = [
  { key: "welcome_message", description: "Приветственное сообщение бота" },
  { key: "about_message", description: "Информация о сервисе" },
  { key: "help_message", description: "Справочное сообщение" },
];

export default function Content() {
  const { getAuthHeader } = useAuth();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({ key: "", value: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const res = await axios.get(`${API}/content`, { headers: getAuthHeader() });
      setContents(res.data);
    } catch (error) {
      toast.error("Ошибка загрузки контента");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (content = null) => {
    if (content) {
      setEditingContent(content);
      setFormData({ key: content.key, value: content.value, description: content.description });
    } else {
      setEditingContent(null);
      setFormData({ key: "", value: "", description: "" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingContent) {
        await axios.put(`${API}/content/${editingContent.id}`, formData, { headers: getAuthHeader() });
        toast.success("Контент обновлен");
      } else {
        await axios.post(`${API}/content`, formData, { headers: getAuthHeader() });
        toast.success("Контент создан");
      }
      setDialogOpen(false);
      fetchContents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить контент?")) return;
    try {
      await axios.delete(`${API}/content/${id}`, { headers: getAuthHeader() });
      toast.success("Контент удален");
      fetchContents();
    } catch (error) {
      toast.error("Ошибка удаления");
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
    <div className="space-y-6" data-testid="content-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Управление контентом</h1>
          <p className="text-zinc-500">Настройка текстов и сообщений бота</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()} 
              className="bg-blue-500 hover:bg-blue-600 btn-glow"
              data-testid="add-content-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить контент
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-white/10 max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingContent ? "Редактировать контент" : "Добавить контент"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Ключ</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="bg-[#121212] border-white/10"
                  placeholder="welcome_message"
                  required
                  disabled={!!editingContent}
                  data-testid="content-key-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-zinc-400">Описание</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#121212] border-white/10"
                  placeholder="Описание контента"
                  required
                  data-testid="content-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Текст</Label>
                <Textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="bg-[#121212] border-white/10 min-h-[150px]"
                  placeholder="Текст сообщения..."
                  required
                  data-testid="content-value-input"
                />
                <p className="text-xs text-zinc-500">
                  Поддерживается Markdown: *жирный*, _курсив_
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  disabled={saving}
                  data-testid="content-submit-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingContent ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick templates */}
      {contents.length === 0 && (
        <Card className="bg-[#0A0A0A] border-white/10 border-dashed">
          <CardContent className="p-6">
            <h3 className="text-white font-medium mb-4">Рекомендуемые тексты</h3>
            <div className="grid gap-3">
              {defaultContents.map((item) => (
                <Button
                  key={item.key}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    setFormData({ key: item.key, value: "", description: item.description });
                    setEditingContent(null);
                    setDialogOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-3 text-blue-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{item.key}</p>
                    <p className="text-xs text-zinc-500">{item.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="table-header">Ключ</TableHead>
                <TableHead className="table-header">Описание</TableHead>
                <TableHead className="table-header">Текст</TableHead>
                <TableHead className="table-header">Обновлено</TableHead>
                <TableHead className="table-header text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                    Нет контента. Добавьте тексты для бота.
                  </TableCell>
                </TableRow>
              ) : (
                contents.map((content) => (
                  <TableRow key={content.id} className="border-white/10 table-row" data-testid={`content-row-${content.id}`}>
                    <TableCell>
                      <span className="mono text-blue-500">{content.key}</span>
                    </TableCell>
                    <TableCell className="text-zinc-400">{content.description}</TableCell>
                    <TableCell>
                      <p className="text-zinc-300 max-w-xs truncate">
                        {content.value}
                      </p>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {formatDate(content.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(content)}
                          className="text-zinc-400 hover:text-white"
                          data-testid={`content-edit-${content.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(content.id)}
                          className="text-zinc-400 hover:text-red-500"
                          data-testid={`content-delete-${content.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
