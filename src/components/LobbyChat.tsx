import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { supabase, Message } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const LobbyChat = ({
    roomCode,
    playerId,
    username,
}: {
    roomCode: string;
    playerId: string;
    username: string;
}) => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();

        const channel = supabase
            .channel(`room:${roomCode}:messages`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_code=eq.${roomCode}`,
                },
                (payload: { new: Message }) => {
                    setMessages((prev: Message[]) => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [roomCode]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('room_code', roomCode)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage('');

        const { error } = await supabase.from('messages').insert({
            room_code: roomCode,
            player_id: playerId,
            username,
            content,
        });

        if (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="bg-gray-800/80 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <h3 className="text-white font-bold">{t('chat')}</h3>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.player_id === playerId ? 'items-end' : 'items-start'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">
                                {msg.player_id === playerId ? t('you') : msg.username}
                            </span>
                        </div>
                        <div
                            className={`px-4 py-2 rounded-2xl max-w-[80%] break-words ${msg.player_id === playerId
                                ? 'bg-purple-600 text-white rounded-tr-none'
                                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-500 italic text-sm">
                        {t('noMessagesYet')}
                    </div>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-gray-800/50 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('chatPlaceholder')}
                        className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-50 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LobbyChat;
