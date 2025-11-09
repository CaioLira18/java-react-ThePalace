import React, { useEffect, useState } from 'react'

const Header = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState('');

  function handleLogOut() {
    console.log('🚪 Fazendo logout...');
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setName('');
    window.location.href = '/';
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        fetch(`http://localhost:8080/api/users`)
          .then((res) => {
            return res.json();
          })
          .then((allUsers) => {
            const fullUser = allUsers.find(user => user.id === parsedUser.id);

            if (fullUser) {
              console.log('👤 Usuário encontrado:', fullUser);
              console.log('📋 Detalhes do usuário:');
              console.log('  - ID:', fullUser.id);
              console.log('  - Nome:', fullUser.name);
              console.log('  - Email:', fullUser.email);
              console.log('  - Role:', fullUser.role);
              console.log('  - É Admin?', fullUser.role === 'ADMIN');

              setIsAuthenticated(true);
              setIsAdmin(fullUser.role === 'ADMIN');
              setName(fullUser.name || '');
            } else {
              localStorage.removeItem("user");
              setIsAuthenticated(false);
              setIsAdmin(false);
              setName('');
            }
          })
      } catch (parseError) {
        localStorage.removeItem("user");
      }
    } else {
      console.log('❌ Nenhum usuário encontrado no localStorage');
    }
  }, []);


  return (
    <div>
      <div className="header">
        <div className="headerContainer">
          <div className="imageLogoHeader">
            <img src="" alt="" />
          </div>
          <div className="optionsHeader">
            <ul>
              <div className="optionIndividual">
                <i className="fa-solid fa-house"></i>
                <li><a href="/">Home</a></li>
              </div>
              {!isAuthenticated && (
                <div className="optionIndividual">
                  <i className="fa-solid fa-user"></i>
                  <li><a href="/login">Login</a></li>
                </div>
              )}
              {!isAuthenticated && (
                <div className="optionIndividual">
                  <i className="fa-solid fa-user"></i>
                  <li><a href="/roulettegame">Roleta</a></li>
                </div>
              )}
              {isAuthenticated && (
                <div className="optionIndividual">
                  <i className="fa-solid fa-user"></i>
                  <li><a href="/edit">{name}</a></li>
                </div>
              )}
              {isAuthenticated && (
                <div className="optionIndividual">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <li><a onClick={handleLogOut} style={{ cursor: 'pointer' }}>Sair</a></li>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header