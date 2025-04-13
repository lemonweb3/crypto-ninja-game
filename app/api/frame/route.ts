// Базовая конфигурация для нашей игры
const GAME_CONFIG = {
  title: 'Crypto Ninja',
  description: 'Slice the crypto coins!',
  welcomeImage: 'https://i.ibb.co/yB5XVsv8/2cf8a48c2e58861e697635aad7b0ffe6.jpg',
  gameImage: 'https://i.ibb.co/yB5XVsv8/2cf8a48c2e58861e697635aad7b0ffe6.jpg',
  gameOverImage: 'https://i.ibb.co/yB5XVsv8/2cf8a48c2e58861e697635aad7b0ffe6.jpg',
  roundDuration: 60,
  penaltyAmount: 50,
  rewardAmount: 100,
  livesCount: 3,
};

// Список монет для игры
const COINS = [
  { name: 'Bitcoin', symbol: 'BTC', emoji: '₿', points: 100 },
  { name: 'Ethereum', symbol: 'ETH', emoji: 'Ξ', points: 80 },
  { name: 'Dogecoin', symbol: 'DOGE', emoji: 'Ð', points: 50 },
  { name: 'Solana', symbol: 'SOL', emoji: '◎', points: 70 },
  { name: 'SCAM', symbol: 'SCAM', emoji: '💣', points: -150, isScam: true },
];

// Определяем возможные экраны как тип
type GameScreen = 'menu' | 'game' | 'rules' | 'leaderboard' | 'shop' | 'gameOver';

// Интерфейс для состояния игры
interface GameState {
  score: number;
  lives: number;
  currentCoin: typeof COINS[0];
  options: typeof COINS;
  gameOver: boolean;
  startTime: number;
  combo: number;
  currentScreen: GameScreen;
}

// Создаем новое состояние игры
function createNewGameState(): GameState {
  const shuffledCoins = [...COINS].sort(() => Math.random() - 0.5);
  const options = shuffledCoins.filter(coin => !coin.isScam).slice(0, 2);
  if (Math.random() < 0.3) {
    options.push(COINS.find(coin => coin.isScam)!);
  } else {
    options.push(shuffledCoins[2]);
  }
  
  return {
    score: 0,
    lives: GAME_CONFIG.livesCount,
    currentCoin: shuffledCoins[0],
    options: options.sort(() => Math.random() - 0.5),
    gameOver: false,
    startTime: Date.now(),
    combo: 1,
    currentScreen: 'menu'
  };
}

// Вычисляем оставшееся время
function getRemainingTime(startTime: number): number {
  const elapsed = (Date.now() - startTime) / 1000;
  return Math.max(0, GAME_CONFIG.roundDuration - elapsed);
}

// Создаем фрейм меню
function createMenuFrame() {
  return {
    version: 'vNext',
    image: GAME_CONFIG.welcomeImage,
    title: '⚔️ ' + GAME_CONFIG.title,
    buttons: [
      {
        label: '🎮 Начать игру',
        action: 'post',
      },
      {
        label: '📜 Правила',
        action: 'post',
      },
      {
        label: '🏆 Таблица лидеров',
        action: 'post',
      },
      {
        label: '🛍️ Магазин',
        action: 'post',
      }
    ],
  };
}

// Создаем фрейм с игрой
function createGameFrame(state: GameState) {
  const remainingTime = getRemainingTime(state.startTime);
  
  if (state.gameOver || remainingTime <= 0) {
    return {
      version: 'vNext',
      image: GAME_CONFIG.gameOverImage,
      title: `🎮 Game Over! Final Score: ${state.score}`,
      buttons: [
        {
          label: '🔄 Играть снова',
          action: 'post',
        },
        {
          label: '📊 Таблица лидеров',
          action: 'post',
        },
        {
          label: '🏠 В главное меню',
          action: 'post',
        }
      ],
    };
  }

  return {
    version: 'vNext',
    image: GAME_CONFIG.gameImage,
    title: `Score: ${state.score} | Lives: ${'❤️'.repeat(state.lives)} | Combo: x${state.combo}`,
    buttons: state.options.map(coin => ({
      label: `${coin.emoji} ${coin.name} (${coin.isScam ? '☠️' : '+' + coin.points})`,
      action: 'post',
    })),
  };
}

// Создаем фрейм правил
function createRulesFrame() {
  return {
    version: 'vNext',
    image: GAME_CONFIG.welcomeImage,
    title: '📜 Правила игры',
    buttons: [
      {
        label: '🎮 Начать игру',
        action: 'post',
      },
      {
        label: '🏠 В главное меню',
        action: 'post',
      }
    ],
  };
}

