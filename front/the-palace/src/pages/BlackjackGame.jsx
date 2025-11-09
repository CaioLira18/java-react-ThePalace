import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, TrendingUp, Coins, Shuffle } from 'lucide-react';

const BlackjackGame = () => {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // betting, playing, dealer, finished
  const [message, setMessage] = useState('Faça sua aposta e clique em Iniciar.');
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [hideDealerCard, setHideDealerCard] = useState(true);
  
  // Estatísticas
  const [totalGames, setTotalGames] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [pushes, setPushes] = useState(0);
  const [blackjacks, setBlackjacks] = useState(0);
  const [busts, setBusts] = useState(0);
  
  // Histórico de resultados
  const [results, setResults] = useState({ win: 0, loss: 0, push: 0 });
  
  const canvasRef = useRef(null);

  // Criar baralho
  const createDeck = () => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck = [];
    
    // 6 baralhos
    for (let d = 0; d < 6; d++) {
      for (let suit of suits) {
        for (let value of values) {
          newDeck.push({ suit, value });
        }
      }
    }
    
    // Embaralhar
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    
    return newDeck;
  };

  // Inicializar deck
  useEffect(() => {
    setDeck(createDeck());
  }, []);

  // Calcular valor da mão
  const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    
    for (let card of hand) {
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    // Ajustar ases
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  // Atualizar totais quando as mãos mudam
  useEffect(() => {
    setPlayerTotal(calculateHandValue(playerHand));
  }, [playerHand]);

  useEffect(() => {
    setDealerTotal(calculateHandValue(dealerHand));
  }, [dealerHand]);

  // Iniciar jogo
  const startGame = () => {
    if (betAmount > balance) {
      setMessage('Saldo insuficiente. Reduza sua aposta.');
      return;
    }

    if (deck.length < 20) {
      setDeck(createDeck());
    }

    setBalance(prev => prev - betAmount);
    setGameState('playing');
    setHideDealerCard(true);
    setMessage('Sua vez. Comprar ou Parar?');

    // Distribuir cartas
    const newDeck = [...deck];
    const newPlayerHand = [newDeck.pop(), newDeck.pop()];
    const newDealerHand = [newDeck.pop(), newDeck.pop()];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setDeck(newDeck);

    // Verificar blackjack natural
    const playerValue = calculateHandValue(newPlayerHand);
    if (playerValue === 21) {
      setTimeout(() => checkForBlackjack(newPlayerHand, newDealerHand), 500);
    }
  };

  // Verificar blackjack
  const checkForBlackjack = (pHand, dHand) => {
    const pValue = calculateHandValue(pHand);
    const dValue = calculateHandValue(dHand);
    
    if (pValue === 21 && dValue === 21) {
      endGame('push', 'Ambos têm Blackjack. Empate.');
    } else if (pValue === 21) {
      setBlackjacks(prev => prev + 1);
      endGame('blackjack', 'Blackjack! Você ganhou 1.5x.');
    }
  };

  // Comprar carta
  const hit = () => {
    if (gameState !== 'playing') return;

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newPlayerHand = [...playerHand, newCard];
    
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);

    const newTotal = calculateHandValue(newPlayerHand);
    if (newTotal > 21) {
      setBusts(prev => prev + 1);
      endGame('bust', `Estourou com ${newTotal}. Você perdeu.`);
    }
  };

  // Parar
  const stand = () => {
    if (gameState !== 'playing') return;

    setGameState('dealer');
    setHideDealerCard(false);
    setMessage('Vez do dealer...');

    setTimeout(() => {
      dealerPlay();
    }, 1000);
  };

  // Dealer joga
  const dealerPlay = () => {
    let newDealerHand = [...dealerHand];
    let newDeck = [...deck];
    let dTotal = calculateHandValue(newDealerHand);

    // Dealer compra até 17
    while (dTotal < 17) {
      const newCard = newDeck.pop();
      newDealerHand.push(newCard);
      dTotal = calculateHandValue(newDealerHand);
    }

    setDealerHand(newDealerHand);
    setDeck(newDeck);

    setTimeout(() => {
      determineWinner(calculateHandValue(playerHand), dTotal);
    }, 500);
  };

  // Determinar vencedor
  const determineWinner = (pTotal, dTotal) => {
    if (dTotal > 21) {
      endGame('win', `Dealer estourou com ${dTotal}. Você ganhou.`);
    } else if (pTotal > dTotal) {
      endGame('win', `${pTotal} vs ${dTotal}. Você ganhou.`);
    } else if (pTotal < dTotal) {
      endGame('loss', `${pTotal} vs ${dTotal}. Você perdeu.`);
    } else {
      endGame('push', `${pTotal} vs ${dTotal}. Empate.`);
    }
  };

  // Finalizar jogo
  const endGame = (result, msg) => {
    setGameState('finished');
    setHideDealerCard(false);
    setMessage(msg);
    setTotalGames(prev => prev + 1);

    if (result === 'win') {
      setWins(prev => prev + 1);
      setBalance(prev => prev + betAmount * 2);
      setResults(prev => ({ ...prev, win: prev.win + 1 }));
    } else if (result === 'blackjack') {
      setWins(prev => prev + 1);
      setBalance(prev => prev + betAmount * 2.5);
      setResults(prev => ({ ...prev, win: prev.win + 1 }));
    } else if (result === 'loss' || result === 'bust') {
      setLosses(prev => prev + 1);
      setResults(prev => ({ ...prev, loss: prev.loss + 1 }));
    } else if (result === 'push') {
      setPushes(prev => prev + 1);
      setBalance(prev => prev + betAmount);
      setResults(prev => ({ ...prev, push: prev.push + 1 }));
    }
  };

  // Nova rodada
  const newRound = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameState('betting');
    setHideDealerCard(true);
    setMessage('Faça sua aposta e clique em Iniciar.');
  };

  // Resetar jogo
  const resetGame = () => {
    setBalance(1000);
    setPlayerHand([]);
    setDealerHand([]);
    setGameState('betting');
    setMessage('Jogo resetado. Faça sua aposta.');
    setTotalGames(0);
    setWins(0);
    setLosses(0);
    setPushes(0);
    setBlackjacks(0);
    setBusts(0);
    setResults({ win: 0, loss: 0, push: 0 });
    setDeck(createDeck());
  };

  // Renderizar carta
  const renderCard = (card, hidden = false) => {
    if (hidden) {
      return (
        <div className="card card-back">
          <div className="card-pattern"></div>
        </div>
      );
    }

    const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
    const suitSymbol = {
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣',
      'Spades': '♠'
    }[card.suit];

    return (
      <div className={`card ${isRed ? 'red' : 'black'}`}>
        <div className="card-corner top-left">
          <div className="card-value">{card.value}</div>
          <div className="card-suit">{suitSymbol}</div>
        </div>
        <div className="card-center">{suitSymbol}</div>
        <div className="card-corner bottom-right">
          <div className="card-value">{card.value}</div>
          <div className="card-suit">{suitSymbol}</div>
        </div>
      </div>
    );
  };

  // Calcular porcentagens
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
  const lossRate = totalGames > 0 ? ((losses / totalGames) * 100).toFixed(1) : 0;
  const pushRate = totalGames > 0 ? ((pushes / totalGames) * 100).toFixed(1) : 0;

  // Desenhar gráfico
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    if (totalGames === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Comece a jogar para ver a distribuição de resultados', width / 2, height / 2);
      return;
    }

    const barWidth = width / 3 - 40;
    const maxCount = Math.max(results.win, results.loss, results.push, 1);

    // Desenhar barras
    const categories = [
      { label: 'Vitórias', value: results.win, color: '#51cf66', x: 50 },
      { label: 'Derrotas', value: results.loss, color: '#ff6b6b', x: width / 2 - barWidth / 2 },
      { label: 'Empates', value: results.push, color: '#ffd700', x: width - barWidth - 50 }
    ];

    categories.forEach(cat => {
      const barHeight = (cat.value / maxCount) * (height - 100);
      const y = height - barHeight - 40;

      ctx.fillStyle = cat.color;
      ctx.fillRect(cat.x, y, barWidth, barHeight);

      // Valor
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cat.value, cat.x + barWidth / 2, y - 10);

      // Label
      ctx.font = '16px sans-serif';
      ctx.fillText(cat.label, cat.x + barWidth / 2, height - 10);

      // Porcentagem
      const percentage = totalGames > 0 ? ((cat.value / totalGames) * 100).toFixed(1) : 0;
      ctx.font = '14px sans-serif';
      ctx.fillText(`${percentage}%`, cat.x + barWidth / 2, y - 30);
    });

    // Linha teórica (dealer advantage ~0.5%)
    ctx.strokeStyle = '#ff0066';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const theoreticalY = height - ((0.495 * totalGames / maxCount) * (height - 100)) - 40;
    ctx.beginPath();
    ctx.moveTo(0, theoreticalY);
    ctx.lineTo(width, theoreticalY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ff0066';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Taxa teórica de vitória: ~49.5%', 10, 20);

  }, [results, totalGames]);

  return (
    <div className="blackjack-container">
      <div className="header">
        <h1 className="title">THE PALACE - BLACKJACK</h1>
        <p className="subtitle">Jogue e Aprenda Probabilidade Condicional</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-value"><Coins size={24} /> {balance}</div>
          <div className="stat-label">Saldo (fichas)</div>
        </div>

        <div className="stat-card pink">
          <div className="stat-value">{totalGames}</div>
          <div className="stat-label">Jogos</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-value">{winRate}%</div>
          <div className="stat-label">Taxa de Vitória</div>
        </div>

        <div className="stat-card green">
          <div className="stat-value">{blackjacks}</div>
          <div className="stat-label">Blackjacks</div>
        </div>
      </div>

      <div className="message-panel">
        <p>{message}</p>
      </div>

      <div className="game-area">
        <div className="dealer-section">
          <h3>Dealer {!hideDealerCard && `(${dealerTotal})`}</h3>
          <div className="hand">
            {dealerHand.map((card, i) => (
              <div key={i} className="card-wrapper">
                {renderCard(card, i === 1 && hideDealerCard)}
              </div>
            ))}
          </div>
        </div>

        <div className="player-section">
          <h3>Você ({playerTotal})</h3>
          <div className="hand">
            {playerHand.map((card, i) => (
              <div key={i} className="card-wrapper">
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="controls-area">
        {gameState === 'betting' && (
          <div className="betting-controls">
            <label>
              Aposta:
              <input
                type="number"
                min="1"
                max={balance}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              fichas
            </label>
            <button onClick={startGame} className="action-btn start">
              <Play size={20} /> Iniciar Jogo
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-controls">
            <button onClick={hit} className="action-btn hit">
              Comprar Carta
            </button>
            <button onClick={stand} className="action-btn stand">
              Parar
            </button>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="game-controls">
            <button onClick={newRound} className="action-btn new-round">
              <Shuffle size={20} /> Nova Rodada
            </button>
          </div>
        )}

        <button onClick={resetGame} className="action-btn reset">
          <RotateCcw size={20} /> Resetar Jogo
        </button>
      </div>

      <div className="stats-details">
        <h3>Estatísticas Detalhadas</h3>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label-detail">Vitórias:</span>
            <span className="stat-value-detail win">{wins}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label-detail">Derrotas:</span>
            <span className="stat-value-detail loss">{losses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label-detail">Empates:</span>
            <span className="stat-value-detail push">{pushes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label-detail">Estouros:</span>
            <span className="stat-value-detail bust">{busts}</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h2 className="chart-title">
          <TrendingUp /> Distribuição de Resultados (Empírico vs Teórico)
        </h2>
        <canvas
          ref={canvasRef}
          width={1000}
          height={400}
          className="chart-canvas"
        />
        <div className="chart-legend">
          <div><strong>Barras:</strong> Frequência empírica de cada resultado</div>
          <div><strong>Linha tracejada rosa:</strong> Taxa teórica de vitória (49.5%)</div>
          <div><strong>Vantagem da casa:</strong> O dealer tem aproximadamente 0.5% de vantagem usando estratégia básica</div>
        </div>
      </div>

      <div className="explanation">
        <h3>Como Funciona</h3>
        <ul>
          <li><strong>Objetivo:</strong> Chegar mais perto de 21 que o dealer sem estourar</li>
          <li><strong>Valores:</strong> Ás = 1 ou 11, Figuras = 10, outros = valor nominal</li>
          <li><strong>Blackjack:</strong> 21 com duas cartas (Ás + 10/Figura) paga 1.5x</li>
          <li><strong>Regras do Dealer:</strong> Deve comprar até 17, depois deve parar</li>
          <li><strong>Probabilidade:</strong> O dealer tem pequena vantagem (~0.5%) porque você joga primeiro e pode estourar</li>
          <li><strong>Estratégia Básica:</strong> Comprar com 11 ou menos, parar com 17 ou mais. Entre 12-16 depende da carta visível do dealer</li>
          <li><strong>Contagem de Cartas:</strong> Este jogo usa 6 baralhos, tornando a contagem menos efetiva</li>
        </ul>
      </div>
    </div>
  );
};

export default BlackjackGame;