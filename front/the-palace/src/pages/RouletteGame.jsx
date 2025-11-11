import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, TrendingUp, Coins, Target } from 'lucide-react';

/**
 * Retorna o multiplicador de pagamento e o texto de exibição para a roleta.
 * O multiplicador é o *retorno total* (aposta + lucro).
 * @param {number} numSelected - O número de casas selecionadas.
 * @returns {{multiplier: number, text: string}}
 */
const getPayoutInfo = (numSelected) => {
  switch (numSelected) {
    case 0:
      return { multiplier: 0, text: 'N/A' };
    case 1: // Pleno (Straight Up)
      return { multiplier: 36, text: '35:1 (35x)' };
    case 2: // Cavalo (Split)
      return { multiplier: 18, text: '17:1 (17x)' };
    case 3: // Rua (Street)
      return { multiplier: 12, text: '11:1 (11x)' };
    case 4: // Canto (Corner)
      return { multiplier: 9, text: '8:1 (8x)' };
    case 6: // Linha (Six Line)
      return { multiplier: 6, text: '5:1 (5x)' };
    case 12: // Dúzia/Coluna (Dozen/Column)
      return { multiplier: 3, text: '2:1 (2x)' };
    case 18: // Vermelho/Preto, Par/Ímpar, 1-18/19-36
      return { multiplier: 2, text: '1:1 (1x)' };
    default:
      // Regra de fallback para apostas não-padrão (ex: 5, 7, etc.)
      // O casino geralmente arredonda para baixo, pagando o menor prêmio possível.
      const multiplier = Math.floor(36 / numSelected);
      return { multiplier: multiplier, text: `${multiplier - 1}:1 (Aposta não-padrão)` };
  }
};


