import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, User } from 'lucide-react';
import { supabase, Signaling, Player } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const VoiceChat = ({
    roomCode,
    playerId,
    players,
}: {
    roomCode: string;
    playerId: string;
    players: Player[];
}) => {
    const { t } = useLanguage();
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});

    useEffect(() => {
        const channel = supabase
            .channel(`room:${roomCode}:signaling:${playerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'signaling',
                    filter: `room_code=eq.${roomCode}&to_player_id=eq.${playerId}`,
                },
                async (payload) => {
                    const signal = payload.new as Signaling;
                    await handleSignaling(signal);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
            stopMic();
            Object.values(peerConnections.current).forEach((pc) => pc.close());
        };
    }, [roomCode, playerId]);

    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setIsMicEnabled(true);

            // Create offers to all other players
            for (const player of players) {
                if (player.id !== playerId) {
                    await createOffer(player.id);
                }
            }
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const stopMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        setIsMicEnabled(false);
    };

    const createPeerConnection = (targetId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignaling(targetId, 'candidate', event.candidate);
            }
        };

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play();

            setActiveSpeakers((prev) => {
                const next = new Set(prev);
                next.add(targetId);
                return next;
            });

            remoteStream.onremovetrack = () => {
                setActiveSpeakers((prev) => {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                });
            };
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        peerConnections.current[targetId] = pc;
        return pc;
    };

    const createOffer = async (targetId: string) => {
        const pc = createPeerConnection(targetId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignaling(targetId, 'offer', offer);
    };

    const handleSignaling = async (signal: Signaling) => {
        let pc = peerConnections.current[signal.from_player_id];

        if (signal.type === 'offer') {
            if (!pc) pc = createPeerConnection(signal.from_player_id);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignaling(signal.from_player_id, 'answer', answer);
        } else if (signal.type === 'answer') {
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            }
        } else if (signal.type === 'candidate') {
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
            }
        }
    };

    const sendSignaling = async (to: string, type: string, payload: any) => {
        await supabase.from('signaling').insert({
            room_code: roomCode,
            from_player_id: playerId,
            to_player_id: to,
            type,
            payload,
        });
    };

    return (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-purple-500" />
                    <h3 className="text-white font-bold">{t('voiceChat')}</h3>
                </div>
                <button
                    onClick={isMicEnabled ? stopMic : startMic}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isMicEnabled
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50'
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/50'
                        }`}
                >
                    {isMicEnabled ? (
                        <>
                            <MicOff className="w-4 h-4" />
                            {t('disableMic')}
                        </>
                    ) : (
                        <>
                            <Mic className="w-4 h-4" />
                            {t('enableMic')}
                        </>
                    )}
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${activeSpeakers.has(player.id)
                            ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'bg-gray-900/50 border-gray-700'
                            }`}
                    >
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className={`text-sm ${activeSpeakers.has(player.id) ? 'text-white' : 'text-gray-400'}`}>
                            {player.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VoiceChat;
