"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, CheckCircle2, AlertCircle, Loader2, Mail, Server, Shield, Send, ExternalLink, X, Brain } from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    GEMINI_API_KEY: "",
    GROQ_API_KEY: "",
    DEEPSEEK_API_KEY: "",
    OPENCODE_API_KEY: "",
    AI_DEFAULT_PROVIDER: "gemini",
    AI_DEFAULT_MODEL: "gemini-2.0-flash",
    SMTP_HOST: "",
    SMTP_PORT: "587",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: "",
    LOCAL_PC_API_KEY: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showGmailModal, setShowGmailModal] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      setConfig(prev => ({ 
        ...prev, 
        ...data,
        OPENCODE_API_KEY: data.OPENCODE_API_KEY || "sk-YIdYM3mzWm2wTIafjBsDdvFE7ucwOl0vkwaoPpJZyIgYfbUeOfxWc0o4qJPGiana"
      }));
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

  const handleGmailSetup = () => {
    setConfig(prev => ({
      ...prev,
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587"
    }));
    
    // Abrir link en nueva pestaña
    window.open("https://myaccount.google.com/apppasswords?continue=https://myaccount.google.com/security", "_blank");
    
    // Mostrar modal con instrucciones
    setShowGmailModal(true);
  };

  return (
    <div className="container py-8 max-w-4xl relative">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', color: '#6366f1' }}>
          <Settings size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted">Gestiona tus claves de API y preferencias del sistema</p>
        </div>
      </div>

      {/* Gmail Instructions Modal */}
      {showGmailModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '40px', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setShowGmailModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'transparent', border: 'none', color: 'white', opacity: 0.5, cursor: 'pointer' }}><X size={24} /></button>
            
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(234, 67, 53, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ea4335' }}>
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-bold">Configuración de Gmail</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>Hemos abierto la página de Google en una nueva pestaña.</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>Crea una nueva contraseña llamada <b>"AgentMesh"</b>.</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>Copia el código de 16 caracteres y <b>pégalo en el campo "CONTRASEÑA"</b> de esta página.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowGmailModal(false)}
              style={{ width: '100%', marginTop: '40px', padding: '16px', backgroundColor: '#6366f1', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Entendido, voy a pegarla
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* AI Settings */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Brain size={20} className="text-purple-500" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>AI</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>PROVEEDOR POR DEFECTO</label>
                <select
                  value={config.AI_DEFAULT_PROVIDER}
                  onChange={(e) => updateConfig('AI_DEFAULT_PROVIDER', e.target.value)}
                  style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                >
                  <option value="gemini">Gemini (Google)</option>
                  <option value="groq">Groq</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="opencode">OpenCode Zen</option>
                  <option value="local">Local PC (Raspberry)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>MODELO POR DEFECTO</label>
                <select
                  value={config.AI_DEFAULT_MODEL}
                  onChange={(e) => updateConfig('AI_DEFAULT_MODEL', e.target.value)}
                  style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                >
                  {config.AI_DEFAULT_PROVIDER === 'gemini' && (
                    <>
                      <optgroup label="Gemini Frontier (3.1 / 3.0)">
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (x2)</option>
                        <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (x0.5)</option>
                        <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (x2)</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (x1)</option>
                      </optgroup>
                      <optgroup label="Gemini Stable (2.5 / 2.0)">
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (x2)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (x1)</option>
                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (x0.5)</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (x0.8)</option>
                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (x0.5)</option>
                      </optgroup>
                      <optgroup label="Specialized / Open">
                        <option value="deep-research-max-preview-04-2026">Deep Research Max (x20)</option>
                        <option value="gemma-4-31b-it">Gemma 4 31B IT (x0.2)</option>
                      </optgroup>
                    </>
                  )}
                  {config.AI_DEFAULT_PROVIDER === 'groq' && (
                    <>
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B (x10)</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B (x1)</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B (x5)</option>
                    </>
                  )}
                  {config.AI_DEFAULT_PROVIDER === 'deepseek' && (
                    <>
                      <option value="deepseek-chat">DeepSeek Chat (x1)</option>
                      <option value="deepseek-reasoner">DeepSeek Reasoner (x5)</option>
                    </>
                  )}
                  {config.AI_DEFAULT_PROVIDER === 'opencode' && (
                    <>
                      <option value="big-pickle">Big Pickle (x1)</option>
                      <option value="claude-opus-4-7">Claude Opus 4.7 (x75)</option>
                      <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (x15)</option>
                    </>
                  )}
                  {config.AI_DEFAULT_PROVIDER === 'local' && (
                    <>
                      <option value="local-model">Local Model (PC)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>GEMINI API KEY</label>
                <a 
                  href="https://aistudio.google.com/app/rate-limit?timeRange=this-month" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '10px', color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                >
                  <ExternalLink size={10} /> Ver Uso y Cuota
                </a>
              </div>
              <input 
                type="password" 
                value={config.GEMINI_API_KEY} 
                onChange={(e) => updateConfig('GEMINI_API_KEY', e.target.value)}
                placeholder="AIzaSy..."
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontFamily: 'monospace' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>GROQ API KEY</label>
              <input 
                type="password" 
                value={config.GROQ_API_KEY} 
                onChange={(e) => updateConfig('GROQ_API_KEY', e.target.value)}
                placeholder="gsk_..."
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontFamily: 'monospace' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>DEEPSEEK API KEY</label>
              <input 
                type="password" 
                value={config.DEEPSEEK_API_KEY} 
                onChange={(e) => updateConfig('DEEPSEEK_API_KEY', e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontFamily: 'monospace' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>OPENCODE API KEY</label>
              <input 
                type="password" 
                value={config.OPENCODE_API_KEY} 
                onChange={(e) => updateConfig('OPENCODE_API_KEY', e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontFamily: 'monospace' }} 
              />
            </div>

            <div style={{ padding: '20px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }}>LOCAL PC / RASPBERRY API KEY</label>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/api/prompts/local-pc/prompt?apikey=${config.LOCAL_PC_API_KEY}`;
                    navigator.clipboard.writeText(url);
                    alert("¡URL copiada!");
                  }}
                  style={{ fontSize: '10px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                >
                  <ExternalLink size={10} /> Copiar URL de Polling
                </button>
              </div>
              <input 
                type="password" 
                value={config.LOCAL_PC_API_KEY} 
                onChange={(e) => updateConfig('LOCAL_PC_API_KEY', e.target.value)}
                placeholder="Ingresa una clave secreta para tu Raspberry"
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontFamily: 'monospace' }} 
              />
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                Usa esta URL en tu Raspberry Pi para ejecutar prompts localmente.
              </p>
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
              onClick={handleGmailSetup}
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
