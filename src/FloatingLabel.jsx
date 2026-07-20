import React from 'react';
import { Html } from '@react-three/drei';
import { useCameraState } from './CameraState';

export default function FloatingLabel({ text, position = [0, 1.2, 0] }) {
  const { occluders } = useCameraState() || {};

  return (
    <Html
      position={position}
      center
      zIndexRange={[100, 0]}
      occlude={occluders || []}
    >
      <div style={{
        backgroundColor: 'rgba(27, 36, 48, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(176, 141, 87, 0.25)',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '12px',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        minWidth: 'max-content'
      }}>
        <span style={{ color: '#B08D57', fontWeight: 'bold' }}>{text}</span>
      </div>
    </Html>
  );
}
