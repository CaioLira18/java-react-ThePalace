import React, { useState } from 'react'

const Register = () => {
  const [role, setRole] = useState("USER");
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  async function handleRegister() {
    // Validações básicas
    if (!name || !email || !cpf || !password || !confirmPassword) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    if (role === "ADMIN" && !adminPassword) {
      alert("É necessário informar a senha de Admin!");
      return;
    }

    // Monta os dados
    const userData = {
      name,
      email,
      cpf,
      password,
      role,
      adminPassword: role === "ADMIN" ? adminPassword : null
    };

    try {
      const response = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        alert("Conta cadastrada com sucesso!");
        // Redirecionar para login
        window.location.href = "/login";
      } else {
        const errorData = await response.json();
        alert("Erro: " + (errorData.message || "Não foi possível registrar"));
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao conectar com o servidor.");
    }
  }

  return (
    <div>
      <div className="login">
        <div className="loginContainer">
          <div className="imageLogin">
            <img src="" alt="" />
          </div>
          <div className="informationsLogin">
            <div className="cabecalhoLogin">
              <div className="boxCabecalho">
                <h2>Bem Vindo !</h2>
                <p>Preencha as Informações para criar sua conta</p>
              </div>
            </div>

            <div className="loginInput">
              <h1>Nome</h1>
              <div className="inputBox">
                <input value={name} onChange={e => setName(e.target.value)} placeholder='Digite seu Nome' type="text" />
              </div>
            </div>

            <div className="loginInput">
              <h1>Email</h1>
              <div className="inputBox">
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder='Digite seu email' type="email" />
              </div>
            </div>

            <div className="loginInput">
              <h1>CPF</h1>
              <div className="inputBox">
                <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder='Digite seu CPF' type="text" />
              </div>
            </div>

            <div className="loginInput">
              <h1>Senha</h1>
              <div className="inputBox">
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder='Digite sua senha' type="password" />
              </div>
            </div>

            <div className="loginInput">
              <h1>Confirmar Senha</h1>
              <div className="inputBox">
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder='Confirme sua Senha' type="password" />
              </div>
            </div>

            <div className="loginInput">
              <h1>Nível da Conta</h1>
              <div className="inputBox">
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {role === "ADMIN" && (
              <div className="loginInput">
                <h1>Senha de Admin</h1>
                <div className="inputBox">
                  <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder='Digite a Senha de Admin' type="password" />
                </div>
              </div>
            )}

            <div className="buttonLogin">
              <button onClick={handleRegister}>Cadastrar Conta</button>
            </div>

            <div className="withoutAccount">
              <p>Já tem conta ? <a href="/login"><strong>Faça Login</strong></a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register