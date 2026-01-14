import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyMFO = {
  name: "",
  description: "",
  logo_url: "",
  website_url: "",
  min_amount: 1000,
  max_amount: 30000,
  min_term: 1,
  max_term: 30,
  interest_rate: 1.0,
  approval_rate: 90,
  is_active: true
};

export default function MFOManagement() {
  const { getAuthHeader } = useAuth();
  const [mfos, setMfos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMFO, setEditingMFO] = useState(null);
  const [formData, setFormData] = useState(emptyMFO);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMFOs();
  }, []);

  const fetchMFOs = async () => {
    try {
      const res = await axios.get(`${API}/mfos`, { headers: getAuthHeader() });
      setMfos(res.data);
    } catch (error) {
      toast.error("Ошибка загрузки МФО");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mfo = null) => {
    if (mfo) {
      setEditingMFO(mfo);
      setFormData(mfo);
    } else {
      setEditingMFO(null);
      setFormData(emptyMFO);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingMFO) {
        await axios.put(`${API}/mfos/${editingMFO.id}`, formData, { headers: getAuthHeader() });
        toast.success("МФО обновлено");
      } else {
        await axios.post(`${API}/mfos`, formData, { headers: getAuthHeader() });
        toast.success("МФО создано");
      }
      setDialogOpen(false);
      fetchMFOs();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить МФО?")) return;
    try {
      await axios.delete(`${API}/mfos/${id}`, { headers: getAuthHeader() });
      toast.success("МФО удалено");
      fetchMFOs();
    } catch (error) {
      toast.error("Ошибка удаления");
    }
  };

  const handleToggleActive = async (mfo) => {
    try {
      await axios.put(`${API}/mfos/${mfo.id}`, { is_active: !mfo.is_active }, { headers: getAuthHeader() });
      fetchMFOs();
    } catch (error) {
      toast.error("Ошибка обновления");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mfo-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Управление МФО</h1>
          <p className="text-zinc-500">Добавляйте и редактируйте микрофинансовые организации</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()} 
              className="bg-blue-500 hover:bg-blue-600 btn-glow"
              data-testid="add-mfo-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить МФО
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingMFO ? "Редактировать МФО" : "Добавить МФО"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Название</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Сайт</Label>
                  <Input
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-website-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-zinc-400">Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#121212] border-white/10 min-h-[80px]"
                  required
                  data-testid="mfo-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">URL логотипа</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="bg-[#121212] border-white/10"
                  placeholder="https://..."
                  data-testid="mfo-logo-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Мин. сумма (₽)</Label>
                  <Input
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: parseInt(e.target.value) })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-min-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Макс. сумма (₽)</Label>
                  <Input
                    type="number"
                    value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: parseInt(e.target.value) })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-max-amount-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Мин. срок (дней)</Label>
                  <Input
                    type="number"
                    value={formData.min_term}
                    onChange={(e) => setFormData({ ...formData, min_term: parseInt(e.target.value) })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-min-term-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Макс. срок (дней)</Label>
                  <Input
                    type="number"
                    value={formData.max_term}
                    onChange={(e) => setFormData({ ...formData, max_term: parseInt(e.target.value) })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-max-term-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Процентная ставка (% в день)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-rate-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Уровень одобрения (%)</Label>
                  <Input
                    type="number"
                    value={formData.approval_rate}
                    onChange={(e) => setFormData({ ...formData, approval_rate: parseInt(e.target.value) })}
                    className="bg-[#121212] border-white/10"
                    required
                    data-testid="mfo-approval-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  data-testid="mfo-active-switch"
                />
                <Label className="text-zinc-400">Активен</Label>
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
                  data-testid="mfo-submit-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingMFO ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0A0A0A] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="table-header">Название</TableHead>
                <TableHead className="table-header">Сумма</TableHead>
                <TableHead className="table-header">Срок</TableHead>
                <TableHead className="table-header">Ставка</TableHead>
                <TableHead className="table-header">Переходы</TableHead>
                <TableHead className="table-header">Статус</TableHead>
                <TableHead className="table-header text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mfos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                    Нет добавленных МФО
                  </TableCell>
                </TableRow>
              ) : (
                mfos.map((mfo) => (
                  <TableRow key={mfo.id} className="border-white/10 table-row" data-testid={`mfo-row-${mfo.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {mfo.logo_url && (
                          <img 
                            src={mfo.logo_url} 
                            alt={mfo.name} 
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-white">{mfo.name}</p>
                          <a 
                            href={mfo.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                          >
                            Сайт <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {mfo.min_amount.toLocaleString()} - {mfo.max_amount.toLocaleString()} ₽
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {mfo.min_term} - {mfo.max_term} дн.
                    </TableCell>
                    <TableCell className="text-zinc-400">{mfo.interest_rate}%</TableCell>
                    <TableCell className="text-zinc-400">{mfo.clicks || 0}</TableCell>
                    <TableCell>
                      <Switch
                        checked={mfo.is_active}
                        onCheckedChange={() => handleToggleActive(mfo)}
                        data-testid={`mfo-toggle-${mfo.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(mfo)}
                          className="text-zinc-400 hover:text-white"
                          data-testid={`mfo-edit-${mfo.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(mfo.id)}
                          className="text-zinc-400 hover:text-red-500"
                          data-testid={`mfo-delete-${mfo.id}`}
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
