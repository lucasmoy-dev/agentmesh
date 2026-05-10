"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Merge, Settings2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const JoinNode = memo(({ data, isConnectable }: NodeProps) => {
  const isExecuting = data.isExecuting as boolean;
  const isFinished = data.isFinished as boolean;
  const isError = data.isError as boolean;

  return (
    <div style={{
      width: '120px',
      height: '120px',
      backgroundColor: '#18181b',
      border: isExecuting ? '3px solid #3b82f6' : isError ? '3px solid #ef4444' : isFinished ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.2)',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: isExecuting ? '0 0 30px rgba(59, 130, 246, 0.4)' : '0 8px 20px rgba(0,0,0,0.3)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.3)', border: '2px solid #0a0a0c', top: '-5px' }} />

      <div style={{
        backgroundColor: isExecuting ? 'rgba(59, 130, 246, 0.15)' : isFinished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
        padding: '8px', borderRadius: '12px',
        color: isExecuting ? '#3b82f6' : isFinished ? '#10b981' : 'rgba(255,255,255,0.5)',
        transition: 'all 0.3s ease'
      }}>
        {isExecuting ? <Loader2 className="animate-spin" size={24} /> : isError ? <AlertCircle size={24} /> : isFinished ? <CheckCircle2 size={24} /> : <Merge size={24} />}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{(data.name as string) || 'Concatenar'}</div>
        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>UNIR TEXTOS</div>
      </div>

      {!isExecuting && !isFinished && !isError && (
        <button 
          style={{ marginTop: '2px', padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={(e) => { e.stopPropagation(); if (data.onEdit) (data.onEdit as Function)(); }}
        >
          <Settings2 size={12} /> Editar
        </button>
      )}

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ width: '10px', height: '10px', background: isFinished ? '#10b981' : 'rgba(255,255,255,0.3)', border: '2px solid #0a0a0c', bottom: '-5px' }} />
    </div>
  );
});

JoinNode.displayName = 'JoinNode';
