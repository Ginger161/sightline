import React, { useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Environment, useProgress } from '@react-three/drei';
import CameraController from './CameraController';
import RoomShell from './RoomShell';
import SeatingLayout, { checkIsNeighbor } from './SeatingLayout';
import { useCameraState, useHoverState, CameraStateProvider } from './CameraState';

function LoadingScreen() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  
  React.useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#1B2430',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'all' : 'none',
      transition: 'opacity 0.5s ease-out'
    }}>
      <h1 style={{ color: '#B08D57', margin: '0 0 16px 0', fontFamily: 'inherit', fontWeight: 'bold' }}>Loading Venue</h1>
      <div style={{ width: '200px', height: '4px', backgroundColor: 'rgba(176, 141, 87, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#B08D57', transition: 'width 0.2s ease-out' }} />
      </div>
      <p style={{ color: '#A09A8F', marginTop: '12px', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>{Math.round(progress)}%</p>
    </div>
  );
}

function SceneContent() {
  const { clearLabel } = useCameraState() || {};
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(to bottom, #5B6D82, #7B8CA3)', position: 'relative' }}>
      <Canvas 
        camera={{ position: [25, 20, 35], fov: 45 }}
        onPointerMissed={() => {
          if (clearLabel) clearLabel();
        }}
      >
        <CameraController />
        
        <hemisphereLight skyColor="#ffffff" groundColor="#b0b0b0" intensity={0.7} />
        <directionalLight 
          position={[10, 25, 15]} 
          intensity={1.0} 
        />
        <pointLight position={[0, 15, -10]} intensity={0.6} />
        
        <Environment preset="city" />

        <group position={[0, 0, 0]}>
          <RoomShell />
          <SeatingLayout />
          <PanelDodger leftPanelRef={leftPanelRef} rightPanelRef={rightPanelRef} />
        </group>
      </Canvas>
      <SceneUI leftPanelRef={leftPanelRef} rightPanelRef={rightPanelRef} />
      <LoadingScreen />
    </div>
  );
}

import { getPreset } from './presets';

function PanelDodger({ leftPanelRef, rightPanelRef }) {
  const { camera, size } = useThree();
  const { status, activeLabel, targetSeat, activePreset } = useCameraState() || {};
  const { hoveredSeatId } = useHoverState() || {};
  const { seats } = getPreset(activePreset);

  let displaySeat = null;
  if (hoveredSeatId) {
    displaySeat = seats.find(s => s.id === hoveredSeatId);
  } else if (activeLabel && activeLabel.id) {
    displaySeat = seats.find(s => s.id === activeLabel.id);
  } else if (status === 'pov' && targetSeat) {
    displaySeat = targetSeat;
  }

  const offsets = useRef({ left: 0, right: 0 });
  const targets = useRef({ left: 0, right: 0 });
  const vec = useRef(new THREE.Vector3());
  const prevCameraState = useRef({ 
    position: new THREE.Vector3(), 
    rotation: new THREE.Euler(), 
    width: 0, 
    height: 0 
  });
  const prevSeatId = useRef(null);

  useFrame(() => {
    const currentSeatId = displaySeat ? displaySeat.id : null;
    const camPos = camera.position;
    const camRot = camera.rotation;

    const needsProjectionUpdate = 
      currentSeatId !== prevSeatId.current ||
      !camPos.equals(prevCameraState.current.position) ||
      !camRot.equals(prevCameraState.current.rotation) ||
      size.width !== prevCameraState.current.width ||
      size.height !== prevCameraState.current.height;

    if (needsProjectionUpdate) {
      prevSeatId.current = currentSeatId;
      prevCameraState.current.position.copy(camPos);
      prevCameraState.current.rotation.copy(camRot);
      prevCameraState.current.width = size.width;
      prevCameraState.current.height = size.height;

      let targetLeft = 0;
      let targetRight = 0;

      if (displaySeat) {
        vec.current.set(displaySeat.position.x, displaySeat.position.y, displaySeat.position.z);
        vec.current.project(camera);

        if (vec.current.z < 1) {
          const screenX = (vec.current.x * 0.5 + 0.5) * size.width;
          const screenY = (-(vec.current.y * 0.5) + 0.5) * size.height;

          const panelCenterY = size.height / 2;
          const panelHalfHeight = 180;
          const panelTop = panelCenterY - panelHalfHeight;
          const panelBottom = panelCenterY + panelHalfHeight;

          if (screenX > 20 && screenX < 340) {
            if (screenY > panelTop - 50 && screenY < panelBottom + 50) {
              if (screenY > panelCenterY) targetLeft = -220;
              else targetLeft = 220;
            }
          }

          if (screenX > size.width - 340 && screenX < size.width - 20) {
            if (screenY > panelTop - 50 && screenY < panelBottom + 50) {
              if (screenY > panelCenterY) targetRight = -220;
              else targetRight = 220;
            }
          }
        }
      }
      
      targets.current.left = targetLeft;
      targets.current.right = targetRight;
    }

    const EPSILON = 0.1;
    const leftDiff = targets.current.left - offsets.current.left;
    const rightDiff = targets.current.right - offsets.current.right;

    const leftAnimating = Math.abs(leftDiff) > EPSILON;
    const rightAnimating = Math.abs(rightDiff) > EPSILON;

    if (!needsProjectionUpdate && !leftAnimating && !rightAnimating && leftDiff === 0 && rightDiff === 0) {
      return; // Skip all work: nothing changed, and animations are perfectly settled
    }

    if (leftAnimating) {
      offsets.current.left += leftDiff * 0.15;
    } else if (leftDiff !== 0) {
      offsets.current.left = targets.current.left; // snap
    }

    if (rightAnimating) {
      offsets.current.right += rightDiff * 0.15;
    } else if (rightDiff !== 0) {
      offsets.current.right = targets.current.right; // snap
    }

    // Only mutate DOM if the offset actually changed this frame
    if (leftAnimating || leftDiff !== 0) {
      if (leftPanelRef.current) {
        leftPanelRef.current.style.transform = `translateY(calc(-50% + ${offsets.current.left}px))`;
      }
    }
    
    if (rightAnimating || rightDiff !== 0) {
      if (rightPanelRef.current) {
        rightPanelRef.current.style.transform = `translateY(calc(-50% + ${offsets.current.right}px))`;
      }
    }
  });

  return null;
}

