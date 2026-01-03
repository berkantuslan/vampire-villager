import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { joinRoom } from '../lib/gameUtils';

const JoinRoomModal = ({
  onClose,
  onRoomJoined,
}: {
  onClose: () => void;
  onRoomJoined: (roomCode: string, playerId: string, username: string) => void;
}) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!username.trim()) {
      setError(t('enterUsername'));
      return;
    }

    if (!roomCode.trim()) {
      setError(t('enterRoomCode'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const player = await joinRoom(roomCode.trim().toUpperCase(), username.trim(), null);
      onRoomJoined(roomCode.trim().toUpperCase(), player.id, username.trim());
      onClose();
    } catch (err: any) {
      console.error('Join room error:', err);
      // t('joinError') doesn't exist yet, so we use generic or specific message
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-purple-500">{t('joinRoom')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('enterUsername')}
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('roomCode')}
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              placeholder={t('enterRoomCode')}
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('join')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;
