// Базовая конфигурация для нашей игры
const GAME_CONFIG = {
  title: 'Crypto Ninja',
  description: 'Slice the crypto coins!',
  // Обновленные URL для разных состояний игры
  welcomeImage: 'https://images.unsplash.com/photo-1593397899681-12c47155d9b8?q=80&w=1200&h=630&fit=crop',
  gameImage: 'https://images.unsplash.com/photo-1593397899681-12c47155d9b8?q=80&w=1200&h=630&fit=crop', // Временно используем тот же фон
  gameOverImage: 'https://images.unsplash.com/photo-1593397899681-12c47155d9b8?q=80&w=1200&h=630&fit=crop', // Временно используем тот же фон
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
  // Добавим "опасные" монеты
  { name: 'SCAM', symbol: 'SCAM', emoji: '💣', points: -150, isScam: true },
];

// Интерфейс для состояния игры
interface GameState {
  score: number;
  lives: number;
  currentCoin: typeof COINS[0];
  options: typeof COINS;
  gameOver: boolean;
  startTime: number;
  combo: number;
}

// Создаем новое состояние игры
function createNewGameState(): GameState {
  const shuffledCoins = [...COINS].sort(() => Math.random() - 0.5);
  // Убедимся, что скам-монета появляется реже
  const options = shuffledCoins.filter(coin => !coin.isScam).slice(0, 2);
  if (Math.random() < 0.3) { // 30% шанс появления скам-монеты
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
    combo: 1
  };
}

// Вычисляем оставшееся время
function getRemainingTime(startTime: number): number {
  const elapsed = (Date.now() - startTime) / 1000;
  return Math.max(0, GAME_CONFIG.roundDuration - elapsed);
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
          label: '🔄 Play Again',
          action: 'post',
        },
        {
          label: '🏆 Share Score',
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

// Начальный фрейм
const initialFrame = {
  version: 'vNext',
  image: GAME_CONFIG.welcomeImage,
  title: '⚔️ ' + GAME_CONFIG.title,
  buttons: [
    {
      label: '🎮 Start Game',
      action: 'post',
    },
    {
      label: '📜 Rules',
      action: 'post',
    }
  ],
};

// GET запрос для начального отображения фрейма
export async function GET() {
  return Response.json({
    frames: [initialFrame],
  });
}

// POST запрос для обработки действий кнопок
export async function POST(request: Request) {
  const data = await request.json();
  const { buttonIndex, state: savedState } = data.untrustedData;
  
  // Инициализируем gameState значением по умолчанию
  let gameState = createNewGameState();

  // Пытаемся восстановить сохраненное состояние
  if (savedState) {
    try {
      gameState = JSON.parse(savedState);
    } catch {
      // Если не удалось распарсить состояние, оставляем новое состояние
      console.error('Failed to parse saved state');
    }
  }

  // Обработка кнопок начального экрана
  if (!savedState) {
    if (buttonIndex === 1) { // Start Game
      return Response.json({
        frames: [createGameFrame(gameState)],
        state: JSON.stringify(gameState),
      });
    }

    if (buttonIndex === 2) { // Rules
      return Response.json({
        frames: [{
          version: 'vNext',
          image: GAME_CONFIG.welcomeImage,
          title: '📜 Game Rules',
          buttons: [
            {
              label: '🎮 Start Game',
              action: 'post',
            }
          ],
        }],
      });
    }
  } else {
    // Проверяем, не закончилось ли время
    if (getRemainingTime(gameState.startTime) <= 0) {
      gameState.gameOver = true;
      return Response.json({
        frames: [createGameFrame(gameState)],
        state: JSON.stringify(gameState),
      });
    }

    // Обработка игрового процесса
    const selectedCoin = gameState.options[buttonIndex - 1];
    
    if (selectedCoin.isScam) {
      // Игрок выбрал скам-монету
      gameState.lives--;
      gameState.combo = 1;
      gameState.score = Math.max(0, gameState.score + selectedCoin.points);
    } else {
      // Обычная монета
      const points = selectedCoin.points * gameState.combo;
      gameState.score += points;
      gameState.combo++; // Увеличиваем комбо
    }

    // Проверяем условия окончания игры
    if (gameState.lives <= 0) {
      gameState.gameOver = true;
      return Response.json({
        frames: [createGameFrame(gameState)],
        state: JSON.stringify(gameState),
      });
    }

    // Создаем новый раунд
    const newState = {
      ...createNewGameState(),
      score: gameState.score,
      lives: gameState.lives,
      combo: gameState.combo,
      startTime: gameState.startTime,
    };

    return Response.json({
      frames: [createGameFrame(newState)],
      state: JSON.stringify(newState),
    });
  }

  // По умолчанию возвращаем начальный экран
  return Response.json({
    frames: [initialFrame],
  });
}