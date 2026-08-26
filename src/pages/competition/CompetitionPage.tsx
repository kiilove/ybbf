import React, { useState, useEffect } from 'react';
import { Trophy, X, RotateCw, Send, Check, AlertCircle } from 'lucide-react';
import UpcomingPhase from './UpcomingPhase';
import RegistrationPhase from './RegistrationPhase';
import LivePhase from './LivePhase';
import { PhaseStatus } from '../../data/competition';
import { notificationService, NotificationSubscription } from '../../services/notificationService';

const phaseLabels: Record<PhaseStatus, string> = {
  UPCOMING: '대회 예고',
  REGISTRATION: '참가 접수',
  CLOSED: '접수 마감',
  LIVE: '라이브 중계',
  RESULT: '대회 결과',
};

export default function CompetitionPage() {
  // Use state to toggle phases for design/development preview
  const [phase, setPhase] = useState<PhaseStatus>('UPCOMING');
  const [activeNoticeId, setActiveNoticeId] = useState<string>('');
  const [activeContestId, setActiveContestId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [subError, setSubError] = useState('');

  const fetchSubscriptions = async () => {
    setIsSubLoading(true);
    setSubError('');
    try {
      const data = await notificationService.getSubscriptions();
      setSubscriptions(data);
    } catch (err: any) {
      setSubError('알림 목록을 불러오지 못했습니다.');
      console.error(err);
    } finally {
      setIsSubLoading(false);
    }
  };

  const handleResend = async (subId: number) => {
    setResendingId(subId);
    try {
      const result = await notificationService.resendNotification({ id: subId });
      if (result.success) {
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === subId 
              ? { 
                  ...sub, 
                  isSent: 1, 
                  sentAt: result.sentAt, 
                  sendCount: result.sendCount, 
                  sendStatus: result.sendStatus 
                } 
              : sub
          )
        );
      } else {
        alert(result.error || '재발송에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '재발송 실패');
    } finally {
      setResendingId(null);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      fetchSubscriptions();
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    document.title = "대회 접수 및 라이브 중계 | YBBF 용인시보디빌딩협회";

    async function loadSettings() {
      try {
        const d1Url = import.meta.env.VITE_BACKEND_API_URL || 'https://ybbf-api-worker.jbkim.workers.dev';
        const res = await fetch(`${d1Url}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.competitionPhase) {
            setPhase(data.competitionPhase);
          }
          if (data.activeNoticeId) {
            setActiveNoticeId(data.activeNoticeId);
          }
          if (data.activeContestId) {
            setActiveContestId(data.activeContestId);
          }
        }
      } catch (err) {
        console.error('대회 설정 로드 실패:', err);
      }
    }
    loadSettings();
  }, []);

  const handlePhaseChange = (p: PhaseStatus) => {
    setPhase(p);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10">
        {phase === 'UPCOMING' && <UpcomingPhase />}
        {phase === 'REGISTRATION' && <RegistrationPhase activeNoticeId={activeNoticeId} activeContestId={activeContestId} />}
        {phase === 'LIVE' && <LivePhase />}
        
        {/* Fallbacks for phases not yet fully implemented */}
        {phase === 'CLOSED' && (
          <div className="h-screen flex items-center justify-center">
            <h2 className="text-4xl font-display italic">CLOSED PHASE: Roster View (WIP)</h2>
          </div>
        )}
        {phase === 'RESULT' && (
          <div className="h-screen flex items-center justify-center">
            <h2 className="text-4xl font-display italic">RESULT PHASE: Winners View (WIP)</h2>
          </div>
        )}
      </div>

      {/* DEVELOPMENT SIMULATOR FAB & DRAWER (Replaces the bottom horizontal toolbar) */}
      {/* Floating Simulator Button (FAB) */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-accent hover:bg-white text-black p-3.5 rounded-full shadow-[0_0_15px_rgba(210,255,0,0.3)] transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        title="대회 단계 시뮬레이터 열기"
      >
        <Trophy className="w-5.5 h-5.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
      </button>

      {/* Slide-out Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-[#161a16] border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-accent tracking-widest uppercase font-mono">Phase Simulator</h3>
              <p className="text-[10px] text-white/50 mt-0.5">대회 시나리오 단계별 뷰 전환</p>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {(['REGISTRATION', 'LIVE', 'RESULT'] as PhaseStatus[]).map(p => (
              <button
                key={p}
                onClick={() => {
                  handlePhaseChange(p);
                  setIsDrawerOpen(false); // Close on selection
                }}
                className={`text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all flex flex-col justify-between gap-1 border ${
                  phase === p 
                    ? 'bg-accent/10 border-accent text-accent font-black' 
                    : 'bg-[#0a0a0a] border-white/5 text-white/60 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <span>{phaseLabels[p]}</span>
                <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase">{p}</span>
              </button>
            ))}
          </div>

          {/* 알림 예약 발송 제어 섹션 */}
          <div className="border-t border-white/10 pt-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-accent tracking-widest uppercase font-mono">알림 예약 발송 제어</h3>
                <p className="text-[10px] text-white/50 mt-0.5">실시간 신청 현황 및 수동 재발송</p>
              </div>
              <button 
                onClick={fetchSubscriptions}
                disabled={isSubLoading}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                title="새로고침"
              >
                <RotateCw className={`w-4 h-4 ${isSubLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {subError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded mb-3 flex items-center gap-1.5 font-sans flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
                {subError}
              </p>
            )}

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {subscriptions.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-xs border border-dashed border-white/5 rounded-lg font-sans">
                  신청된 알림 내역이 없습니다.
                </div>
              ) : (
                subscriptions.map(sub => (
                  <div key={sub.id} className="bg-[#0a0a0a] border border-white/5 p-3 rounded-lg flex flex-col gap-2.5 transition-all hover:border-white/10 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/95 font-mono truncate max-w-[200px]" title={sub.email}>
                        {sub.email}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {sub.sendStatus === 'sent' && (
                          <span className="text-[9px] font-bold bg-[#d2ff00]/10 text-[#d2ff00] px-1.5 py-0.5 rounded border border-[#d2ff00]/20 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Sent
                          </span>
                        )}
                        {sub.sendStatus === 'pending' && (
                          <span className="text-[9px] font-bold bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">
                            Pending
                          </span>
                        )}
                        {sub.sendStatus === 'processing' && (
                          <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 animate-pulse">
                            Sending...
                          </span>
                        )}
                        {sub.sendStatus === 'failed' && (
                          <span className="text-[9px] font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <div className="flex items-center gap-1.5">
                        <span>시도: <strong className="text-white/60 font-mono">{sub.sendCount}</strong>회</span>
                        {sub.sentAt && (
                          <span className="border-l border-white/10 pl-1.5">
                            {new Date(sub.sentAt).toLocaleString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleResend(sub.id)}
                        disabled={resendingId !== null || sub.sendStatus === 'processing'}
                        className="bg-accent/10 hover:bg-accent hover:text-black border border-accent/20 hover:border-accent text-accent px-2 py-1 rounded text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-2.5 h-2.5" />
                        {resendingId === sub.id ? '전송중' : '다시보내기'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center text-[10px] text-white/30 font-mono flex-shrink-0">
          YBBF 용인시보디빌딩협회 v1.0.0
        </div>
      </div>

    </div>
  );
}
