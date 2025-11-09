package com.br.cesar.caio.thepalace.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.br.cesar.caio.thepalace.entities.User;


public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
    Optional<User> findByCpf(String cpf);
}