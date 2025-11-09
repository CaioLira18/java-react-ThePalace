package com.br.cesar.caio.thepalace.entities;

import com.br.cesar.caio.thepalace.entities.enums.UserRole;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "tb_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private UserRole role;
    private String name;
    private String email;
    private String cpf;
    private String password;
    private int balance;

}