"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

interface PromptFormProps {
  initialData?: any;
  isEdit?: boolean;
}

const DAYS = [
  { label: "Dom", value: 0 },
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function PromptForm({ initialData, isEdit }: PromptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    scheduleType: initialData?.scheduleType || "WEEKLY",
    scheduleTime: initialData?.scheduleTime || "05:00",
    scheduleDays: initialData?.scheduleDays || "1,4,0",
    scheduleDate: initialData?.scheduleDate || 1,
    scheduleMonth: initialData?.scheduleMonth || 0,
    intervalValue: initialData?.intervalValue || 30,
    intervalUnit: initialData?.intervalUnit || "minutes",
  });

  const selectedDays = formData.scheduleDays ? formData.scheduleDays.split(",").map(Number) : [];

  const toggleDay = (day: number) => {
    let newDays;
    if (selectedDays.includes(day)) {
      newDays = selectedDays.filter((d: number) => d !== day);
    } else {
      newDays = [...selectedDays, day];
    }
    setFormData({ ...formData, scheduleDays: newDays.sort().join(",") });
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este prompt? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${initialData.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/prompts/${initialData.id}` : "/api/prompts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Error al guardar el prompt");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <nav className="nav">
        <Link href="/" className="btn btn-outline">
          <ArrowLeft size={20} />
          Volver
        </Link>
        <div className="logo">AgentMesh</div>
      </nav>

      <div className="glass-card">
        <h1>{isEdit ? "Editar Prompt" : "Nuevo Prompt"}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Configura el prompt y su frecuencia de ejecución.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name">Nombre del Prompt</label>
            <input
              id="name"
              type="text"
              className="input"
              required
              placeholder="Ej: Reporte Diario"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="slug">Slug (ID para la API)</label>
            <input
              id="slug"
              type="text"
              className="input"
              required
              disabled={isEdit}
              placeholder="ej-reporte"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="content">Contenido del Prompt</label>
            <textarea
              id="content"
              className="textarea"
              rows={5}
              required
              placeholder="Instrucciones..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="type">Frecuencia</label>
            <select
              id="type"
              className="select"
              value={formData.scheduleType}
              onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
            >
              <option value="INTERVAL">Cada cierto tiempo (Intervalo)</option>
              <option value="WEEKLY">Semanal (Días específicos)</option>
              <option value="MONTHLY">Mensual (Día del mes)</option>
              <option value="YEARLY">Anual (Fecha específica)</option>
              <option value="SINGLE">Una sola vez</option>
            </select>
          </div>

          {formData.scheduleType === "INTERVAL" && (
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label>Cada cuánto</label>
                <input
                  type="number"
                  className="input"
                  value={formData.intervalValue}
                  onChange={(e) => setFormData({ ...formData, intervalValue: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label>Unidad</label>
                <select
                  className="select"
                  value={formData.intervalUnit}
                  onChange={(e) => setFormData({ ...formData, intervalUnit: e.target.value as any })}
                >
                  <option value="seconds">Segundos</option>
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                </select>
              </div>
            </div>
          )}

          {formData.scheduleType !== "INTERVAL" && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="time">Hora de ejecución</label>
              <input
                id="time"
                type="time"
                className="input"
                required
                value={formData.scheduleTime}
                onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              />
            </div>
          )}

          {formData.scheduleType === "WEEKLY" && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>Días de la semana</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`btn ${selectedDays.includes(day.value) ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.scheduleType === "MONTHLY" && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label>Día del mes (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input"
                value={formData.scheduleDate}
                onChange={(e) => setFormData({ ...formData, scheduleDate: parseInt(e.target.value) })}
              />
            </div>
          )}

          {formData.scheduleType === "YEARLY" && (
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label>Mes</label>
                <select
                  className="select"
                  value={formData.scheduleMonth}
                  onChange={(e) => setFormData({ ...formData, scheduleMonth: parseInt(e.target.value) })}
                >
                  {MONTHS.map((month, i) => (
                    <option key={i} value={i}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Día</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="input"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
            {isEdit && (
              <button 
                type="button" 
                onClick={handleDelete} 
                className="btn btn-danger" 
                style={{ flex: 0 }}
                disabled={loading}
              >
                <Trash2 size={20} />
              </button>
            )}
            
            <Link href="/" className="btn btn-outline" style={{ flex: 1 }}>
              Cancelar
            </Link>

            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {loading ? " Guardando..." : (isEdit ? " Actualizar Prompt" : " Crear Prompt")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
