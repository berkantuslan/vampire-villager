import { useState } from 'react';
import { Moon, Users, BookOpen, Globe, Trophy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import GameGuide from './GameGuide';
import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import Leaderboard from './Leaderboard';

const HomePage = ({ onRoomJoined }: { onRoomJoined: (roomCode: string, playerId: string, username: string) => void }) => {
  const { t, language, setLanguage } = useLanguage();
  const [showGuide, setShowGuide] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="absolute top-0 left-0 w-full h-full">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            <div className="w-1 h-1 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50"></div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-all text-white"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{language === 'tr' ? 'EN' : 'TR'}</span>
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="flex items-center justify-center mb-8 animate-float">
          <div className="relative">
            <Moon className="w-24 h-24 text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]" />
            <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-4 text-center">
          <span className="bg-gradient-to-r from-red-500 via-purple-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-gradient">
            {t('appTitle')}
          </span>
        </h1>

        <p className="text-gray-300 text-lg md:text-xl mb-12 text-center max-w-2xl">
          {language === 'tr'
            ? 'Sosyal çıkarım ve stratejinin birleştiği karanlık bir dünyaya hoş geldiniz'
            : 'Welcome to a dark world where social deduction meets strategy'
          }
        </p>

        <div className="flex flex-col gap-4 w-full max-w-md">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-red-900/50 hover:shadow-red-900/80 transition-all transform hover:scale-105 border border-red-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              {t('createRoom')}
            </span>
          </button>

          <button
            onClick={() => setShowJoinRoom(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-purple-900/50 hover:shadow-purple-900/80 transition-all transform hover:scale-105 border border-purple-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              {t('joinRoom')}
            </span>
          </button>

          <button
            onClick={() => setShowGuide(true)}
            className="group relative px-8 py-4 bg-gray-800/50 backdrop-blur-sm text-white rounded-lg font-bold text-lg border border-gray-700 hover:bg-gray-700/50 transition-all transform hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <BookOpen className="w-6 h-6" />
              {t('gameGuide')}
            </span>
          </button>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-yellow-900/50 hover:shadow-yellow-900/80 transition-all transform hover:scale-105 border border-yellow-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" />
              {t('leaderboard')}
            </span>
          </button>
        </div>

        <div className="mt-16 flex gap-8 text-gray-400 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500 mb-1">3+</div>
            <div>{language === 'tr' ? 'Oyuncu' : 'Players'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500 mb-1">15-30</div>
            <div>{language === 'tr' ? 'Dakika' : 'Minutes'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">2</div>
            <div>{language === 'tr' ? 'Rol' : 'Roles'}</div>
          </div>
        </div>
      </div>

      {showGuide && <GameGuide onClose={() => setShowGuide(false)} />}
      {showCreateRoom && <CreateRoomModal onClose={() => setShowCreateRoom(false)} onRoomCreated={onRoomJoined} />}
      {showJoinRoom && <JoinRoomModal onClose={() => setShowJoinRoom(false)} onRoomJoined={onRoomJoined} />}
      {showLeaderboard && <Leaderboard onBack={() => setShowLeaderboard(false)} />}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
