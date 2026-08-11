import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Query } from '../../types';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminQueries() {
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [] } = useQuery<Query[]>({ queryKey: ['admin-queries'] });

  const [selectedThread, setSelectedThread] = useState<Query | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const { data: threadMessages = [] } = useQuery<Query[]>({
    queryKey: ['admin-thread', selectedThread?.user_id, selectedThread?.project_id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/queries/${selectedThread?.user_id}/${selectedThread?.project_id}`);
      return res.json();
    },
    enabled: !!selectedThread,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (threadMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages]);

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedThread) return;
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedThread.project_id,
          user_id: selectedThread.user_id,
          message,
        })
      });
      if (!res.ok) throw new Error('Failed to send reply');
    },
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-thread', selectedThread?.user_id, selectedThread?.project_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-queries'] });
    }
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || replyMutation.isPending) return;
    replyMutation.mutate(replyMessage);
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white font-serif">Investor Queries</h1>
        <p className="text-gray-400 mt-1">Manage and respond to investor support requests.</p>
      </div>

      <div className="flex-1 bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden flex min-h-[600px]">
        {/* Threads List */}
        <div className={cn(
          "w-full lg:w-1/3 border-r border-white/[0.06] flex flex-col transition-all",
          selectedThread ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/[0.06] bg-black/20">
            <h2 className="font-bold text-white">Active Discussions</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {threads.map((t: any) => (
              <button
                key={`${t.user_id}-${t.project_id}`}
                onClick={() => setSelectedThread(t)}
                className={cn(
                  "w-full text-left p-4 hover:bg-white/[0.02] transition-colors relative cursor-pointer",
                  selectedThread?.user_id === t.user_id && selectedThread?.project_id === t.project_id ? "bg-white/[0.04]" : ""
                )}
              >
                {t.last_sender_role === 'investor' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-redhill-red" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm text-white truncate pr-4">{t.userName}</p>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {new Date(t.lastMessage).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-redhill-red font-bold truncate mb-1">{t.projectName}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                    t.last_sender_role === 'investor' ? "bg-redhill-red/20 text-red-400" : "bg-white/10 text-gray-400"
                  )}>
                    {t.last_sender_role === 'investor' ? 'Needs Reply' : 'Answered'}
                  </span>
                </div>
              </button>
            ))}
            {threads.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No active queries.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "w-full lg:w-2/3 flex flex-col bg-redhill-dark/40",
          !selectedThread ? "hidden lg:flex items-center justify-center" : "flex"
        )}>
          {!selectedThread ? (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">Select a discussion to view messages</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/[0.06] bg-black/20 flex items-center gap-4">
                <button
                  onClick={() => setSelectedThread(null)}
                  className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedThread.userName}</h3>
                  <p className="text-xs text-redhill-red font-bold">{selectedThread.projectName}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {threadMessages.map((msg: Query) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col w-full",
                      msg.sender_role === 'admin' ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "px-4.5 py-3 max-w-[80%] text-sm shadow-lg leading-relaxed",
                      msg.sender_role === 'admin'
                        ? "bg-white/[0.06] text-white border border-white/[0.08] rounded-2xl rounded-tr-none"
                        : "bg-redhill-red text-white rounded-2xl rounded-tl-none shadow-redhill-red/10"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1.5 font-bold uppercase tracking-wider mx-1">
                      {msg.sender_role === 'admin' ? 'You' : msg.userName || 'Investor'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleReply} className="p-4 bg-black/40 border-t border-white/[0.06] flex gap-3">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
                  disabled={replyMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  className="bg-white/[0.06] hover:bg-white/10 text-white p-3.5 rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
