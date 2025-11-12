import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, TrendingUp, Coins, Calculator, BarChart3, Plane, Target } from 'lucide-react';
import '../css/AviatorGame.css';

const AviatorGame = () => {
  // Estados do jogo
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState('betting'); // betting, flying, crashed, cashed_out
  const [crashPoint, setCrashPoint] = useState(null);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  
  // Estatísticas
  const [totalFlights, setTotalFlights] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [maxMultiplier, setMaxMultiplier] = useState(1.00);
  const [avgCashOut, setAvgCashOut] = useState(0);
  
  // Histórico de resultados
  const [flightHistory, setFlightHistory] = useState([]);
  const [cashOutHistory, setCashOutHistory] = useState([]);
  
  // Estados para análise probabilística
  const [analysisType, setAnalysisType] = useState('exponencial');
  const [crashProbability, setCrashProbability] = useState(0);
  const [expectedValue, setExpectedValue] = useState(0);
  const [optimalCashOut, setOptimalCashOut] = useState(0);
  const [riskLevel, setRiskLevel] = useState('baixo');
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Parâmetros da distribuição exponencial
  const LAMBDA = 0.04; // Taxa de crash (ajustável para house edge)
  const MULTIPLIER_SPEED = 0.1; // Velocidade de crescimento do multiplicador

  // Gerar ponto de crash usando distribuição exponencial
  const generateCrashPoint = () => {
    const random = Math.random();
    // F(x) = 1 - e^(-λ(x-1)) para x >= 1
    // Invertendo: x = 1 - ln(1-u)/λ onde u é random
    const crashMultiplier = 1 - Math.log(1 - random) / LAMBDA;
    return Math.max(1.01, Math.round(crashMultiplier * 100) / 100);
  };

  // Calcular probabilidade de crash antes de um multiplicador x
  const calculateCrashProbability = (x) => {
    if (x <= 1) return 0;
    // P(X < x) = 1 - e^(-λ(x-1))
    return 1 - Math.exp(-LAMBDA * (x - 1));
  };

  // Calcular valor esperado para um cash out em x
  const calculateExpectedValue = (x, betAmount) => {
    const survivalProb = Math.exp(-LAMBDA * (x - 1)); // P(sobreviver até x)
    return betAmount * x * survivalProb;
  };

  // Calcular ponto ótimo de cash out (maximiza valor esperado)
  const calculateOptimalCashOut = () => {
    // Derivando E[X] = bet * x * e^(-λ(x-1)) e igualando a 0
    // Ponto ótimo: x = 1 + 1/λ
    return 1 + (1 / LAMBDA);
  };

  // Análise usando distribuição exponencial
  const performExponentialAnalysis = (currentMultiplier) => {
    const crashProb = calculateCrashProbability(currentMultiplier + 0.5);
    const expectedVal = calculateExpectedValue(currentMultiplier, betAmount);
    const optimal = calculateOptimalCashOut();
    
    return {
      crashProbability: crashProb,
      expectedValue: expectedVal,
      optimalCashOut: optimal,
      riskLevel: crashProb > 0.7 ? 'alto' : crashProb > 0.4 ? 'médio' : 'baixo'
    };
  };

  // Análise usando teoria da decisão
  const performDecisionAnalysis = (currentMultiplier) => {
    const currentGain = betAmount * currentMultiplier;
    const potentialLoss = betAmount;
    
    // Utilidade esperada baseada na função de utilidade logarítmica
    const utility = Math.log(balance + currentGain) - Math.log(balance);
    const lossUtility = Math.log(balance - potentialLoss) - Math.log(balance);
    
    const crashProb = calculateCrashProbability(currentMultiplier + 0.1);
    const expectedUtility = (1 - crashProb) * utility + crashProb * lossUtility;
    
    return {
      crashProbability: crashProb,
      expectedValue: expectedUtility * balance,
      optimalCashOut: currentMultiplier > 2 ? currentMultiplier : calculateOptimalCashOut(),
      riskLevel: expectedUtility > 0 ? 'favorável' : 'desfavorável'
    };
  };

  // Análise usando simulação Monte Carlo
  const performMonteCarloAnalysis = (currentMultiplier) => {
    const simulations = 1000;
    let totalOutcome = 0;
    let successCount = 0;
    
    for (let i = 0; i < simulations; i++) {
      const simulatedCrash = generateCrashPoint();
      if (simulatedCrash >= currentMultiplier) {
        totalOutcome += betAmount * currentMultiplier;
        successCount++;
      } else {
        totalOutcome -= betAmount;
      }
    }
    
    const avgOutcome = totalOutcome / simulations;
    const successRate = successCount / simulations;
    
    return {
      crashProbability: 1 - successRate,
      expectedValue: avgOutcome,
      optimalCashOut: calculateOptimalCashOut(),
      riskLevel: successRate > 0.6 ? 'baixo' : successRate > 0.3 ? 'médio' : 'alto'
    };
  };

  // Realizar análise baseada no tipo selecionado
  const performAnalysis = (currentMultiplier) => {
    switch (analysisType) {
      case 'exponencial':
        return performExponentialAnalysis(currentMultiplier);
      case 'decisao':
        return performDecisionAnalysis(currentMultiplier);
      case 'montecarlo':
        return performMonteCarloAnalysis(currentMultiplier);
      default:
        return performExponentialAnalysis(currentMultiplier);
    }
  };

  // Atualizar análise em tempo real
  useEffect(() => {
    if (gameState === 'flying') {
      const analysis = performAnalysis(multiplier);
      setCrashProbability(analysis.crashProbability);
      setExpectedValue(analysis.expectedValue);
      setOptimalCashOut(analysis.optimalCashOut);
      setRiskLevel(analysis.riskLevel);
    }
  }, [multiplier, gameState, analysisType, betAmount, balance]);

  // Animação do multiplicador
  useEffect(() => {
    if (gameState === 'flying') {
      const interval = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + MULTIPLIER_SPEED;
          
          // Verificar se chegou no ponto de crash
          if (newMultiplier >= crashPoint) {
            setGameState('crashed');
            setMultiplier(crashPoint);
            if (!cashedOut) {
              endGame(false, `Crashed em ${crashPoint.toFixed(2)}x`);
            }
            return crashPoint;
          }
          
          return Math.round(newMultiplier * 100) / 100;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameState, crashPoint, cashedOut]);

  // Iniciar o jogo
  const startGame = () => {
    if (betAmount > balance) {
      alert('Saldo insuficiente!');
      return;
    }

    const newCrashPoint = generateCrashPoint();
    
    setBalance(prev => prev - betAmount);
    setCrashPoint(newCrashPoint);
    setMultiplier(1.00);
    setGameState('flying');
    setCashedOut(false);
    setCashOutMultiplier(0);
    setGameStartTime(Date.now());
  };

  // Cash out
  const cashOut = () => {
    if (gameState !== 'flying' || cashedOut) return;

    const winAmount = betAmount * multiplier;
    setBalance(prev => prev + winAmount);
    setCashedOut(true);
    setCashOutMultiplier(multiplier);
    setGameState('cashed_out');
    
    endGame(true, `Cash out em ${multiplier.toFixed(2)}x! +$${(winAmount - betAmount).toFixed(2)}`);
  };

  // Finalizar jogo
  const endGame = (won, message) => {
    setTotalFlights(prev => prev + 1);
    
    // Atualizar histórico
    const flightData = {
      crashPoint: crashPoint,
      cashedOut: cashedOut ? multiplier : null,
      won: won,
      profit: won ? betAmount * (cashedOut ? cashOutMultiplier : multiplier) - betAmount : -betAmount,
      timestamp: Date.now()
    };
    
    setFlightHistory(prev => [...prev.slice(-49), flightData]);
    
    if (won) {
      setWins(prev => prev + 1);
      const profit = betAmount * (cashedOut ? cashOutMultiplier : multiplier) - betAmount;
      setTotalWinnings(prev => prev + profit);
      setCashOutHistory(prev => [...prev, cashedOut ? cashOutMultiplier : multiplier]);
    } else {
      setLosses(prev => prev + 1);
      setTotalLosses(prev => prev + betAmount);
    }
    
    // Atualizar estatísticas
    if (multiplier > maxMultiplier) {
      setMaxMultiplier(multiplier);
    }
    
    // Calcular média de cash out
    if (won && cashOutHistory.length > 0) {
      const newAvg = [...cashOutHistory, cashedOut ? cashOutMultiplier : multiplier]
        .reduce((acc, val) => acc + val, 0) / (cashOutHistory.length + 1);
      setAvgCashOut(newAvg);
    }

    setTimeout(() => {
      setGameState('betting');
    }, 2000);
  };

  // Nova rodada
  const newRound = () => {
    setGameState('betting');
    setMultiplier(1.00);
    setCrashPoint(null);
    setCashedOut(false);
    setCashOutMultiplier(0);
    
    // Reset análises
    setCrashProbability(0);
    setExpectedValue(0);
    setOptimalCashOut(calculateOptimalCashOut());
    setRiskLevel('baixo');
  };

  // Reset completo
  const resetGame = () => {
    setBalance(1000);
    setTotalFlights(0);
    setWins(0);
    setLosses(0);
    setTotalWinnings(0);
    setTotalLosses(0);
    setMaxMultiplier(1.00);
    setAvgCashOut(0);
    setFlightHistory([]);
    setCashOutHistory([]);
    newRound();
  };

  // Renderizar fórmulas matemáticas
  const renderFormula = () => {
    switch (analysisType) {
      case 'exponencial':
        const lambda = LAMBDA;
        const x = multiplier + 0.5;
        
        return (
          <div className="formula-display">
            <h4>Distribuição Exponencial</h4>
            <div className="formula">F(x) = 1 - e^(-λ(x-1))</div>
            <div className="parameters">
              <div>λ (taxa de crash) = {lambda}</div>
              <div>x (multiplicador alvo) = {x.toFixed(2)}</div>
              <div>P(Crash antes de {x.toFixed(2)}) = 1 - e^(-{lambda} × ({x.toFixed(2)}-1))</div>
              <div>P(Crash) = 1 - e^(-{(lambda * (x-1)).toFixed(4)}) = {(crashProbability * 100).toFixed(2)}%</div>
              <div>Ponto ótimo teórico = 1 + 1/λ = {(1 + 1/lambda).toFixed(2)}x</div>
              <div className="result-highlight">Valor Esperado = ${expectedValue.toFixed(2)}</div>
            </div>
          </div>
        );

      case 'decisao':
        const currentGain = betAmount * multiplier;
        const utility = Math.log(balance + currentGain) - Math.log(balance);
        
        return (
          <div className="formula-display">
            <h4>Teoria da Decisão (Utilidade)</h4>
            <div className="formula">U(x) = ln(B + G) - ln(B)</div>
            <div className="parameters">
              <div>B (saldo atual) = ${balance}</div>
              <div>G (ganho potencial) = ${currentGain.toFixed(2)}</div>
              <div>U(cash out agora) = ln({balance} + {currentGain.toFixed(2)}) - ln({balance})</div>
              <div>U(atual) = {utility.toFixed(4)}</div>
              <div>Risco: {riskLevel}</div>
              <div className="result-highlight">Utilidade Esperada = {expectedValue.toFixed(2)}</div>
            </div>
          </div>
        );

      case 'montecarlo':
        return (
          <div className="formula-display">
            <h4>Simulação Monte Carlo</h4>
            <div className="formula">E[X] = (1/n) × Σ(outcomes)</div>
            <div className="parameters">
              <div>n (simulações) = 1000</div>
              <div>Multiplicador atual = {multiplier.toFixed(2)}x</div>
              <div>Taxa de sucesso simulada = {((1 - crashProbability) * 100).toFixed(1)}%</div>
              <div>Resultado médio por simulação = ${(expectedValue).toFixed(2)}</div>
              <div>Nível de risco = {riskLevel}</div>
              <div className="result-highlight">Valor Esperado (Monte Carlo) = ${expectedValue.toFixed(2)}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calcular estatísticas
  const winRate = totalFlights > 0 ? ((wins / totalFlights) * 100).toFixed(1) : 0;
  const avgProfit = totalFlights > 0 ? ((totalWinnings - totalLosses) / totalFlights).toFixed(2) : 0;
  const netProfit = totalWinnings - totalLosses;

  return (
    <div className="aviator-split-container">
      {/* LADO ESQUERDO - JOGO */}
      <div className="game-side">
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-value"><Coins size={24} /> ${balance}</div>
            <div className="stat-label">Saldo</div>
          </div>

          <div className="stat-card blue">
            <div className="stat-value">{totalFlights}</div>
            <div className="stat-label">Voos</div>
          </div>

          <div className="stat-card green">
            <div className="stat-value">{winRate}%</div>
            <div className="stat-label">Taxa de Vitória</div>
          </div>

          <div className="stat-card gold">
            <div className="stat-value">{maxMultiplier.toFixed(2)}x</div>
            <div className="stat-label">Max Multiplicador</div>
          </div>
        </div>

        <div className="aviator-display">
          <div className="multiplier-display">
            <div className="multiplier-value">
              {multiplier.toFixed(2)}x
            </div>
            <div className="plane-icon">
              <Plane size={48} className={gameState === 'flying' ? 'flying' : ''} />
            </div>
          </div>
          
          {gameState === 'crashed' && (
            <div className="crash-message">
              💥 CRASHED em {crashPoint.toFixed(2)}x
            </div>
          )}
          
          {gameState === 'cashed_out' && (
            <div className="cashout-message">
              ✅ CASH OUT em {cashOutMultiplier.toFixed(2)}x!
            </div>
          )}
        </div>

        <div className="controls-area">
          {gameState === 'betting' && (
            <div className="betting-controls">
              <div className="bet-input">
                <label>Aposta:</label>
                <input
                  type="number"
                  min="1"
                  max={balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <button onClick={startGame} className="action-btn start">
                <Play size={20} /> APOSTAR
              </button>
            </div>
          )}

          {gameState === 'flying' && !cashedOut && (
            <div className="flying-controls">
              <button onClick={cashOut} className="action-btn cashout">
                <Target size={20} /> CASH OUT {multiplier.toFixed(2)}x
              </button>
            </div>
          )}

          {(gameState === 'crashed' || gameState === 'cashed_out') && (
            <div className="end-controls">
              <button onClick={newRound} className="action-btn new-round">
                <Play size={20} /> NOVO VOO
              </button>
            </div>
          )}

          <button onClick={resetGame} className="action-btn reset">
            <RotateCcw size={20} /> Reset
          </button>
        </div>

        <div className="flight-history">
          <h3>Histórico Recente</h3>
          <div className="history-dots">
            {flightHistory.slice(-20).map((flight, index) => (
              <div
                key={index}
                className={`history-dot ${flight.won ? 'win' : 'loss'}`}
                title={`${flight.crashPoint.toFixed(2)}x ${flight.won ? '(Won)' : '(Lost)'}`}
              >
                {flight.crashPoint.toFixed(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LADO DIREITO - ANÁLISE ESTATÍSTICA */}
      <div className="analysis-side">
        <div className="analysis-header">
          <h2><Calculator size={24} /> Análise Estatística</h2>
          <div className="analysis-controls">
            <label>Modelo:</label>
            <select 
              value={analysisType} 
              onChange={(e) => setAnalysisType(e.target.value)}
            >
              <option value="exponencial">Exponencial</option>
              <option value="decisao">Teoria da Decisão</option>
              <option value="montecarlo">Monte Carlo</option>
            </select>
          </div>
        </div>

        {renderFormula()}

        <div className="probability-results">
          <h3>Análise em Tempo Real</h3>
          
          <div className="prob-card">
            <div className="prob-label">Probabilidade de Crash:</div>
            <div className="prob-value crash">{(crashProbability * 100).toFixed(2)}%</div>
            <div className="prob-desc">Antes do próximo 0.5x</div>
          </div>

          <div className="prob-card">
            <div className="prob-label">Valor Esperado:</div>
            <div className="prob-value expected">${expectedValue.toFixed(2)}</div>
            <div className="prob-desc">Se cash out agora</div>
          </div>

          <div className="prob-card">
            <div className="prob-label">Cash Out Ótimo:</div>
            <div className="prob-value optimal">{optimalCashOut.toFixed(2)}x</div>
            <div className="prob-desc">Maximiza valor esperado</div>
          </div>

          <div className="prob-card">
            <div className="prob-label">Nível de Risco:</div>
            <div className={`prob-value risk ${riskLevel}`}>{riskLevel.toUpperCase()}</div>
            <div className="prob-desc">Baseado na análise atual</div>
          </div>
        </div>

        <div className="statistics-summary">
          <h3>Estatísticas Gerais</h3>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label-detail">Lucro/Prejuízo Total:</span>
              <span className={`stat-value-detail ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                ${netProfit.toFixed(2)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label-detail">Média por Voo:</span>
              <span className="stat-value-detail">${avgProfit}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label-detail">Cash Out Médio:</span>
              <span className="stat-value-detail">{avgCashOut.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AviatorGame;