import React from 'react';

const Home = () => {
  return (
    <div className="home-container">
     

      <div className="games-grid">
        <a href="/roulettegame" className="game-card roulette">
          <div className="game-icon">
            <i className="fa-solid fa-circle-notch"></i>
          </div>
          <div className="game-info">
            <h2 className="game-title">Roleta</h2>
            <p className="game-description">
              Explore distribuições uniformes e o teste chi-quadrado
            </p>
            <div className="game-stats">
              <span className="stat-badge">37 números</span>
              <span className="stat-badge">Probabilidade 2.7%</span>
            </div>
          </div>
          <div className="game-arrow">
            <i className="fa-solid fa-arrow-right"></i>
          </div>
        </a>

        <a href="/blackjack" className="game-card blackjack">
          <div className="game-icon">
            <i className="fa-solid fa-spade"></i>
          </div>
          <div className="game-info">
            <h2 className="game-title">Blackjack</h2>
            <p className="game-description">
              Aprenda probabilidade condicional e estratégia básica
            </p>
            <div className="game-stats">
              <span className="stat-badge">21 é o objetivo</span>
              <span className="stat-badge">Vantagem 0.5%</span>
            </div>
          </div>
          <div className="game-arrow">
            <i className="fa-solid fa-arrow-right"></i>
          </div>
        </a>
      </div>

      <div className="home-footer">
        <div className="footer-info">
          <div className="info-card">
            <i className="fa-solid fa-chart-line"></i>
            <h3>Análise em Tempo Real</h3>
            <p>Visualize distribuições empíricas vs teóricas</p>
          </div>
          <div className="info-card">
            <i className="fa-solid fa-graduation-cap"></i>
            <h3>Aprenda Jogando</h3>
            <p>Conceitos de estatística na prática</p>
          </div>
          <div className="info-card">
            <i className="fa-solid fa-chart-bar"></i>
            <h3>Teste Estatístico</h3>
            <p>Chi-quadrado, p-valor e convergência</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;