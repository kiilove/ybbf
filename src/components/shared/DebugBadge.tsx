import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function DebugBadge() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [scrollY, setScrollY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 999999,
      fontFamily: 'monospace',
      fontSize: '11px',
      backgroundColor: 'rgba(10, 10, 10, 0.88)',
      color: '#CCFF00',
      border: '1px solid rgba(204, 255, 0, 0.4)',
      borderRadius: '8px',
      padding: isExpanded ? '10px 14px' : '4px 8px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.2s ease'
    }} onClick={() => setIsExpanded(!isExpanded)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
        <span style={{
          display: 'inline-block',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: isLoading ? '#fbbf24' : '#22c55e'
        }} />
        <span>YBBF DEV [{location.pathname}]</span>
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '8px', color: '#e5e7eb', lineHeight: '1.6', fontSize: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
          <div><strong>Scroll:</strong> {scrollY}px</div>
          <div><strong>Auth:</strong> {isAuthenticated ? `Logged In (${user?.email})` : 'Guest'}</div>
          <div><strong>Loading:</strong> {isLoading ? 'True (Fetching)' : 'Idle'}</div>
          <div><strong>Screen:</strong> {window.innerWidth} x {window.innerHeight}</div>
          <div style={{ marginTop: '4px', color: '#9ca3af' }}>클릭하여 접기/펼치기</div>
        </div>
      )}
    </div>
  );
}
