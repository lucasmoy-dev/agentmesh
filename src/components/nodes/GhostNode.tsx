"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Plus } from 'lucide-react';

export const GhostNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{
        width: '120px',
        height: '120px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '2px dashed rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'rgba(255, 255, 255, 0.3)',
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={() => {
        if (data.onAdd) (data.onAdd as Function)();
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)';
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable} 
        style={{ opacity: 0, top: '0px' }} 
      />
      <div style={{
        padding: '8px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        display: 'flex'
      }}>
        <Plus size={24} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Añadir Nodo</span>
    </div>
  );
});

GhostNode.displayName = 'GhostNode';
