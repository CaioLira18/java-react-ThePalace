package com.br.cesar.caio.thepalace.controllers;

import com.br.cesar.caio.thepalace.entities.enums.UserRole;

public class LoginResponse {
    private String id;
    private String email;
    private String name;
    private String cpf;
    private UserRole role;
    private String token;

    public LoginResponse(String id, String email, String name, String cpf, UserRole role) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.cpf = cpf;
        this.role = role;
        this.token = "temporary-token"; // Por enquanto um token fixo
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}