"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, CheckCircle2, AlertCircle, Loader2, Mail, Server, Shield, Send } from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    GEMINI_API_KEY: "",
    SMTP_HOST: "",
    SMTP_PORT: "587",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      setConfig(prev => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const applyGmailSettings = () => {
    setConfig(prev => ({
      ...prev,
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587"
    }));
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', color: '#6366f1' }}>
          <Settings size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted">Gestiona tus claves de API y preferencias del sistema</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Gemini Settings */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Key size={20} className="text-purple-500" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Gemini AI</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>API KEY</label>
              <input 
                type="password" 
                value={config.GEMINI_API_KEY} 
                onChange={(e) => updateConfig('GEMINI_API_KEY', e.target.value)}
                placeholder="AIzaSy..."
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontFamily: 'monospace' }} 
              />
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={20} className="text-pink-500" />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Email (SMTP)</h3>
            </div>
            <button 
              onClick={applyGmailSettings}
              style={{ padding: '6px 12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px', color: '#6366f1', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={12} /> Configurar Gmail
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 3 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>HOST</label>
                <input type="text" value={config.SMTP_HOST} onChange={(e) => updateConfig('SMTP_HOST', e.target.value)} placeholder="smtp.gmail.com" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>PUERTO</label>
                <input type="text" value={config.SMTP_PORT} onChange={(e) => updateConfig('SMTP_PORT', e.target.value)} placeholder="587" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>USUARIO / EMAIL</label>
              <input type="text" value={config.SMTP_USER} onChange={(e) => updateConfig('SMTP_USER', e.target.value)} placeholder="tu-email@gmail.com" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>CONTRASEÑA</label>
              <input type="password" value={config.SMTP_PASS} onChange={(e) => updateConfig('SMTP_PASS', e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status === 'success' && (
            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              <CheckCircle2 size={16} /> ¡Configuración guardada!
            </div>
          )}
        </div>
        <button onClick={saveSettings} disabled={isSaving} style={{ backgroundColor: '#6366f1', color: 'white', padding: '14px 40px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}>
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div style={{ marginTop: '40px', padding: '24px', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '20px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Shield className="text-blue-500" size={24} />
          <div>
            <h4 style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '4px' }}>Almacenamiento Seguro</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
              Todas tus credenciales se almacenan localmente. Para Gmail, usa una <b>Contraseña de Aplicación</b> si tienes activada la verificación en dos pasos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
