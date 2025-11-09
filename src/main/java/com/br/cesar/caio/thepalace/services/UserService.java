package com.br.cesar.caio.thepalace.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.br.cesar.caio.thepalace.entities.User;
import com.br.cesar.caio.thepalace.repository.UserRepository;


@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);
        return userRepository.save(user);
    }

    public Optional<User> updateUser(String id, User updatedUser) {
        return userRepository.findById(id).map(user -> {
            user.setName(updatedUser.getName());
            user.setEmail(updatedUser.getEmail());
            user.setCpf(updatedUser.getCpf());
            user.setRole(updatedUser.getRole());
            user.setBalance(updatedUser.getBalance());


            if (!updatedUser.getPassword().equals(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }

            return userRepository.save(user);
        });
    }

    public boolean deleteUser(String id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return true;
        }).orElse(false);
    }
}