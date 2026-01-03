import { useState } from 'react';
import HomePage from './components/HomePage';
import Game from './components/Game';

function App() {
  const [gameState, setGameState] = useState<{
    roomCode: string | null;
    playerId: string | null;
    username: string | null;
  }>({
    roomCode: null,
    playerId: null,
    username: null,
  });

  const handleRoomJoined = (roomCode: string, playerId: string, username: string) => {
    setGameState({ roomCode, playerId, username });
  };

  const handleLeaveGame = () => {
    setGameState({ roomCode: null, playerId: null, username: null });
  };

  if (gameState.roomCode && gameState.playerId && gameState.username) {
    return (
      <Game
        roomCode={gameState.roomCode}
        playerId={gameState.playerId}
        username={gameState.username}
        onLeave={handleLeaveGame}
      />
    );
  }

  return <HomePage onRoomJoined={handleRoomJoined} />;
}

export default App;
