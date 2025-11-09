package com.br.cesar.caio.thepalace.controllers;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.br.cesar.caio.thepalace.entities.User;
import com.br.cesar.caio.thepalace.repository.UserRepository;



@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        
        System.out.println("=== TENTATIVA DE LOGIN ===");
        System.out.println("Email: " + loginRequest.getEmail());
        System.out.println("Senha recebida: " + loginRequest.getPassword().substring(0, Math.min(5, loginRequest.getPassword().length())) + "...");

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            
            System.out.println("Usuário encontrado: " + user.getName());
            System.out.println("Senha no BD: " + user.getPassword().substring(0, Math.min(20, user.getPassword().length())) + "...");
            
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                System.out.println("Senha não confere para usuário comum");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Senha inválida");
            }
            
            System.out.println("Login de usuário comum bem-sucedido!");

            LoginResponse response = new LoginResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getCpf(),
                    user.getRole()
            );

            return ResponseEntity.ok(response);
        }

        System.out.println("Usuário não encontrado em nenhuma tabela");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário não encontrado");
    }
}