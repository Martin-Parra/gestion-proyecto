#!/bin/bash

# Script de Instalación Automática - Sistema de Gestión de Proyectos
# Para sistemas Unix/Linux/macOS

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para mostrar mensajes de estado
print_status() {
    echo -e "${YELLOW}>>> $1${NC}"
}

# Función para mostrar errores
print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

# Función para mostrar éxito
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${GREEN}=== INSTALADOR AUTOMÁTICO - SISTEMA DE GESTIÓN DE PROYECTOS ===${NC}"
echo ""

# 1. Verificar prerrequisitos
print_status "Verificando prerrequisitos..."

if ! command_exists node; then
    print_error "Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm no está disponible. Reinstala Node.js."
    exit 1
fi

print_success "Node.js y npm están instalados"

# Mostrar versiones
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "  ${CYAN}- Node.js: $NODE_VERSION${NC}"
echo -e "  ${CYAN}- npm: $NPM_VERSION${NC}"

# 2. Verificar MySQL
print_status "Verificando MySQL..."

if ! command_exists mysql; then
    echo -e "${YELLOW}ADVERTENCIA: MySQL no se encuentra en PATH. Asegúrate de que MySQL esté instalado y ejecutándose.${NC}"
    echo -e "${YELLOW}Puedes instalar MySQL desde: https://dev.mysql.com/downloads/mysql/${NC}"
else
    print_success "MySQL está disponible"
fi

# 3. Instalar dependencias de Node.js
print_status "Instalando dependencias de Node.js..."

if [ -f "package.json" ]; then
    if npm install; then
        print_success "Dependencias instaladas correctamente"
    else
        print_error "Error al instalar dependencias"
        exit 1
    fi
else
    print_error "No se encontró package.json en el directorio actual"
    exit 1
fi

# 4. Configurar base de datos
print_status "Configurando base de datos..."

echo -e "${YELLOW}IMPORTANTE: Asegúrate de que MySQL esté ejecutándose antes de continuar.${NC}"
read -p "¿MySQL está ejecutándose? (s/n): " mysql_running

if [[ $mysql_running == "s" || $mysql_running == "S" || $mysql_running == "y" || $mysql_running == "Y" ]]; then
    print_status "Creando tablas de base de datos..."
    
    # Crear tablas principales
    if node scripts/create_tables.js; then
        print_success "Tablas principales creadas"
    else
        print_error "Error al crear tablas principales"
        echo -e "${YELLOW}Verifica la conexión a MySQL y las credenciales en src/db/connection.js${NC}"
    fi
    
    # Crear tabla de tareas
    if node scripts/create_tareas_table.js; then
        print_success "Tabla de tareas creada"
    else
        print_error "Error al crear tabla de tareas"
    fi
    
    # 5. Crear usuario administrador
    print_status "Creando usuario administrador..."
    
    if node scripts/create_admin_user.js; then
        print_success "Usuario administrador creado"
    else
        print_error "Error al crear usuario administrador"
    fi
    
    # 6. Crear datos de prueba (opcional)
    echo ""
    read -p "¿Deseas crear datos de prueba? (s/n): " create_test_data
    
    if [[ $create_test_data == "s" || $create_test_data == "S" || $create_test_data == "y" || $create_test_data == "Y" ]]; then
        print_status "Creando datos de prueba..."
        
        # Crear jefe de proyecto
        if node scripts/create_jefe_proyecto.js; then
            print_success "Jefe de proyecto creado"
        fi
        
        # Crear trabajador
        if node scripts/create_trabajador_user.js; then
            print_success "Usuario trabajador creado"
        fi
        
        # Crear proyecto y asignaciones
        if node scripts/create_proyecto_trabajador.js; then
            print_success "Proyecto de prueba y asignaciones creadas"
        fi
    fi
    
else
    echo -e "${YELLOW}Instalación pausada. Inicia MySQL y ejecuta manualmente:${NC}"
    echo -e "${CYAN}  node scripts/create_tables.js${NC}"
    echo -e "${CYAN}  node scripts/create_tareas_table.js${NC}"
    echo -e "${CYAN}  node scripts/create_admin_user.js${NC}"
fi

# 7. Verificar instalación
print_status "Verificando instalación..."

if [ -d "node_modules" ]; then
    print_success "Dependencias instaladas correctamente"
fi

if [ -f "src/index.js" ]; then
    print_success "Archivos del servidor encontrados"
fi

# 8. Mostrar instrucciones finales
echo ""
echo -e "${GREEN}=== INSTALACIÓN COMPLETADA ===${NC}"
echo ""
echo -e "${CYAN}Para iniciar el servidor:${NC}"
echo -e "${NC}  npm start${NC}"
echo ""
echo -e "${CYAN}Luego abre tu navegador en:${NC}"
echo -e "${NC}  http://localhost:3000${NC}"
echo ""
echo -e "${CYAN}Credenciales por defecto del administrador:${NC}"
echo -e "${NC}  Usuario: admin${NC}"
echo -e "${NC}  Contraseña: admin123${NC}"
echo ""
echo -e "${GREEN}¡El sistema está listo para usar!${NC}"
echo ""

# Hacer el script ejecutable
chmod +x "$0"