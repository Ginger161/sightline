import React, { createContext, useContext, useState, useRef } from 'react';

export const CameraStateContext = createContext();

export function useCameraState() {
  return useContext(CameraStateContext);
}

export const HoverStateContext = createContext();

export function useHoverState() {
  return useContext(HoverStateContext);
}

export function CameraStateProvider({ children }) {
  const [status, setStatus] = useState('orbit'); // 'orbit', 'transitioning', 'pov', 'teleport_to_overview'
  const [targetSeat, setTargetSeat] = useState(null);
  const [lookAtTarget, setLookAtTarget] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [occluders, setOccluders] = useState([]);
  const [ticketedSeatId, setTicketedSeatId] = useState(null);
  const [groupSeatIds, setGroupSeatIds] = useState([]);
  const [isGroupSelectionActive, setIsGroupSelectionActive] = useState(false);
  const [groupTargetCount, setGroupTargetCount] = useState(2);
  const [pendingGroupSeatIds, setPendingGroupSeatIds] = useState([]);
  const [activePreset, setActivePreset] = useState('banquet-default');
  
  const labelTimeoutRef = useRef(null);
  const captureOverviewRef = useRef(null);
  const restoreOverviewRef = useRef(null);

  const resetBookingState = () => {
    setTicketedSeatId(null);
    setGroupSeatIds([]);
    setIsGroupSelectionActive(false);
    setPendingGroupSeatIds([]);
    setGroupTargetCount(2);
  };

  const switchPreset = (presetId) => {
    if (presetId === activePreset || status === 'preset-switching') return;
    setActiveLabel(null);
    setStatus('preset-switching');
    setFadeOpacity(1);

    // Screen fully obscured after 300ms fade to black/navy
    setTimeout(() => {
      setActivePreset(presetId);
      resetBookingState();
      setTargetSeat(null);
      if (restoreOverviewRef.current) restoreOverviewRef.current();
      setStatus('orbit');

      // Fade back in smoothly
      setTimeout(() => {
        setFadeOpacity(0);
      }, 50);
    }, 300);
  };

  const swoopToSeat = (seat, stageTarget) => {
    if (status === 'orbit') {
      if (captureOverviewRef.current) captureOverviewRef.current();
      setTargetSeat(seat);
      setLookAtTarget(stageTarget);
      setStatus('transitioning');
      setActiveLabel(null); // Clear any active label when moving
    }
  };

  const returnToOverview = () => {
    if (status === 'pov') {
      setActiveLabel(null);
      setFadeOpacity(1);
      
      // Wait for fade in
      setTimeout(() => {
        if (restoreOverviewRef.current) restoreOverviewRef.current();
        setStatus('orbit');
        
        // Wait for teleport to happen and controls to reset
        setTimeout(() => {
          setFadeOpacity(0);
        }, 50);
      }, 300); // 300ms fade duration
    }
  };

  const showLabel = (id, text) => {
    setActiveLabel({ id, text });
    if (labelTimeoutRef.current) {
      clearTimeout(labelTimeoutRef.current);
    }
    // Auto-hide the label after 3 seconds
    labelTimeoutRef.current = setTimeout(() => {
      setActiveLabel(null);
    }, 3000);
  };

  const clearLabel = () => {
    setActiveLabel(null);
    if (labelTimeoutRef.current) {
      clearTimeout(labelTimeoutRef.current);
    }
  };

  const cameraValue = React.useMemo(() => ({ 
    status, 
    setStatus, 
    targetSeat, 
    setTargetSeat,
    lookAtTarget, 
    swoopToSeat, 
    returnToOverview,
    fadeOpacity,
    activeLabel,
    setHoveredSeatId,
    showLabel,
    clearLabel,
    captureOverviewRef,
    restoreOverviewRef,
    occluders,
    setOccluders,
    ticketedSeatId,
    setTicketedSeatId,
    groupSeatIds,
    setGroupSeatIds,
    isGroupSelectionActive,
    setIsGroupSelectionActive,
    groupTargetCount,
    setGroupTargetCount,
    pendingGroupSeatIds,
    setPendingGroupSeatIds,
    resetBookingState,
    activePreset,
    setActivePreset,
    switchPreset
  }), [
    status, 
    targetSeat, 
    lookAtTarget, 
    fadeOpacity, 
    activeLabel, 
    occluders, 
    ticketedSeatId, 
    groupSeatIds, 
    isGroupSelectionActive, 
    groupTargetCount, 
    pendingGroupSeatIds, 
    activePreset
  ]);

  const hoverValue = React.useMemo(() => ({
    hoveredSeatId
  }), [hoveredSeatId]);

  return (
    <CameraStateContext.Provider value={cameraValue}>
      <HoverStateContext.Provider value={hoverValue}>
        {children}
      </HoverStateContext.Provider>
    </CameraStateContext.Provider>
  );
}
