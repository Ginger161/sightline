import React from 'react';
import { Html } from '@react-three/drei';
import { useCameraState } from './CameraState';

export default function FloatingLabel({ title, text, position = [0, 1.2, 0] }) {
  const { occluders } = useCameraState() || {};
  const isLongText = text && text.length > 40;
  const showTitle = title && title !== text;

  return (
    <Html
      position={position}
      center
      zIndexRange={[100, 0]}
      occlude={occluders || []}
    >
      <div style={{
        backgroundColor: 'rgba(27, 36, 48, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(176, 141, 87, 0.4)',
        color: '#ffffff',
        padding: isLongText ? '16px 20px' : '8px 16px',
        borderRadius: '12px',
        fontFamily: 'inherit',
        fontSize: '13.5px',
        fontWeight: '500',
        lineHeight: '1.5',
        boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: showTitle || isLongText ? 'flex-start' : 'center',
        gap: '6px',
        whiteSpace: isLongText ? 'normal' : 'nowrap',
        width: isLongText ? 'max-content' : 'auto',
        maxWidth: isLongText ? '420px' : 'none',
        wordBreak: 'break-word',
        textAlign: showTitle || isLongText ? 'left' : 'center'
      }}>
        {showTitle && (
          <div style={{ color: '#B08D57', fontWeight: '700', fontSize: '14px', letterSpacing: '0.02em' }}>
            {title}
          </div>
        )}
        <span style={{ color: '#F4E8C1', fontWeight: '400' }}>{text}</span>
      </div>
    </Html>
  );
}