const RouletteGame = () => {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(1000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [totalSpins, setTotalSpins] = useState(0);
  const [results, setResults] = useState(Array(37).fill(0));
  const [message, setMessage] = useState('Escolha seus números e faça sua aposta.');
  
  const [chiSquare, setChiSquare] = useState(0);
  const [pValue, setPValue] = useState(1);
  
  const canvasRef = useRef(null);

  const getNumberColor = (num) => {
    if (num === 0) return 'green';
    const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    return reds.includes(num) ? 'red' : 'black';
  };

  const toggleNumber = (num) => {
    if (isSpinning) return;
    
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else {
        return [...prev, num];
      }
    });
  };

  const betOnColor = (color) => {
    if (isSpinning) return;
    
    let numbers = [];
    if (color === 'red') {
      numbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    } else if (color === 'black') {
      numbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
    } else if (color === 'green') {
      numbers = [0];
    }
    setSelectedNumbers(numbers);
  };

  const spinWheel = () => {
    if (selectedNumbers.length === 0) {
      setMessage('Escolha pelo menos um número antes de girar.');
      return;
    }
    
    if (betAmount > balance) {
      setMessage('Saldo insuficiente. Reduza sua aposta.');
      return;
    }

    setIsSpinning(true);
    setBalance(prev => prev - betAmount);
    setMessage('Girando a roleta...');

    setTimeout(() => {
      const result = Math.floor(Math.random() * 37);
      setLastResult(result);
      setTotalSpins(prev => prev + 1);
      
      setResults(prev => {
        const newResults = [...prev];
        newResults[result]++;
        return newResults;
      });

      const won = selectedNumbers.includes(result);
      let winAmount = 0;
      let profit = 0;
      
      if (won) {
        // *** LÓGICA DE PAGAMENTO CORRIGIDA ***
        // Pega o multiplicador de retorno total (aposta + lucro)
        const { multiplier } = getPayoutInfo(selectedNumbers.length);
        
        winAmount = betAmount * multiplier; // Este é o retorno *total*
        profit = winAmount - betAmount; // Este é o *lucro*
        
        setBalance(prev => prev + winAmount);
      }

      setHistory(prev => [{
        number: result,
        selected: selectedNumbers,
        bet: betAmount,
        won: won,
        profit: won ? profit : -betAmount, // Armazena o lucro ou a perda
        timestamp: Date.now()
      }, ...prev.slice(0, 9)]);

      const color = getNumberColor(result);
      if (won) {
        // Mensagem de vitória mais clara
        setMessage(`Resultado: ${result} (${color}). Você lucrou ${profit} fichas (total recebido: ${winAmount}).`);
      } else {
        setMessage(`Resultado: ${result} (${color}). Você perdeu ${betAmount} fichas.`);
      }
      
      setIsSpinning(false);
    }, 2000);
  };

  const calculateChiSquare = () => {
    if (totalSpins < 37) return { chi: 0, p: 1 };
    
    const expected = totalSpins / 37;
    let chi = 0;
    
    results.forEach(observed => {
      chi += Math.pow(observed - expected, 2) / expected;
    });
    
    // Aproximação simples do p-valor, não é estatisticamente rigorosa mas serve para o jogo
    const p = chi < 36 ? 1 - (chi / 72) : 0.01; 
    return { chi: chi.toFixed(2), p: Math.max(0, Math.min(1, p)).toFixed(3) };
  };

  useEffect(() => {
    if (totalSpins > 0) {
      const stats = calculateChiSquare();
      setChiSquare(stats.chi);
      setPValue(stats.p);
    }
  }, [totalSpins, results]); // Adicionado 'results' como dependência

  const handleReset = () => {
    setSelectedNumbers([]);
    setBalance(1000);
    setHistory([]);
    setTotalSpins(0);
    setResults(Array(37).fill(0));
    setLastResult(null);
    setChiSquare(0);
    setPValue(1);
    setMessage('Jogo resetado. Boa sorte.');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    if (totalSpins === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Comece a jogar para ver a distribuição de probabilidade', width/2, height/2);
      return;
    }
    
    const maxCount = Math.max(...results, 1);
    const expectedFreq = totalSpins / 37;
    const barWidth = width / 37;
    
    const theoreticalY = height - (expectedFreq / maxCount) * (height - 40);
    ctx.strokeStyle = '#ff0066';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, theoreticalY);
    ctx.lineTo(width, theoreticalY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    results.forEach((count, num) => {
      const x = num * barWidth;
      const barHeight = (count / maxCount) * (height - 40);
      const y = height - barHeight;
      
      const color = getNumberColor(num);
      ctx.fillStyle = num === lastResult ? '#FFD700' : 
                      color === 'red' ? '#ff006680' :
                      color === 'green' ? '#00ff0080' : '#66666680';
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      if (num % 3 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(num, x + 2, height - 5);
      }
    });
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Frequência Empírica`, 10, 20);
    ctx.fillStyle = '#ff0066';
    ctx.fillText(`Teórica: ${expectedFreq.toFixed(1)}`, 10, 35);
    
  }, [results, totalSpins, lastResult]);

  return (
    <div className="roulette-container">

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-value"><Coins size={24} /> {balance}</div>
          <div className="stat-label">Saldo (fichas)</div>
        </div>
        
        <div className="stat-card pink">
          <div className="stat-value">{totalSpins}</div>
          <div className="stat-label">Rodadas Jogadas</div>
        </div>
        
        <div className="stat-card blue">
          <div className="stat-value">{chiSquare}</div>
          <div className="stat-label">Chi-Quadrado</div>
        </div>
        
        <div className="stat-card green">
          <div className="stat-value">{pValue}</div>
          <div className="stat-label">P-valor</div>
        </div>
      </div>

      <div className="message-panel">
        <p>{message}</p>
      </div>

      <div className="betting-area">
        <div className="betting-header">
          <h2><Target /> Mesa de Apostas</h2>
          <div className="bet-controls">
            <label>
              Aposta:
              <input
                type="number"
                min="1"
                max={balance}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isSpinning}
              />
              fichas
            </label>
          </div>
        </div>

        <div className="quick-bets">
          <button onClick={() => betOnColor('red')} disabled={isSpinning} className="quick-bet red">
            Vermelho (18 números)
          </button>
          <button onClick={() => betOnColor('black')} disabled={isSpinning} className="quick-bet black">
            Preto (18 números)
          </button>
          <button onClick={() => betOnColor('green')} disabled={isSpinning} className="quick-bet green">
            Zero (1 número)
          </button>
          <button onClick={() => setSelectedNumbers([])} disabled={isSpinning} className="quick-bet clear">
            Limpar Seleção
          </button>
        </div>

        <div className="number-grid">
          {Array.from({length: 37}, (_, i) => i).map(num => (
            <button
              key={num}
              onClick={() => toggleNumber(num)}
              disabled={isSpinning}
              className={`number-btn ${getNumberColor(num)} ${selectedNumbers.includes(num) ? 'selected' : ''} ${lastResult === num ? 'last-result' : ''}`}
            >
              {num}
            </button>
          ))}
        </div>

        {selectedNumbers.length > 0 && (
          <div className="selection-info">
            <strong>Números selecionados:</strong> {selectedNumbers.sort((a,b) => a-b).join(', ')}
            <br />
            <strong>Probabilidade teórica de ganho:</strong> {((selectedNumbers.length / 37) * 100).toFixed(2)}%
            <br />
            <strong>Pagamento potencial:</strong> { getPayoutInfo(selectedNumbers.length).text }
          </div>
        )}

        <button
          onClick={spinWheel}
          disabled={isSpinning || selectedNumbers.length === 0}
          className="spin-button"
        >
          {isSpinning ? 'GIRANDO...' : <><Play size={24} /> GIRAR ROLETA</>}
        </button>

        <button onClick={handleReset} className="reset-button">
          <RotateCcw size={20} /> Resetar Jogo
        </button>
      </div>

      {history.length > 0 && (
        <div className="history-panel">
          <h3>Histórico (últimas 10 rodadas)</h3>
          <div className="history-grid">
            {history.map((h, i) => (
              <div key={i} className={`history-item ${h.won ? 'win' : 'lose'}`}>
                <div className="history-result">
                  <span className={`result-number ${getNumberColor(h.number)}`}>{h.number}</span>
                </div>
                <div className="history-details">
                  <div>Aposta: {h.bet} fichas</div>
                  <div className={h.won ? 'profit-positive' : 'profit-negative'}>
                    {h.won ? `+${h.profit}` : h.profit} fichas
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chart-container">
        <h2 className="chart-title">
          <TrendingUp /> Distribuição de Probabilidade (Empírico vs Teórico)
        </h2>
        <canvas
          ref={canvasRef}
          width={1200}
          height={400}
          className="chart-canvas"
        />
        <div className="chart-legend">
          <div><strong>Barras coloridas:</strong> Frequência empírica de cada número</div>
          <div><strong>Linha tracejada rosa:</strong> Frequência teórica esperada (1/37 = 2.7%)</div>
          <div><strong>Barra dourada:</strong> Último número sorteado</div>
          <div><strong>Convergência:</strong> Quanto mais você joga, mais as barras se aproximam da linha</div>
        </div>
      </div>

      <div className="explanation">
        <h3>Como Funciona</h3>
        <ul>
          <li><strong>Escolha seus números:</strong> Clique nos números ou use as apostas rápidas (vermelho/preto/zero)</li>
          <li><strong>Defina sua aposta:</strong> Escolha quantas fichas quer apostar</li>
          <li><strong>Gire a roleta:</strong> Veja se acertou e acompanhe seus ganhos</li>
          <li><strong>Probabilidade Teórica:</strong> Cada número tem 1/37 = 2.7% de chance. Vermelho e Preto têm 18/37 = 48.6%</li>
          <li><strong>Lei dos Grandes Números:</strong> Quanto mais você joga, mais a distribuição empírica se aproxima da teórica</li>
          <li><strong>Teste Chi-Quadrado:</strong> Valores baixos indicam que os resultados estão seguindo a distribuição esperada</li>
          <li><strong>Pagamentos:</strong> Os pagamentos seguem as regras padrão (ex: Pleno paga 35:1, Dúzia paga 2:1)</li>
        </ul>
      </div>
    </div>
  );
};

export default RouletteGame;