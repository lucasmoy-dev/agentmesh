"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Settings2, Loader2, CheckCircle2 } from 'lucide-react';

export const TriggerNode = memo(({ data, isConnectable }: NodeProps) => {
  const isExecuting = data.isExecuting as boolean;
  const isFinished = data.isFinished as boolean;

  return (
    <div style={{
      width: '120px',
      height: '120px',
      backgroundColor: '#18181b',
      border: isExecuting ? '3px solid #10b981' : isFinished ? '2px solid #10b981' : '2px solid #3b82f6',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: isExecuting ? '0 0 30px rgba(16, 185, 129, 0.4)' : isFinished ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 8px 20px rgba(59, 130, 246, 0.2)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        backgroundColor: isExecuting || isFinished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
        padding: '8px',
        borderRadius: '12px',
        color: isExecuting || isFinished ? '#10b981' : '#3b82f6',
        transition: 'all 0.3s ease'
      }}>
        {isExecuting ? <Loader2 className="animate-spin" size={24} /> : isFinished ? <CheckCircle2 size={24} /> : <Clock size={24} />}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{(data.name as string) || 'Trigger'}</div>
        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>{(data.scheduleType as string) || 'MANUAL'}</div>
      </div>

      {!isExecuting && (
        <button 
          style={{
            marginTop: '2px',
            padding: '4px 12px',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (data.onEdit) (data.onEdit as Function)();
          }}
        >
          <Settings2 size={12} /> Editar
        </button>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable} 
        style={{ width: '12px', height: '12px', background: isFinished ? '#10b981' : '#f59e0b', border: '3px solid #0a0a0c', bottom: '-6px' }} 
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
