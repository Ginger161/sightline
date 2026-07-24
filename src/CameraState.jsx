import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getPreset } from './presets';

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  
  const labelTimeoutRef = useRef(null);
  const captureOverviewRef = useRef(null);
  const restoreOverviewRef = useRef(null);

  // Handle Hash Route Initialization (#preview/{presetId}/{seatId})
  useEffect(() => {
    const handleHashRoute = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#preview/')) {
        const parts = hash.split('/');
        const presetId = parts[1];
        const seatId = parts[2];

        const knownPresets = ['banquet-default', 'mega-church', 'wedding', 'conference-theatre'];
        if (!knownPresets.includes(presetId)) {
          setIsPreviewMode(true);
          setPreviewError(`Venue preset "${presetId}" was not found.`);
          return;
        }

        const preset = getPreset(presetId);

        const seat = preset.seats?.find(s => s.id === seatId);
        if (!seat) {
          setIsPreviewMode(true);
          setActivePreset(presetId);
          setPreviewError(`Seat "${seatId}" was not found in preset "${preset.title || presetId}".`);
          return;
        }

        // Valid read-only preview target
        setIsPreviewMode(true);
        setPreviewError(null);
        setActivePreset(presetId);
        setTargetSeat(seat);
        let stageTarget = [0, 1.1, -14];
        if (seat.section === 'table' && seat.tablePosition) {
          stageTarget = [seat.tablePosition[0], 1.1, seat.tablePosition[2]];
        }
        setLookAtTarget(stageTarget);
        setStatus('pov'); // Jump directly to eye-level POV!
      } else {
        setIsPreviewMode(false);
        setPreviewError(null);
      }
    };

    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
    return () => window.removeEventListener('hashchange', handleHashRoute);
  }, []);

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
    switchPreset,
    isPreviewMode,
    previewError
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
    activePreset,
    isPreviewMode,
    previewError
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
