import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { liveAthletes, mockComments } from '../../data/competition';
import { Send, ThumbsUp, Trophy, PlayCircle } from 'lucide-react';

export default function LivePhase() {
  const [comments, setComments] = useState(mockComments);
  const [inputValue, setInputValue] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll chat to bottom on load
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newComment = {
      id: Date.now(),
      nickname: '게스트',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setComments([...comments, newComment]);
    setInputValue('');
  };

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 max-w-[1920px] mx-auto min-h-screen">
      
      {/* Live Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="font-mono text-sm tracking-widest text-red-500 font-bold uppercase">Live Broadcast</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black italic">클래식 피지크 -180cm</h1>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-6 py-2">
          <span className="text-sm font-mono tracking-widest text-white/50">시청자 수</span>
          <span className="text-xl font-bold text-accent">1,248</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[700px]">
        
        {/* Left: Stream Player (8 columns) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Mock Video Player */}
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/1200/800?random=stream')] bg-cover bg-center opacity-40 blur-sm"></div>
            <PlayCircle className="w-20 h-20 text-white/30 relative z-10" />
            <div className="absolute bottom-6 left-6 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
              <span className="text-xs font-mono text-white/50 tracking-widest mr-2">NOW SHOWING</span>
              <span className="text-white font-bold">비교 심사 진행 중</span>
            </div>
            <div className="absolute top-6 right-6 z-10">
              <img src="/logo.svg" alt="YBBF" className="h-8 opacity-50 grayscale invert" />
            </div>
          </div>
        </div>

        {/* Right: Real-time Chat (4 columns) */}
        <div className="lg:col-span-4 flex flex-col h-[500px] lg:h-full bg-bg-secondary border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/40">
            <h3 className="font-display italic font-bold tracking-wider">실시간 응원 💬</h3>
          </div>
          
          {/* Chat Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {comments.map((msg, i) => (
              <div key={msg.id} className="animate-fade-in-up">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-accent text-xs font-bold">{msg.nickname}</span>
                  <span className="text-[10px] text-white/30 font-mono">{msg.time}</span>
                </div>
                <div className="text-white/90 text-sm bg-white/5 inline-block px-3 py-2 rounded-lg rounded-tl-none border border-white/5">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="응원의 메시지를 남겨주세요" 
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent text-white"
              />
              <button type="submit" className="bg-accent text-black rounded-lg px-4 py-3 hover:bg-accent-dark transition-colors shrink-0">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Bottom: Live Voting Panel */}
      <div className="mt-8 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-display font-black italic">관중 인기상 실시간 투표</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {liveAthletes.map((athlete) => (
            <div key={athlete.id} className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-accent/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-bg-secondary border border-white/10 group-hover:border-accent/50 rounded-xl overflow-hidden transition-all">
                {/* Image */}
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img src={athlete.image} alt={athlete.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-black text-white font-mono text-xs px-2 py-1 mb-1 inline-block">NO. {athlete.number}</div>
                    <div className="text-xl font-bold font-display italic">{athlete.name}</div>
                  </div>
                </div>
                {/* Vote Bar */}
                <div className="p-4 bg-black">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">{athlete.votes}표</span>
                    <span className="text-accent font-bold">{athlete.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-1000 ease-out" 
                      style={{ width: `${athlete.percentage}%` }}
                    />
                  </div>
                  <button className="w-full mt-4 py-2 bg-white/5 hover:bg-accent hover:text-black border border-white/10 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <ThumbsUp className="w-4 h-4" /> VOTE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
