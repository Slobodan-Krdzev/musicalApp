'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiRequest } from '@/lib/api';
import { getDealChatSocket } from '@/lib/socket';
import { cn } from '@/lib/cn';

export type DealChatMessage = {
  id: string;
  applicationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type DealChatModalProps = {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  currentUserId: string;
  partnerName: string;
};

const QUICK_EMOJIS = [
  '😀', '😊', '😂', '😍', '👍', '👋', '🙏', '❤️', '💜', '🔥',
  '⭐', '✅', '🎉', '🎵', '🎸', '🎤', '🥁', '🎹', '🍀', '💪',
];

function normalizeId(id: string | undefined | null) {
  return id == null ? '' : String(id);
}

function appendMessage(prev: DealChatMessage[], message: DealChatMessage) {
  if (prev.some((m) => m.id === message.id)) return prev;
  return [...prev, message];
}

function ChatEmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-lg text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
        aria-label="Insert emoji"
        title="Insert emoji"
      >
        😊
      </button>
      {open && (
        <div className="absolute bottom-12 left-0 z-10 grid w-[220px] grid-cols-5 gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-zinc-800"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DealChatModal({
  open,
  onClose,
  applicationId,
  currentUserId,
  partnerName,
}: DealChatModalProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<DealChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [partnerLastReadAt, setPartnerLastReadAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selfId = normalizeId(currentUserId);

  const markChatRead = useCallback(() => {
    const socket = getDealChatSocket();
    socket.emit('deal_chat:read', { applicationId });
  }, [applicationId]);

  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (normalizeId(messages[i].senderId) === selfId) return messages[i].id;
    }
    return null;
  }, [messages, selfId]);

  const isMessageSeenByPartner = useCallback(
    (message: DealChatMessage) => {
      if (!partnerLastReadAt || normalizeId(message.senderId) !== selfId) return false;
      return new Date(partnerLastReadAt).getTime() >= new Date(message.createdAt).getTime();
    },
    [partnerLastReadAt, selfId]
  );

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const upsertMessage = useCallback((message: DealChatMessage) => {
    setMessages((prev) => appendMessage(prev, message));
    requestAnimationFrame(scrollToBottom);
  }, [scrollToBottom]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setChatReady(false);
    setError(null);

    apiRequest<{ messages: DealChatMessage[]; partnerLastReadAt?: string | null }>(
      `/api/applications/${applicationId}/chat/messages`
    )
      .then((res) => {
        if (!active) return;
        setMessages(res.messages);
        setPartnerLastReadAt(res.partnerLastReadAt ?? null);
        requestAnimationFrame(scrollToBottom);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || 'Failed to load messages');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const socket = getDealChatSocket();
    socket.emit('deal_chat:join', { applicationId });

    const onJoined = (payload: { applicationId?: string }) => {
      if (normalizeId(payload.applicationId) === normalizeId(applicationId)) {
        setChatReady(true);
      }
    };

    const onMessage = (message: DealChatMessage) => {
      if (normalizeId(message.applicationId) !== normalizeId(applicationId)) return;
      upsertMessage(message);
      if (normalizeId(message.senderId) !== selfId) {
        markChatRead();
      }
    };

    const onSent = (message: DealChatMessage) => {
      if (normalizeId(message.applicationId) !== normalizeId(applicationId)) return;
      upsertMessage(message);
    };

    const onSeen = (payload: { applicationId?: string; userId?: string; lastReadAt?: string }) => {
      if (normalizeId(payload.applicationId) !== normalizeId(applicationId)) return;
      if (normalizeId(payload.userId) === selfId || !payload.lastReadAt) return;
      setPartnerLastReadAt(payload.lastReadAt);
    };

    const onSocketError = (payload: { message?: string }) => {
      setError(payload.message || 'Chat error');
    };

    const onNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    };

    socket.on('deal_chat:joined', onJoined);
    socket.on('deal_chat:message', onMessage);
    socket.on('deal_chat:sent', onSent);
    socket.on('deal_chat:seen', onSeen);
    socket.on('deal_chat:error', onSocketError);
    socket.on('notification:new', onNotification);

    return () => {
      active = false;
      socket.emit('deal_chat:leave', { applicationId });
      socket.off('deal_chat:joined', onJoined);
      socket.off('deal_chat:message', onMessage);
      socket.off('deal_chat:sent', onSent);
      socket.off('deal_chat:seen', onSeen);
      socket.off('deal_chat:error', onSocketError);
      socket.off('notification:new', onNotification);
    };
  }, [open, applicationId, scrollToBottom, queryClient, upsertMessage, markChatRead, selfId]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setDraft('');
      setError(null);
      setChatReady(false);
      setMessages([]);
      setPartnerLastReadAt(null);
    }
  }, [open]);

  function insertEmoji(emoji: string) {
    const textarea = inputRef.current;
    if (!textarea) {
      setDraft((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart ?? draft.length;
    const end = textarea.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + emoji.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await apiRequest<{ message: DealChatMessage }>(
        `/api/applications/${applicationId}/chat/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ body: text }),
        }
      );
      setDraft('');
      upsertMessage(res.message);
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chat with ${partnerName}`}
      position="center"
      className="max-w-lg"
      contentClassName="flex flex-col gap-0 p-0 sm:p-0"
    >
      <div className="flex min-h-[420px] flex-col">
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn('h-12 w-3/4 rounded-xl bg-zinc-800/60 animate-pulse', i % 2 === 1 && 'ml-auto')}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No messages yet. Say hello to coordinate your gig.
            </p>
          ) : (
            messages.map((message) => {
              const isMine = normalizeId(message.senderId) === selfId;
              const showSeen = isMine && message.id === lastOwnMessageId && isMessageSeenByPartner(message);
              return (
                <div
                  key={message.id}
                  className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words',
                      isMine
                        ? 'rounded-br-md bg-violet-600 text-white'
                        : 'rounded-bl-md bg-zinc-800 text-zinc-100'
                    )}
                  >
                    <p>{message.body}</p>
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1.5 text-[10px]',
                        isMine ? 'justify-end text-violet-200/80' : 'text-zinc-500'
                      )}
                    >
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {showSeen && <span className="font-medium text-violet-100">Seen</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <p className="border-t border-zinc-800 px-4 py-2 text-xs text-red-400 sm:px-5">{error}</p>
        )}

        <div className="border-t border-zinc-800 px-4 py-3 sm:px-5">
          <div className="flex h-11 items-stretch gap-2">
            <ChatEmojiPicker onPick={insertEmoji} />
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              maxLength={2000}
              className="h-11 min-h-11 max-h-11 flex-1 resize-none overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <Button
              type="button"
              size="sm"
              className="h-11 shrink-0 rounded-xl px-4 py-0"
              loading={sending}
              disabled={!draft.trim() || loading}
              onClick={handleSend}
            >
              Send
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-600">
            Enter to send · Shift+Enter for a new line
            {!chatReady && !loading && (
              <span className="text-zinc-500"> · Connecting live updates…</span>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}
