"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  MarkerType,
  applyNodeChanges,
  NodeChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Brain, Clock, Play, Save, Loader2, X, Database, Trash2, ChevronLeft, Edit3, GitBranch, Settings2, AlertCircle, Calendar, Mail, FlaskConical, Hash, Type } from 'lucide-react';
import { GeminiNode } from './nodes/GeminiNode';
import { TriggerNode } from './nodes/TriggerNode';
import { GhostNode } from './nodes/GhostNode';
import { StorageNode } from './nodes/StorageNode';
import { WorkflowNode } from './nodes/WorkflowNode';
import { EmailNode } from './nodes/EmailNode';
import { JoinNode } from './nodes/JoinNode';

const nodeTypes = { 
  gemini: GeminiNode, 
  trigger: TriggerNode, 
  ghost: GhostNode, 
  storage: StorageNode, 
  workflow: WorkflowNode,
  email: EmailNode,
  join: JoinNode
};

const defaultEdgeOptions = {
  style: { strokeWidth: 3, stroke: '#6366f1' },
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function WorkflowEditor({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState("Cargando...");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [ghostMenu, setGhostMenu] = useState<{ x: number, y: number, parentId: string } | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null;

  const getRealNodes = (nds: Node[]) => nds.filter(n => n.type !== 'ghost');
  const getRealEdges = (eds: Edge[]) => eds.filter(e => !e.id.startsWith('ghost-edge'));

  const refreshGhostNodes = (currentNodes: Node[], currentEdges: Edge[]) => {
    const realNodes = getRealNodes(currentNodes);
    const realEdges = getRealEdges(currentEdges);
    if (realNodes.length === 0) {
      const ghostNode: Node = { id: 'ghost-initial', type: 'ghost', position: { x: 250, y: 150 }, data: { onAdd: () => setGhostMenu({ x: 250 + 60, y: 150 + 60, parentId: '' }) }, draggable: false, selectable: false };
      return { nodes: [ghostNode], edges: [] };
    }
    const ghostNodes: Node[] = [];
    const ghostEdges: Edge[] = [];
    realNodes.forEach(node => {
      if (!realEdges.some(edge => edge.source === node.id)) {
        const posX = node.position.x;
        const posY = node.position.y + 180;
        ghostNodes.push({ id: `ghost-${node.id}`, type: 'ghost', position: { x: posX, y: posY }, data: { onAdd: () => setGhostMenu({ x: posX + 60, y: posY + 60, parentId: node.id }) }, draggable: false, selectable: false });
        ghostEdges.push({ id: `ghost-edge-${node.id}`, source: node.id, target: `ghost-${node.id}`, type: 'smoothstep', style: { strokeDasharray: '5,5', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }, animated: true, selectable: false });
      }
    });
    return { nodes: [...realNodes, ...ghostNodes], edges: [...realEdges, ...ghostEdges] };
  };

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const [wfRes, listRes] = await Promise.all([fetch(`/api/workflows/${workflowId}`), fetch(`/api/workflows`)]);
        const data = await wfRes.json();
        const listData = await listRes.json();
        setWorkflowName(data.name);
        setAvailableWorkflows(listData.filter((w: any) => w.id !== workflowId));
        let mappedNodes = data.nodes.map((n: any) => ({
          id: n.id,
          type: n.type.toLowerCase().includes('workflow') ? 'workflow' : n.type.toLowerCase(),
          position: { x: n.positionX, y: n.positionY },
          data: { ...n.config, name: n.name || n.type, onEdit: () => setSelectedNodeId(n.id) },
        }));
        const mappedEdges = data.edges.map((e: any) => ({ id: e.id, source: e.sourceNodeId, target: e.targetNodeId, ...defaultEdgeOptions }));
        const { nodes: finalNodes, edges: finalEdges } = refreshGhostNodes(mappedNodes, mappedEdges);
        setNodes(finalNodes);
        setEdges(finalEdges);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [workflowId]);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      const updatedEdges = applyNodeChanges(changes, eds) as any;
      if (changes.some((c: any) => c.type === 'remove')) {
        const { nodes: finalNodes, edges: finalEdges } = refreshGhostNodes(nodes, updatedEdges);
        setNodes(finalNodes);
        return finalEdges;
      }
      return updatedEdges;
    });
  }, [nodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updatedRealNodes = applyNodeChanges(changes, nds);
      if (changes.some(c => c.type === 'position')) {
        const { nodes: finalNodes, edges: finalEdges } = refreshGhostNodes(updatedRealNodes, edges);
        setEdges(finalEdges);
        return finalNodes;
      }
      return updatedRealNodes;
    });
  }, [edges]);

  const addNodeManual = (type: string) => {
    const id = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: Node = { id, type, position: { x: 250, y: 150 }, data: { prompt: "", scheduleType: "MANUAL", onEdit: () => setSelectedNodeId(id) } };
    setNodes((nds) => {
      const updated = [...getRealNodes(nds), newNode];
      const { nodes: finalNodes, edges: finalEdges } = refreshGhostNodes(updated, edges);
      setEdges(finalEdges);
      return finalNodes;
    });
  };

  const addNodeFromGhost = (type: string) => {
    if (!ghostMenu) return;
    const { x, y, parentId } = ghostMenu;
    const id = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    setNodes((nds) => {
      const realNodes = getRealNodes(nds);
      const newNode: Node = { id, type, position: { x: x - 60, y: y - 60 }, data: { prompt: "", scheduleType: "MANUAL", onEdit: () => setSelectedNodeId(id) } };
      const updatedNodes = [...realNodes, newNode];
      setEdges((eds) => {
        const realEdges = getRealEdges(eds);
        const newEdges = parentId ? addEdge({ id: `e-${parentId}-${id}`, source: parentId, target: id, ...defaultEdgeOptions }, realEdges) : realEdges;
        const { nodes: finalNodes, edges: finalEdges } = refreshGhostNodes(updatedNodes, newEdges);
        setTimeout(() => { setNodes(finalNodes); setEdges(finalEdges); }, 0);
        return newEdges;
      });
      return updatedNodes;
    });
    setGhostMenu(null);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node));
  };

  const insertVariable = (variable: string) => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return;
    const currentBody = node.data.body || "";
    updateNodeData(selectedNodeId, { body: currentBody + ` {{${variable}}}` });
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    if (confirm('¿Estás seguro de eliminar este nodo?')) {
      setNodes((nds) => {
        const realNodes = getRealNodes(nds).filter(n => n.id !== selectedNodeId);
        const realEdges = getRealEdges(edges).filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);
        const { nodes: finalNodes, edges: finalEdges } = refreshGhostNodes(realNodes, realEdges);
        setEdges(finalEdges);
        return finalNodes;
      });
      setSelectedNodeId(null);
    }
  };

  const playWorkflow = async () => {
    if (isPlaying) return;
    setIsSaving(true);
    try {
      const activeNodes = getRealNodes(nodes);
      const activeEdges = getRealEdges(edges);
      await fetch(`/api/workflows/${workflowId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: workflowName, nodes: activeNodes, edges: activeEdges }) });
    } catch (err) { console.error(err); } finally { setIsSaving(false); }

    setIsPlaying(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, { method: 'POST' });
      const { executionId, success } = await res.json();
      if (!success) throw new Error("Error al iniciar ejecución");

      pollingRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/executions/${executionId}`);
        const data = await statusRes.json();
        if (!data.success) return;

        setNodes(nds => nds.map(n => {
          const step = data.steps.find((s: any) => s.nodeId === n.id);
          if (!step) return n;
          return { ...n, data: { ...n.data, isExecuting: step.status === 'RUNNING', isFinished: step.status === 'COMPLETED', isError: step.status === 'FAILED', lastExecutionOutput: step.output } };
        }));

        setEdges(eds => eds.map(e => {
          const sourceStep = data.steps.find((s: any) => s.nodeId === e.source);
          if (sourceStep?.status === 'COMPLETED') return { ...e, style: { ...e.style, stroke: '#10b981', strokeWidth: 4 }, animated: true };
          return e;
        }));

        if (data.status !== 'RUNNING') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPlaying(false);
          setTimeout(() => {
            setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isExecuting: false, isFinished: false, isError: false } })));
            setEdges(eds => eds.map(e => ({ ...e, ...defaultEdgeOptions })));
          }, 10000);
        }
      }, 2000);
    } catch (err: any) { alert(`Error: ${err.message}`); setIsPlaying(false); }
  };

  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const activeNodes = getRealNodes(nodes);
      const activeEdges = getRealEdges(edges);
      await fetch(`/api/workflows/${workflowId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: workflowName, nodes: activeNodes, edges: activeEdges }) });
      setSelectedNodeId(null);
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#0a0a0c', overflow: 'hidden' }}>
      <div style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backgroundColor: '#0a0a0c', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => router.push('/')} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', color: 'white', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <input type="text" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '20px', fontWeight: 'bold', color: 'white', outline: 'none', width: '300px' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => addNodeManual('gemini')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Edit3 size={14} /> Agregar Nodo
          </button>
          <button style={{ backgroundColor: isPlaying ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: isPlaying ? '#10b981' : 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={playWorkflow} disabled={isPlaying || isSaving}><Play size={14} fill="currentColor" /> {isPlaying ? 'En progreso...' : 'Probar'}</button>
          <button style={{ backgroundColor: '#6366f1', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={saveWorkflow} disabled={isSaving}><Save size={14} /> {isSaving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={(p) => {
              const newEdges = addEdge({ ...p, ...defaultEdgeOptions }, getRealEdges(edges));
              setEdges(newEdges);
              const { nodes: finalNodes } = refreshGhostNodes(nodes, newEdges);
              setNodes(finalNodes);
            }} 
            onNodeClick={(e, n) => {
              if (n.type !== 'ghost') {
                setSelectedNodeId(n.id);
                setSelectedEdgeId(null);
              }
            }}
            onEdgeClick={(e, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => { 
              setSelectedNodeId(null); 
              setSelectedEdgeId(null);
              setGhostMenu(null); 
            }} 
            nodeTypes={nodeTypes} 
            colorMode="dark" 
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={25} size={1} color="rgba(255,255,255,0.05)" />
            {ghostMenu && (
              <Panel position="top-left" style={{ position: 'absolute', left: ghostMenu.x, top: ghostMenu.y, zIndex: 1000 }}>
                <div style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!ghostMenu.parentId && <button onClick={() => addNodeFromGhost('trigger')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', color: '#3b82f6', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}><Clock size={14} /> Trigger</button>}
                  <button onClick={() => addNodeFromGhost('gemini')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '10px', color: '#a855f7', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}><Brain size={14} /> Gemini AI</button>
                  <button onClick={() => addNodeFromGhost('email')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '10px', color: '#ec4899', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}><Mail size={14} /> Enviar Email</button>
                   <button onClick={() => addNodeFromGhost('workflow')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '10px', color: '#34d399', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}><GitBranch size={14} /> Sub-Workflow</button>
                  <button onClick={() => addNodeFromGhost('storage')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}><Database size={14} /> Guardar DB</button>
                  <button onClick={() => addNodeFromGhost('join')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px', color: '#6366f1', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}><Merge size={14} /> Concatenar</button>
                </div>
              </Panel>
            )}
            <Controls />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div style={{ width: '400px', backgroundColor: '#111114', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Propiedades</h3>
              <button onClick={() => setSelectedNodeId(null)} style={{ backgroundColor: 'transparent', border: 'none', color: 'white', opacity: 0.3 }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>NOMBRE DEL NODO</label>
              <div style={{ position: 'relative' }}>
                <Edit3 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input 
                  type="text" 
                  value={selectedNode.data.name as string || ""} 
                  onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })} 
                  placeholder="Ej: Buscar noticias..."
                  style={{ width: '100%', padding: '12px 12px 12px 36px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px' }}
                />
              </div>
            </div>
            
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              {['gemini', 'workflow', 'email', 'storage'].includes(selectedNode.type || '') && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selectedNode.data.mockEnabled && selectedNode.type !== 'storage' ? '12px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FlaskConical size={16} className="text-purple-400" />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>Mockear Respuesta</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={!!selectedNode.data.mockEnabled} onChange={(e) => updateNodeData(selectedNode.id, { mockEnabled: e.target.checked })} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  {!!selectedNode.data.mockEnabled && selectedNode.type !== 'storage' && (
                    <textarea placeholder="Respuesta simulada..." style={{ width: '100%', height: '80px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#10b981', fontSize: '12px', fontFamily: 'monospace' }} value={(selectedNode.data.mockResponse as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { mockResponse: e.target.value })} />
                  )}
                </div>
              )}

              {selectedNode.type === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#ec4899', display: 'block', marginBottom: '8px' }}>DESTINATARIO (TO)</label>
                    <input type="text" placeholder="ejemplo@correo.com" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.to as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { to: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#ec4899', display: 'block', marginBottom: '8px' }}>ASUNTO (SUBJECT)</label>
                    <input type="text" placeholder="Asunto del correo" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.subject as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { subject: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#ec4899' }}>CUERPO (BODY)</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => insertVariable('output')} title="Insertar Output" style={{ padding: '2px 6px', backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '4px', color: '#ec4899', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>Output</button>
                        <button onClick={() => insertVariable('fecha')} title="Insertar Fecha" style={{ padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '9px', cursor: 'pointer' }}>Fecha</button>
                        <button onClick={() => insertVariable('fecha_hora')} title="Fecha y Hora" style={{ padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '9px', cursor: 'pointer' }}>F. Hora</button>
                        <button onClick={() => insertVariable('workflow_name')} title="Nombre Workflow" style={{ padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '9px', cursor: 'pointer' }}>Nombre</button>
                      </div>
                    </div>
                    <textarea placeholder="Escribe tu mensaje aquí..." style={{ width: '100%', height: '150px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '13px' }} value={(selectedNode.data.body as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { body: e.target.value })} />
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Usa los botones de arriba para insertar variables dinámicas.</p>
                  </div>
                </div>
              )}
              {/* ... trigger, gemini, etc ... */}
              {selectedNode.type === 'trigger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '8px' }}>TIPO DE TRIGGER</label>
                    <select style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.scheduleType as string) || "MANUAL"} onChange={(e) => updateNodeData(selectedNode.id, { scheduleType: e.target.value })}>
                      <option value="MANUAL">Manual (Solo botón Play)</option>
                      <option value="DAILY">Diario (Cada día)</option>
                      <option value="WEEKLY">Semanal (Días específicos)</option>
                      <option value="MONTHLY">Mensual (Día del mes)</option>
                      <option value="ANNUALLY">Anual (Fecha fija)</option>
                      <option value="ONCE">Una vez (Fecha y hora)</option>
                    </select>
                  </div>

                  {selectedNode.data.scheduleType !== 'MANUAL' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* TIME INPUT */}
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '8px' }}>HORA DE EJECUCIÓN</label>
                        <input type="time" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.time as string) || "12:00"} onChange={(e) => updateNodeData(selectedNode.id, { time: e.target.value })} />
                      </div>

                      {/* WEEKLY DAYS */}
                      {selectedNode.data.scheduleType === 'WEEKLY' && (
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '8px' }}>DÍAS DE LA SEMANA</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {WEEKDAYS.map(day => (
                              <button key={day} onClick={() => {
                                const currentDays = (selectedNode.data.days as string[]) || [];
                                const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
                                updateNodeData(selectedNode.id, { days: newDays });
                              }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid', borderColor: ((selectedNode.data.days as string[]) || []).includes(day) ? '#3b82f6' : 'rgba(255,255,255,0.1)', backgroundColor: ((selectedNode.data.days as string[]) || []).includes(day) ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: 'white', fontSize: '10px', cursor: 'pointer' }}>{day}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MONTHLY / ANNUAL DAY */}
                      {['MONTHLY', 'ANNUALLY'].includes(selectedNode.data.scheduleType as string) && (
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '8px' }}>DÍA DEL MES</label>
                          <input type="number" min="1" max="31" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.dayOfMonth as number) || 1} onChange={(e) => updateNodeData(selectedNode.id, { dayOfMonth: parseInt(e.target.value) })} />
                        </div>
                      )}

                      {/* ANNUAL MONTH */}
                      {selectedNode.data.scheduleType === 'ANNUALLY' && (
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '8px' }}>MES</label>
                          <select style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.month as number) || 1} onChange={(e) => updateNodeData(selectedNode.id, { month: parseInt(e.target.value) })}>
                            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                              <option key={m} value={i + 1}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* ONCE DATE */}
                      {selectedNode.data.scheduleType === 'ONCE' && (
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '8px' }}>FECHA ESPECÍFICA</label>
                          <input type="date" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.onceDate as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { onceDate: e.target.value })} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {selectedNode.type === 'gemini' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#a855f7' }}>PROMPT</label>
                  <textarea style={{ width: '100%', height: '250px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '13px' }} value={(selectedNode.data.prompt as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })} />
                </div>
              )}
              {selectedNode.type === 'workflow' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#34d399' }}>SUB-WORKFLOW</label>
                  <select style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.subWorkflowId as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { subWorkflowId: e.target.value, subWorkflowName: availableWorkflows.find(w => w.id === e.target.value)?.name || '' })}>
                    <option value="">Selecciona...</option>
                    {availableWorkflows.map((wf: any) => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                  </select>
                </div>
              )}
              {selectedNode.type === 'storage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>ID ALMACENAMIENTO</label>
                  <input type="text" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} value={(selectedNode.data.label as string) || ""} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} />
                </div>
              )}
            </div>
            
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={saveWorkflow} style={{ width: '100%', padding: '12px', backgroundColor: '#6366f1', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}>Guardar</button>
              <button onClick={deleteSelectedNode} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', fontWeight: 'bold' }}>Eliminar</button>
            </div>
          </div>
        )}

        {selectedEdge && (
          <div style={{ width: '400px', backgroundColor: '#111114', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Conexión</h3>
              <button onClick={() => setSelectedEdgeId(null)} style={{ backgroundColor: 'transparent', border: 'none', color: 'white', opacity: 0.3 }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', flex: 1 }}>
              <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                <GitBranch size={40} style={{ color: '#6366f1', marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>Esta conexión une dos nodos del flujo. Puedes eliminarla para desconectar los procesos.</p>
              </div>
            </div>
            
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => {
                  setEdges((eds) => {
                    const newEdges = eds.filter(e => e.id !== selectedEdgeId);
                    const { nodes: finalNodes } = refreshGhostNodes(nodes, newEdges);
                    setNodes(finalNodes);
                    return newEdges;
                  });
                  setSelectedEdgeId(null);
                }} 
                style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Eliminar Conexión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
