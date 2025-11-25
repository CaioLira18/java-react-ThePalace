import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, TrendingUp, Coins, Shuffle, Calculator, BarChart3 } from 'lucide-react';

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
  
  // Estados para probabilidades
  const [probabilityType, setProbabilityType] = useState('exponencial');
  const [winProbBeforeCard, setWinProbBeforeCard] = useState(0);
  const [winProbAfterCard, setWinProbAfterCard] = useState(0);
  const [bustProbability, setBustProbability] = useState(0);
  
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

  // Calcular cartas restantes no deck
  const getRemainingCards = () => {
    const remaining = { 
      total: deck.length,
      values: { A: 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0, J: 0, Q: 0, K: 0 }
    };
    
    deck.forEach(card => {
      remaining.values[card.value]++;
    });
    
    return remaining;
  };

  // Calcular probabilidade de estouro (bust)
  const calculateBustProbability = (currentTotal) => {
    if (currentTotal >= 21) return currentTotal > 21 ? 1 : 0;
    
    const remaining = getRemainingCards();
    const totalCards = remaining.total;
    
    if (totalCards === 0) return 0;
    
    let bustCards = 0;
    
    // Contar cartas que causariam estouro
    Object.entries(remaining.values).forEach(([value, count]) => {
      let cardValue = value === 'A' ? 1 : ['J', 'Q', 'K'].includes(value) ? 10 : parseInt(value);
      if (currentTotal + cardValue > 21) {
        bustCards += count;
      }
    });
    
    return bustCards / totalCards;
  };

  // Calcular probabilidades usando distribuição exponencial
  const calculateExponentialProbability = (currentTotal, dealerUpCard) => {
    // Usar a carta do dealer para ajustar λ
    let dealerValue = 10; // assumir carta alta se não tiver
    if (dealerUpCard) {
      dealerValue = dealerUpCard.value === 'A' ? 11 : 
                   ['J', 'Q', 'K'].includes(dealerUpCard.value) ? 10 : 
                   parseInt(dealerUpCard.value);
    }
    
    // λ baseado na vantagem relativa (mais alto = melhor posição)
    const advantage = (currentTotal - dealerValue) / 21;
    const lambda = 0.15 + Math.abs(advantage) * 0.05;
    const x = Math.max(0, (21 - currentTotal)) / 10; // distância normalizada até 21
    
    // P(Vitória) = 1 - e^(-λx) para posição boa, e^(-λx) para posição ruim
    let winProb;
    if (currentTotal > dealerValue) {
      winProb = 1 - Math.exp(-lambda * x);
    } else {
      winProb = Math.exp(-lambda * x * 2);
    }
    
    return Math.min(Math.max(winProb, 0.05), 0.95);
  };

  // Calcular probabilidades usando distribuição contínua (normal)
  const calculateContinuousProbability = (currentTotal, dealerUpCard) => {
    // Parâmetros da distribuição normal
    const optimalTotal = 20; // valor ótimo próximo a 21
    const mean = 18.5;
    const stdDev = 2.5;
    
    // Valor da carta do dealer
    let dealerValue = 10;
    if (dealerUpCard) {
      dealerValue = dealerUpCard.value === 'A' ? 11 : 
                   ['J', 'Q', 'K'].includes(dealerUpCard.value) ? 10 : 
                   parseInt(dealerUpCard.value);
    }
    
    // Score normalizado baseado na posição relativa
    const playerScore = Math.min(currentTotal, 21);
    const z = (playerScore - mean) / stdDev;
    
    // Função de distribuição cumulativa normal (aproximação)
    const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
    
    // Ajustar baseado na carta do dealer
    let winProb = cdf;
    if (dealerValue >= 7) {
      winProb *= 0.9; // dealer tem carta boa, reduz chances
    } else {
      winProb *= 1.1; // dealer tem carta ruim, aumenta chances
    }
    
    return Math.min(Math.max(winProb, 0.05), 0.95);
  };
  
  // Função de erro (aproximação para CDF normal)
  const erf = (x) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  };

  // Calcular probabilidades usando distribuição hipergeométrica
  const calculateHypergeometricProbability = (currentTotal, dealerUpCard) => {
    const remaining = getRemainingCards();
    const N = remaining.total; // população total
    
    if (N === 0) return 0.5;
    
    // Definir "sucessos" baseado na situação atual
    let target = 21 - currentTotal; // pontos necessários para chegar em 21
    let favorableCards = 0;
    
    // Contar cartas favoráveis (que nos levam mais perto da vitória)
    Object.entries(remaining.values).forEach(([value, count]) => {
      let cardValue = value === 'A' ? 
        (currentTotal <= 10 ? 11 : 1) : 
        ['J', 'Q', 'K'].includes(value) ? 10 : parseInt(value);
      
      // Carta é favorável se:
      // 1. Nos leva para 21 exato
      // 2. Nos mantém abaixo de 21 e melhora nossa posição
      // 3. Não causa bust
      if (currentTotal + cardValue === 21) {
        favorableCards += count * 3; // peso extra para blackjack
      } else if (currentTotal + cardValue < 21 && currentTotal + cardValue >= 17) {
        favorableCards += count * 2; // peso para posição boa
      } else if (currentTotal + cardValue < 21) {
        favorableCards += count; // peso normal
      }
    });
    
    // Calcular probabilidade hipergeométrica
    // P(sucesso) = favorableCards / totalCards
    const successRate = favorableCards / (N * 2); // normalizar pesos
    
    // Ajustar baseado na carta do dealer
    let dealerValue = 10;
    if (dealerUpCard) {
      dealerValue = dealerUpCard.value === 'A' ? 11 : 
                   ['J', 'Q', 'K'].includes(dealerUpCard.value) ? 10 : 
                   parseInt(dealerUpCard.value);
    }
    
    let winProb = successRate;
    if (dealerValue <= 6) {
      winProb *= 1.2; // dealer tem carta ruim
    } else if (dealerValue >= 10) {
      winProb *= 0.8; // dealer tem carta boa
    }
    
    return Math.min(Math.max(winProb, 0.05), 0.95);
  };

  // Calcular probabilidade baseada no tipo selecionado
  const calculateWinProbability = (currentTotal, dealerUpCard = null) => {
    switch (probabilityType) {
      case 'exponencial':
        return calculateExponentialProbability(currentTotal, dealerUpCard);
      case 'continua':
        return calculateContinuousProbability(currentTotal, dealerUpCard);
      case 'hipergeometrica':
        return calculateHypergeometricProbability(currentTotal, dealerUpCard);
      default:
        return 0.5;
    }
  };

  // Atualizar probabilidades em tempo real
  useEffect(() => {
    if (gameState === 'playing') {
      const dealerUp = dealerHand.length > 0 ? dealerHand[0] : null;
      const beforeCard = calculateWinProbability(playerTotal, dealerUp);
      const bust = calculateBustProbability(playerTotal);
      
      setWinProbBeforeCard(beforeCard);
      setBustProbability(bust);
      // limpar o valor "após a carta" até que o jogador realmente compre
      setWinProbAfterCard(0);
    }
  }, [playerTotal, dealerHand, gameState, probabilityType, deck]);

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
    
    // Reset probabilidades
    setWinProbBeforeCard(0);
    setWinProbAfterCard(0);
    setBustProbability(0);

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
    
    // Calcular probabilidade após puxar a carta
    const dealerUp = dealerHand.length > 0 ? dealerHand[0] : null;
    const afterCard = calculateWinProbability(newTotal, dealerUp);
    setWinProbAfterCard(afterCard);
    
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
    
    // Reset probabilidades
    setWinProbBeforeCard(0);
    setWinProbAfterCard(0);
    setBustProbability(0);
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
    
    // Reset probabilidades
    setWinProbBeforeCard(0);
    setWinProbAfterCard(0);
    setBustProbability(0);
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

  // Renderizar fórmulas matemáticas
  const renderFormula = () => {
    let dealerValue = 10;
    if (dealerHand.length > 0) {
      dealerValue = dealerHand[0].value === 'A' ? 11 : 
                   ['J', 'Q', 'K'].includes(dealerHand[0].value) ? 10 : 
                   parseInt(dealerHand[0].value);
    }

    switch (probabilityType) {
      case 'exponencial':
        const advantage = (playerTotal - dealerValue) / 21;
        const lambda = (0.15 + Math.abs(advantage) * 0.05).toFixed(3);
        const x = (Math.max(0, (21 - playerTotal)) / 10).toFixed(3);
        
        return (
          <div className="formula-display">
            <h4>Distribuição Exponencial</h4>
            <div className="formula">P(Vitória) = {playerTotal > dealerValue ? '1 - e^(-λx)' : 'e^(-2λx)'}</div>
            <div className="parameters">
              <div>Vantagem = ({playerTotal} - {dealerValue}) / 21 = {advantage.toFixed(3)}</div>
              <div>λ = 0.15 + |{advantage.toFixed(3)}| × 0.05 = {lambda}</div>
              <div>x = max(0, 21 - {playerTotal}) / 10 = {x}</div>
              <div>Posição: {playerTotal > dealerValue ? 'Boa (fórmula crescente)' : 'Ruim (fórmula decrescente)'}</div>
              <div className="result-highlight">P(Vitória) = {(winProbBeforeCard * 100).toFixed(2)}%</div>
            </div>
          </div>
        );

      case 'continua':
        const mean = 18.5;
        const stdDev = 2.5;
        const z = ((Math.min(playerTotal, 21) - mean) / stdDev).toFixed(3);
        const adjustment = dealerValue >= 7 ? '× 0.9 (dealer forte)' : '× 1.1 (dealer fraco)';

        return (
          <div className="formula-display">
            <h4>Distribuição Normal (Contínua)</h4>
            <div className="formula">Φ(z) = ∫(-∞ to z) (1/√(2π)) × e^(-t²/2) dt</div>
            <div className="parameters">
              <div>μ (média) = {mean}</div>
              <div>σ (desvio) = {stdDev}</div>
              <div>X (score) = min({playerTotal}, 21) = {Math.min(playerTotal, 21)}</div>
              <div>Z = ({Math.min(playerTotal, 21)} - {mean}) / {stdDev} = {z}</div>
              <div>Φ(Z) = CDF normal em Z = {((0.5 * (1 + erf(parseFloat(z) / Math.sqrt(2)))).toFixed(3))}</div>
              <div>Ajuste dealer: {adjustment}</div>
              <div className="result-highlight">P(Vitória) = {(winProbBeforeCard * 100).toFixed(2)}%</div>
            </div>
          </div>
        );

      case 'hipergeometrica':
        const remaining = getRemainingCards();
        const N = remaining.total;
        
        // Recalcular cartas favoráveis para mostrar na fórmula
        let favorableCards = 0;
        let exactCards = 0, goodCards = 0, okCards = 0;
        
        Object.entries(remaining.values).forEach(([value, count]) => {
          let cardValue = value === 'A' ? 
            (playerTotal <= 10 ? 11 : 1) : 
            ['J', 'Q', 'K'].includes(value) ? 10 : parseInt(value);
          
          if (playerTotal + cardValue === 21) {
            exactCards += count;
            favorableCards += count * 3;
          } else if (playerTotal + cardValue < 21 && playerTotal + cardValue >= 17) {
            goodCards += count;
            favorableCards += count * 2;
          } else if (playerTotal + cardValue < 21) {
            okCards += count;
            favorableCards += count;
          }
        });

        return (
          <div className="formula-display">
            <h4>Distribuição Hipergeométrica</h4>
            <div className="formula">P(Sucesso) = Cartas_Favoráveis_Ponderadas / (N × 2)</div>
            <div className="parameters">
              <div>N (população) = {N} cartas restantes</div>
              <div>Cartas para 21 exato = {exactCards} (peso 3)</div>
              <div>Cartas para 17-20 = {goodCards} (peso 2)</div>
              <div>Cartas para &lt;17 = {okCards} (peso 1)</div>
              <div>Total ponderado = {exactCards}×3 + {goodCards}×2 + {okCards}×1 = {favorableCards}</div>
              <div>Taxa base = {favorableCards} / ({N} × 2) = {(favorableCards / (N * 2)).toFixed(3)}</div>
              <div>Ajuste dealer ({dealerValue}): {dealerValue <= 6 ? '× 1.2 (fraco)' : dealerValue >= 10 ? '× 0.8 (forte)' : '× 1.0 (neutro)'}</div>
              <div className="result-highlight">P(Vitória) = {(winProbBeforeCard * 100).toFixed(2)}%</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="blackjack-split-container">
      {/* LADO ESQUERDO - JOGO */}
      <div className="game-side">
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
      </div>

      {/* LADO DIREITO - PROBABILIDADES */}
      <div className="probability-side">
        <div className="probability-header">
          <div className="rawHeader">
          <h2><Calculator size={24} /> Análise Probabilística</h2>
          <div className="probability-controls">
            <label>Modelo:</label>
            <select 
              value={probabilityType} 
              onChange={(e) => setProbabilityType(e.target.value)}
            >
              <option value="exponencial">Exponencial</option>
              <option value="continua">Contínua (Normal)</option>
              <option value="hipergeometrica">Hipergeométrica</option>
            </select>
          </div>
          </div>
        </div>

        {renderFormula()}

        <div className="probability-results">
          <h3>Probabilidades em Tempo Real</h3>
          
          <div className="prob-card">
            <div className="prob-label">Antes da próxima carta:</div>
            <div className="prob-value win">{(winProbBeforeCard * 100).toFixed(2)}%</div>
            <div className="prob-desc">Chance de vitória atual</div>
          </div>

          {winProbAfterCard > 0 && (
            <div className="prob-card">
              <div className="prob-label">Após última carta:</div>
              <div className="prob-value after">{(winProbAfterCard * 100).toFixed(2)}%</div>
              <div className="prob-desc">Chance após comprar</div>
            </div>
          )}

          <div className="prob-card">
            <div className="prob-label">Probabilidade de Estouro:</div>
            <div className="prob-value bust">{(bustProbability * 100).toFixed(2)}%</div>
            <div className="prob-desc">Chance de ultrapassar 21</div>
          </div>

          <div className="deck-info">
            <h4>Informações do Deck</h4>
            <div className="deck-stats">
              <div>Cartas restantes: {deck.length}</div>
              <div>Cartas altas (≥10): {Object.entries(getRemainingCards().values).reduce((acc, [value, count]) => {
                let cardValue = value === 'A' ? 11 : ['J', 'Q', 'K'].includes(value) ? 10 : parseInt(value);
                return acc + (cardValue >= 10 ? count : 0);
              }, 0)}</div>
              <div>Cartas baixas (≤6): {Object.entries(getRemainingCards().values).reduce((acc, [value, count]) => {
                let cardValue = value === 'A' ? 1 : ['J', 'Q', 'K'].includes(value) ? 10 : parseInt(value);
                return acc + (cardValue <= 6 ? count : 0);
              }, 0)}</div>
            </div>
          </div>
        </div>

        <div className="probability-chart">
          <h3><BarChart3 size={20} /> Distribuição Histórica</h3>
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="chart-canvas-small"
          />
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;