function PresetSelector() {
  const { status, activePreset, switchPreset } = useCameraState() || {};
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status !== 'orbit' && status !== 'pov' && status !== 'preset-switching') return null;

  const presetsList = [
    { id: 'banquet-default', label: 'Awards Ceremony' },
    { id: 'mega-church', label: 'Mega-Church' },
    { id: 'wedding', label: 'Wedding/Ceremony' },
    { id: 'conference-theatre', label: 'Conference/Theatre' }
  ];

  const currentPresetObj = presetsList.find(p => p.id === activePreset) || presetsList[0];

  const handleSelect = (presetId) => {
    setIsOpen(false);
    if (presetId === activePreset) return;
    if (switchPreset) switchPreset(presetId);
  };

  return (
    <div 
      ref={dropdownRef}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      {/* Expanded Dropdown Menu Panel (Expands Upward) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            left: 'auto',
            minWidth: '210px',
            backgroundColor: 'rgba(27, 36, 48, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(176, 141, 87, 0.35)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {presetsList.map(p => {
            const isActive = p.id === activePreset;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                style={{
                  backgroundColor: isActive ? 'rgba(176, 141, 87, 0.15)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #C19D67' : '3px solid transparent',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  color: isActive ? '#F4E8C1' : '#A0AABF',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F4E8C1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#A0AABF';
                  }
                }}
              >
                <span>{p.label}</span>
                {isActive && (
                  <span style={{ fontSize: '11px', color: '#C19D67' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Collapsed Dropdown Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(27, 36, 48, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(176, 141, 87, 0.4)',
          borderRadius: '12px',
          padding: '10px 16px',
          color: '#F4E8C1',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        <span>{currentPresetObj.label}</span>
        <span style={{ fontSize: '10px', color: '#C19D67', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
    </div>
  );
}

function SceneUI({ leftPanelRef, rightPanelRef }) {
  const { 
    status, 
    fadeOpacity, 
    activeLabel, 
    returnToOverview, 
    targetSeat, 
    ticketedSeatId, 
    setTicketedSeatId, 
    groupSeatIds = [],
    setGroupSeatIds,
    isGroupSelectionActive,
    setIsGroupSelectionActive,
    groupTargetCount = 2,
    setGroupTargetCount,
    pendingGroupSeatIds = [],
    setPendingGroupSeatIds,
    resetBookingState,
    activePreset 
  } = useCameraState() || {};
  
  const { seats } = getPreset(activePreset);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isGroupSizeModalOpen, setIsGroupSizeModalOpen] = useState(false);
  const [isGroupConfirmModalOpen, setIsGroupConfirmModalOpen] = useState(false);
  const [isTicketScreenOpen, setIsTicketScreenOpen] = useState(false);
  const { hoveredSeatId } = useHoverState() || {};

  React.useEffect(() => {
    window.testClickBack = returnToOverview;
  }, [returnToOverview]);

  // Resolve display seat
  let displaySeat = null;
  if (hoveredSeatId) {
    displaySeat = seats.find(s => s.id === hoveredSeatId);
  } else if (activeLabel && activeLabel.id) {
    displaySeat = seats.find(s => s.id === activeLabel.id);
  } else if (status === 'pov' && targetSeat) {
    displaySeat = targetSeat;
  }

  // Calculate nearby seats
  let nearbySeats = [];
  if (displaySeat) {
    nearbySeats = seats.filter(s => checkIsNeighbor(s, displaySeat)).slice(0, 6);
  }

  const panelsVisible = !!displaySeat;
  const isBookingActive = !!(ticketedSeatId || groupSeatIds.length > 0);

  // Group calculations
  const pendingSeatObjects = pendingGroupSeatIds.map(id => seats.find(s => s.id === id)).filter(Boolean);
  const groupTotalPrice = pendingSeatObjects.reduce((acc, s) => acc + (s.price || 0), 0);

  const bookedPrimarySeat = seats.find(s => s.id === ticketedSeatId);
  const bookedGroupSeats = groupSeatIds.map(id => seats.find(s => s.id === id)).filter(Boolean);
  const totalBookedPrice = (bookedPrimarySeat?.price || 0) + bookedGroupSeats.reduce((acc, s) => acc + (s.price || 0), 0);

  return (
    <>
      {/* Preset Selector Control */}
      <PresetSelector />

      {/* Book for a Group Button (Orbit State - Top Left) */}
      {status === 'orbit' && !isBookingActive && !isGroupSelectionActive && (
        <button
          onClick={() => setIsGroupSizeModalOpen(true)}
          style={{
            position: 'fixed',
            top: '24px',
            left: '24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(27, 36, 48, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(176, 141, 87, 0.4)',
            borderRadius: '12px',
            padding: '10px 16px',
            color: '#F4E8C1',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(27, 36, 48, 0.95)';
            e.currentTarget.style.borderColor = '#B08D57';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(27, 36, 48, 0.85)';
            e.currentTarget.style.borderColor = 'rgba(176, 141, 87, 0.4)';
          }}
        >
          <span>👥 Book for a Group</span>
        </button>
      )}

      {/* Persistent Group Selection Banner */}
      {isGroupSelectionActive && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: 'rgba(27, 36, 48, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(76, 201, 240, 0.5)',
          borderRadius: '16px',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          color: '#ffffff',
          fontFamily: '"Inter", sans-serif'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#4CC9F0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group Selection Mode
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>
              {pendingGroupSeatIds.length} of {groupTargetCount} seats selected
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setIsGroupSelectionActive(false);
                setPendingGroupSeatIds([]);
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#A09A8F',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              disabled={pendingGroupSeatIds.length !== groupTargetCount}
              onClick={() => setIsGroupConfirmModalOpen(true)}
              style={{
                backgroundColor: pendingGroupSeatIds.length === groupTargetCount ? '#4CC9F0' : 'rgba(76, 201, 240, 0.3)',
                color: pendingGroupSeatIds.length === groupTargetCount ? '#1B2430' : '#888',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: pendingGroupSeatIds.length === groupTargetCount ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              Confirm Group ({pendingGroupSeatIds.length}/{groupTargetCount})
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Fade Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#1B2430',
          opacity: fadeOpacity || 0,
          pointerEvents: 'none',
          transition: 'opacity 300ms ease-in-out',
          zIndex: 9999
        }}
      />

      {/* Back to Overview Button */}
      {status === 'pov' && (
        <button
          className="action-btn-bl glass-dark"
          onClick={returnToOverview}
          style={{
            border: '1px solid rgba(176, 141, 87, 0.25)',
            color: '#B08D57',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000,
            padding: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = 'rgba(27, 36, 48, 0.85)';
            e.currentTarget.style.color = '#d1a86b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'rgba(27, 36, 48, 0.65)';
            e.currentTarget.style.color = '#B08D57';
          }}
          aria-label="Back to Overview"
          title="Back to Overview"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      )}

      {/* Obstruction Warning Pill in POV */}
      {status === 'pov' && targetSeat && targetSeat.obstructionLevel && targetSeat.obstructionLevel !== 'clear' && (
        <div style={{
          position: 'fixed',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: targetSeat.obstructionLevel === 'heavy' ? 'rgba(110, 42, 52, 0.85)' : 'rgba(151, 99, 77, 0.85)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)',
          border: `1px solid ${targetSeat.obstructionLevel === 'heavy' ? '#ff4d4d' : '#ffb366'}`,
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          {targetSeat.obstructionLevel === 'heavy' ? '⚠️ Heavy Obstruction' : '⚠️ Partial View'}
        </div>
      )}

      {/* LEFT panel — Seat Details */}
      <div 
        ref={leftPanelRef}
        className="panel-left glass-dark"
        style={{
        border: '1px solid rgba(176, 141, 87, 0.25)',
        color: '#E8E4DA',
        padding: '20px',
        borderRadius: '12px',
        opacity: panelsVisible ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 300ms ease-in-out',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        {displaySeat && (
          <>
            <h3 style={{ margin: '0 0 16px 0', color: '#B08D57', fontSize: '18px', borderBottom: '1px solid rgba(176, 141, 87, 0.2)', paddingBottom: '12px' }}>
              Seat {displaySeat.id}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#A09A8F' }}>Tier</span>
                <strong>{displaySeat.tier}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#A09A8F' }}>Price</span>
                <strong>₦{displaySeat.price.toLocaleString('en-NG')}</strong>
              </div>
              {displaySeat.status !== 'available' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A09A8F' }}>Status</span>
                  <strong style={{ 
                    color: displaySeat.status === 'sold' ? '#ff4d4d' : '#A19E98',
                    textTransform: 'capitalize'
                  }}>{displaySeat.status}</strong>
                </div>
              )}
              {displaySeat.obstructionLevel !== 'clear' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#A09A8F' }}>View</span>
                  <strong style={{ color: displaySeat.obstructionLevel === 'heavy' ? '#ff4d4d' : '#ffb366' }}>
                    {displaySeat.obstructionLevel === 'heavy' ? 'Heavy Obstruction' : 'Partial View'}
                  </strong>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT panel — Nearby */}
      <div 
        ref={rightPanelRef}
        className="panel-right glass-dark"
        style={{
        border: '1px solid rgba(176, 141, 87, 0.25)',
        color: '#E8E4DA',
        padding: '20px',
        borderRadius: '12px',
        opacity: panelsVisible ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 300ms ease-in-out',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#B08D57', fontSize: '18px', borderBottom: '1px solid rgba(176, 141, 87, 0.2)', paddingBottom: '12px' }}>
          Nearby
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          {nearbySeats.length > 0 ? nearbySeats.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <span>{s.id}</span>
              <span style={{ color: '#A09A8F' }}>₦{s.price.toLocaleString('en-NG')}</span>
            </div>
          )) : (
            <div style={{ color: '#A09A8F', fontStyle: 'italic' }}>No neighbors found.</div>
          )}
        </div>
      </div>

      {/* Single Seat Booking Button (POV State - Bottom Right Offset) */}
      {status === 'pov' && targetSeat && !isBookingActive && targetSeat.status === 'available' && !isBookingModalOpen && !isTicketScreenOpen && (
        <button
          className="glass-dark"
          onClick={() => setIsBookingModalOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '225px',
            border: '1px solid rgba(176, 141, 87, 0.25)',
            color: '#F7F4EE',
            padding: '12px 24px',
            borderRadius: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000,
            transition: 'all 0.2s ease',
            fontFamily: '"Inter", sans-serif',
            fontSize: '16px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.backgroundColor = 'rgba(27, 36, 48, 0.85)';
            e.currentTarget.style.borderColor = '#B08D57';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'rgba(27, 36, 48, 0.65)';
            e.currentTarget.style.borderColor = 'rgba(176, 141, 87, 0.25)';
          }}
        >
          Book This Seat
        </button>
      )}

      {/* View Ticket Button */}
      {isBookingActive && !isTicketScreenOpen && (
        <button
          className="action-btn-tr glass-brass"
          onClick={() => setIsTicketScreenOpen(true)}
          style={{
            border: 'none',
            color: '#1B2430',
            padding: '10px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 1000,
            transition: 'all 0.2s ease',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            position: 'fixed',
            top: '24px',
            right: '24px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>🎟️ View Ticket ({groupSeatIds.length > 0 ? `Group of ${groupSeatIds.length + 1}` : 'Single'})</span>
        </button>
      )}

      {/* Group Size Selection Modal */}
      {isGroupSizeModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#F7F4EE', borderRadius: '20px', width: '100%', maxWidth: '380px',
            padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)', color: '#1B2430',
            fontFamily: '"Inter", sans-serif', textAlign: 'center'
          }}>
            <h3 style={{ fontFamily: '"Fraunces", serif', color: '#B08D57', margin: '0 0 8px 0', fontSize: '24px' }}>
              Book for a Group
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#4A5568', fontSize: '14px' }}>
              How many seats would you like to select together?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
              {[2, 3, 4, 5].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setGroupTargetCount(size);
                    setPendingGroupSeatIds([]);
                    setIsGroupSelectionActive(true);
                    setIsGroupSizeModalOpen(false);
                  }}
                  style={{
                    width: '54px', height: '54px', borderRadius: '16px', border: '2px solid #B08D57',
                    backgroundColor: 'rgba(176, 141, 87, 0.1)', color: '#1B2430', fontSize: '20px',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#B08D57';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(176, 141, 87, 0.1)';
                    e.currentTarget.style.color = '#1B2430';
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsGroupSizeModalOpen(false)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid rgba(27, 36, 48, 0.2)', backgroundColor: 'transparent',
                cursor: 'pointer', fontWeight: 600, color: '#4A5568'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Group Confirmation Modal */}
      {isGroupConfirmModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#F7F4EE', borderRadius: '20px', width: '100%', maxWidth: '420px',
            padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)', color: '#1B2430',
            fontFamily: '"Inter", sans-serif'
          }}>
            <h3 style={{ fontFamily: '"Fraunces", serif', color: '#B08D57', margin: '0 0 6px 0', fontSize: '24px', textAlign: 'center' }}>
              Confirm Group Booking
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#4A5568', fontSize: '13.5px', textAlign: 'center' }}>
              Review your group seats before finalizing reservation.
            </p>

            <div style={{ backgroundColor: 'rgba(176, 141, 87, 0.08)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              {pendingSeatObjects.map((seat, index) => (
                <div 
                  key={seat.id} 
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: index < pendingSeatObjects.length - 1 ? '1px dashed rgba(176, 141, 87, 0.3)' : 'none'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: index === 0 ? '#B08D57' : '#1B2430' }}>
                      {seat.id} {index === 0 && '(Primary)'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#718096', marginLeft: '8px' }}>
                      {seat.tier}
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px' }}>₦{seat.price.toLocaleString('en-NG')}</strong>
                </div>
              ))}

              <div style={{ borderTop: '2px solid #B08D57', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#1B2430' }}>Total Price</span>
                <span style={{ fontFamily: '"Fraunces", serif', fontSize: '22px', fontWeight: 700, color: '#B08D57' }}>
                  ₦{groupTotalPrice.toLocaleString('en-NG')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsGroupConfirmModalOpen(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(27, 36, 48, 0.2)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#4A5568' }}
              >
                Back to Selection
              </button>
              <button
                onClick={() => {
                  if (pendingGroupSeatIds.length > 0) {
                    setTicketedSeatId(pendingGroupSeatIds[0]);
                    setGroupSeatIds(pendingGroupSeatIds.slice(1));
                    setIsGroupSelectionActive(false);
                    setPendingGroupSeatIds([]);
                    setIsGroupConfirmModalOpen(false);
                    setIsTicketScreenOpen(true);
                  }
                }}
                style={{ flex: 1.2, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#1B2430', color: '#F7F4EE', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}
              >
                Confirm Group Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Seat Booking Confirmation Modal */}
      {isBookingModalOpen && targetSeat && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="modal-container" style={{
            backgroundColor: '#F7F4EE',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            color: '#1B2430',
            fontFamily: '"Inter", sans-serif',
            textAlign: 'center'
          }}>
            <h2 style={{ fontFamily: '"Fraunces", serif', color: '#B08D57', margin: '0 0 8px 0', fontSize: '28px' }}>
              Confirm Booking
            </h2>
            <p style={{ margin: '0 0 24px 0', color: '#4A5568' }}>You are about to secure this seat.</p>
            
            <div style={{ backgroundColor: 'rgba(176, 141, 87, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#4A5568' }}>Seat ID</span>
                <strong style={{ fontSize: '18px' }}>{targetSeat.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#4A5568' }}>Tier</span>
                <strong>{targetSeat.tier}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5568' }}>Price</span>
                <strong>₦{targetSeat.price.toLocaleString('en-NG')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(27, 36, 48, 0.2)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#4A5568' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setTicketedSeatId(targetSeat.id);
                  setGroupSeatIds([]);
                  setIsBookingModalOpen(false);
                  setIsTicketScreenOpen(true);
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#1B2430', color: '#F7F4EE', cursor: 'pointer', fontWeight: 600 }}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Screen */}
      {isTicketScreenOpen && (
        <div className="ticket-backdrop" style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Main Ticket */}
          <div style={{
            backgroundColor: '#F7F4EE',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            overflow: 'hidden',
            boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
            color: '#1B2430',
            fontFamily: '"Inter", sans-serif',
          }}>
            <div style={{ backgroundColor: '#1B2430', padding: '32px 24px', textAlign: 'center', color: '#F7F4EE' }}>
              <h2 style={{ fontFamily: '"Fraunces", serif', color: '#B08D57', margin: '0 0 8px 0', fontSize: '24px' }}>
                Sightline
              </h2>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500, letterSpacing: '0.05em' }}>
                Aso Pavilion Presents:
                <br/>Live in Concert
              </h3>
            </div>
            
            <div className="ticket-container" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#A09A8F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontWeight: 600 }}>Dec 31, 2026</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#A09A8F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Time</div>
                  <div style={{ fontWeight: 600 }}>8:00 PM</div>
                </div>
              </div>
              
              <div style={{ borderTop: '2px dashed rgba(176, 141, 87, 0.3)', margin: '0 -24px 24px -24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', backgroundColor: 'rgba(27, 36, 48, 0.8)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', backgroundColor: 'rgba(27, 36, 48, 0.8)', borderRadius: '50%' }}></div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: '#A09A8F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  {groupSeatIds.length > 0 ? `Group Booking (${groupSeatIds.length + 1} Seats)` : 'Your Primary Seat'}
                </div>
                <div style={{ fontFamily: '"Fraunces", serif', fontSize: groupSeatIds.length > 0 ? '36px' : '48px', fontWeight: 700, color: '#B08D57', lineHeight: 1 }}>
                  {ticketedSeatId}
                </div>
                {groupSeatIds.length > 0 && (
                  <div style={{ fontSize: '13px', color: '#4A5568', marginTop: '8px', fontWeight: 600 }}>
                    Group Seats: {groupSeatIds.join(', ')}
                  </div>
                )}
                <div style={{ fontSize: '15px', color: '#B08D57', fontWeight: 700, marginTop: '10px' }}>
                  Total: ₦{totalBookedPrice.toLocaleString('en-NG')}
                </div>
              </div>

              <button 
                onClick={() => setIsTicketScreenOpen(false)}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#1B2430', color: '#F7F4EE', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}
              >
                Continue Exploring
              </button>
            </div>
          </div>
          
          {/* Reset Demo Option */}
          <button 
            onClick={() => {
              if (resetBookingState) resetBookingState();
              else {
                setTicketedSeatId(null);
                setGroupSeatIds([]);
              }
              setIsTicketScreenOpen(false);
            }}
            style={{ 
              marginTop: '24px', 
              padding: '8px 16px', 
              background: 'transparent', 
              border: 'none', 
              color: '#A0AABF', 
              cursor: 'pointer', 
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            Reset Demo (Clear Booking)
          </button>
        </div>
      )}
    </>
  );
}

export default function VenueScene() {
  return (
    <CameraStateProvider>
      <SceneContent />
    </CameraStateProvider>
  );
}
