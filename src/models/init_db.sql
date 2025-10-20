CREATE DATABASE IF NOT EXISTS gestion_proyectos;
USE gestion_proyectos;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'trabajador', 'jefe_proyecto') NOT NULL
);

INSERT INTO usuarios (username, password, rol) VALUES
('admin', '$2b$10$uKcoz/5XNJIt5xNgeGcaneU6zY.c1JQcIMFwVobEgyYa.JlHthZVm', 'admin'),
('trabajador', '$2b$10$rYR4ThZbF4x7VHU6oTJJeOiQOWxsOnnV3o9G1rW0HNyuJGEuFBLgq', 'trabajador');