"use client";

import React, { useEffect, useState } from 'react';
import { Database, Search, Clock, Loader2, Trash2, Edit3, Eye, X, Save } from 'lucide-react';

export default function StoragePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/storage");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteItem = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro permanentemente?')) {
      try {
        await fetch(`/api/storage/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err) { console.error(err); }
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/storage/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editItem.label, content: editItem.content })
      });
      if (res.ok) {
        setEditItem(null);
        loadData();
      }
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  const filteredData = data.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '16px', color: 'white' }}>
            <div style={{ backgroundColor: '#ec4899', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <Database size={24} />
            </div>
            Almacén de Datos
          </h1>
          <p style={{ opacity: 0.5, marginTop: '8px' }}>Gestiona los resultados históricos capturados por tus automatizaciones.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por etiqueta..." 
              style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px 12px 48px', fontSize: '14px', color: 'white', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={loadData} style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
            <Clock size={18} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etiqueta</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vista Previa</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Act.</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '100px' }}>
                    <Loader2 className="animate-spin" color="#ec4899" size={32} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
                    No se encontraron registros en el almacén.
                  </td>
                </tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '14px', backgroundColor: 'rgba(236, 72, 153, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                      {item.label}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', opacity: 0.6 }}>
                      {item.content}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '13px', opacity: 0.4 }}>
                    {new Date(item.updatedAt).toLocaleDateString()} {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button onClick={() => setPreviewItem(item)} style={{ backgroundColor: 'transparent', border: 'none', color: 'white', opacity: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}>
                        <Eye size={18} />
                      </button>
                      <button onClick={() => setEditItem(item)} style={{ backgroundColor: 'transparent', border: 'none', color: '#6366f1', opacity: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}>
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', opacity: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ width: '90%', maxWidth: '700px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{previewItem.label}</span>
                <span style={{ fontSize: '12px', opacity: 0.4 }}>Previsualización</span>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
            </div>
            <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto', fontSize: '15px', lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
              {previewItem.content}
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <button onClick={() => setPreviewItem(null)} style={{ padding: '10px 24px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ width: '90%', maxWidth: '700px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Edit3 size={18} className="text-purple-500" />
                <span style={{ fontWeight: 'bold' }}>Editar Registro</span>
              </div>
              <button onClick={() => setEditItem(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
            </div>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Etiqueta (Label)</label>
                <input 
                  type="text" 
                  value={editItem.label} 
                  onChange={(e) => setEditItem({...editItem, label: e.target.value})}
                  style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Contenido</label>
                <textarea 
                  rows={8}
                  value={editItem.content} 
                  onChange={(e) => setEditItem({...editItem, content: e.target.value})}
                  style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', fontSize: '14px', resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <button onClick={() => setEditItem(null)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={isSaving} style={{ padding: '10px 24px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