// Создаем фрейм таблицы лидеров
function createLeaderboardFrame() {
  return {
    version: 'vNext',
    image: GAME_CONFIG.welcomeImage,
    title: '🏆 Таблица лидеров (скоро)',
    buttons: [
      {
        label: '🎮 Начать игру',
        action: 'post',
      },
      {
        label: '🏠 В главное меню',
        action: 'post',
      }
    ],
  };
}

// Создаем фрейм магазина
function createShopFrame() {
  return {
    version: 'vNext',
    image: GAME_CONFIG.welcomeImage,
    title: '🛍️ Магазин (скоро)',
    buttons: [
      {
        label: '🎮 Начать игру',
        action: 'post',
      },
      {
        label: '🏠 В главное меню',
        action: 'post',
      }
    ],
  };
}

// GET запрос для начального отображения фрейма
export async function GET() {
  return Response.json({
    frames: [createMenuFrame()],
  });
}

// POST запрос для обработки действий кнопок
export async function POST(request: Request) {
  const data = await request.json();
  const { buttonIndex, state: savedState } = data.untrustedData;
  
  let gameState = createNewGameState();

  if (savedState) {
    try {
      gameState = JSON.parse(savedState);
    } catch {
      console.error('Failed to parse saved state');
    }
  }

  // Обработка кнопок главного меню
  if (gameState.currentScreen === 'menu' || !savedState) {
    switch (buttonIndex) {
      case 1: // Начать игру
        gameState.currentScreen = 'game';
        return Response.json({
          frames: [createGameFrame(gameState)],
          state: JSON.stringify(gameState),
        });
      case 2: // Правила
        gameState.currentScreen = 'rules';
        return Response.json({
          frames: [createRulesFrame()],
          state: JSON.stringify(gameState),
        });
      case 3: // Таблица лидеров
        gameState.currentScreen = 'leaderboard';
        return Response.json({
          frames: [createLeaderboardFrame()],
          state: JSON.stringify(gameState),
        });
      case 4: // Магазин
        gameState.currentScreen = 'shop';
        return Response.json({
          frames: [createShopFrame()],
          state: JSON.stringify(gameState),
        });
    }
  }

  // Обработка кнопок из других экранов
  if (gameState.currentScreen === 'rules' || 
      gameState.currentScreen === 'leaderboard' || 
      gameState.currentScreen === 'shop') {
    if (buttonIndex === 1) { // Начать игру
      gameState = createNewGameState();
      gameState.currentScreen = 'game';
      return Response.json({
        frames: [createGameFrame(gameState)],
        state: JSON.stringify(gameState),
      });
    }
    if (buttonIndex === 2) { // В главное меню
      gameState.currentScreen = 'menu';
      return Response.json({
        frames: [createMenuFrame()],
        state: JSON.stringify(gameState),
      });
    }
  }

  // Обработка кнопок экрана окончания игры
  if (gameState.currentScreen === 'gameOver') {
    switch (buttonIndex) {
      case 1: // Играть снова
        gameState = createNewGameState();
        gameState.currentScreen = 'game';
        return Response.json({
          frames: [createGameFrame(gameState)],
          state: JSON.stringify(gameState),
        });
      case 2: // Таблица лидеров
        gameState.currentScreen = 'leaderboard';
        return Response.json({
          frames: [createLeaderboardFrame()],
          state: JSON.stringify(gameState),
        });
      case 3: // В главное меню
        gameState.currentScreen = 'menu';
        return Response.json({
          frames: [createMenuFrame()],
          state: JSON.stringify(gameState),
        });
    }
  }

  // Обработка игрового процесса
  if (gameState.currentScreen === 'game') {
    if (getRemainingTime(gameState.startTime) <= 0) {
      gameState.gameOver = true;
      gameState.currentScreen = 'gameOver';
      return Response.json({
        frames: [createGameFrame(gameState)],
        state: JSON.stringify(gameState),
      });
    }

    const selectedCoin = gameState.options[buttonIndex - 1];
    
    if (selectedCoin.isScam) {
      gameState.lives--;
      gameState.combo = 1;
      gameState.score = Math.max(0, gameState.score + selectedCoin.points);
    } else {
      const points = selectedCoin.points * gameState.combo;
      gameState.score += points;
      gameState.combo++;
    }

    if (gameState.lives <= 0) {
      gameState.gameOver = true;
      gameState.currentScreen = 'gameOver';
      return Response.json({
        frames: [createGameFrame(gameState)],
        state: JSON.stringify(gameState),
      });
    }

    const newState = {
      ...createNewGameState(),
      score: gameState.score,
      lives: gameState.lives,
      combo: gameState.combo,
      startTime: gameState.startTime,
      currentScreen: 'game' as GameScreen
    };

    return Response.json({
      frames: [createGameFrame(newState)],
      state: JSON.stringify(newState),
    });
  }

  // По умолчанию возвращаем главное меню
  return Response.json({
    frames: [createMenuFrame()],
    state: JSON.stringify(createNewGameState()),
  });
}