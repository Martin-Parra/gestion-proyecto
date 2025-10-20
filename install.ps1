# Script de Instalación Automática - Sistema de Gestión de Proyectos
# Para Windows PowerShell

Write-Host "=== INSTALADOR AUTOMÁTICO - SISTEMA DE GESTIÓN DE PROYECTOS ===" -ForegroundColor Green
Write-Host ""

# Función para verificar si un comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Función para mostrar mensajes de estado
function Write-Status($message, $color = "Yellow") {
    Write-Host ">>> $message" -ForegroundColor $color
}

# Función para mostrar errores
function Write-Error-Custom($message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
}

# Función para mostrar éxito
function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

try {
    # 1. Verificar prerrequisitos
    Write-Status "Verificando prerrequisitos..."
    
    if (-not (Test-Command "node")) {
        Write-Error-Custom "Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org/"
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error-Custom "npm no está disponible. Reinstala Node.js."
        exit 1
    }
    
    Write-Success "Node.js y npm están instalados"
    
    # Mostrar versiones
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "  - Node.js: $nodeVersion" -ForegroundColor Cyan
    Write-Host "  - npm: $npmVersion" -ForegroundColor Cyan
    
    # 2. Verificar MySQL
    Write-Status "Verificando MySQL..."
    
    if (-not (Test-Command "mysql")) {
        Write-Host "ADVERTENCIA: MySQL no se encuentra en PATH. Asegúrate de que MySQL esté instalado y ejecutándose." -ForegroundColor Yellow
        Write-Host "Puedes descargar MySQL desde: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
    } else {
        Write-Success "MySQL está disponible"
    }
    
    # 3. Instalar dependencias de Node.js
    Write-Status "Instalando dependencias de Node.js..."
    
    if (Test-Path "package.json") {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Dependencias instaladas correctamente"
        } else {
            Write-Error-Custom "Error al instalar dependencias"
            exit 1
        }
    } else {
        Write-Error-Custom "No se encontró package.json en el directorio actual"
        exit 1
    }
    
    # 4. Configurar base de datos
    Write-Status "Configurando base de datos..."
    
    Write-Host "IMPORTANTE: Asegúrate de que MySQL esté ejecutándose antes de continuar." -ForegroundColor Yellow
    $continue = Read-Host "¿MySQL está ejecutándose? (s/n)"
    
    if ($continue -eq "s" -or $continue -eq "S" -or $continue -eq "y" -or $continue -eq "Y") {
        Write-Status "Creando tablas de base de datos..."
        
        # Crear tablas principales
        node scripts/create_tables.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tablas principales creadas"
        } else {
            Write-Error-Custom "Error al crear tablas principales"
            Write-Host "Verifica la conexión a MySQL y las credenciales en src/db/connection.js" -ForegroundColor Yellow
        }
        
        # Crear tabla de tareas
        node scripts/create_tareas_table.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tabla de tareas creada"
        } else {
            Write-Error-Custom "Error al crear tabla de tareas"
        }
        
        # 5. Crear usuario administrador
        Write-Status "Creando usuario administrador..."
        
        node scripts/create_admin_user.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Usuario administrador creado"
        } else {
            Write-Error-Custom "Error al crear usuario administrador"
        }
        
        # 6. Crear datos de prueba (opcional)
        Write-Host ""
        $createTestData = Read-Host "¿Deseas crear datos de prueba? (s/n)"
        
        if ($createTestData -eq "s" -or $createTestData -eq "S" -or $createTestData -eq "y" -or $createTestData -eq "Y") {
            Write-Status "Creando datos de prueba..."
            
            # Crear jefe de proyecto
            node scripts/create_jefe_proyecto.js
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Jefe de proyecto creado"
            }
            
            # Crear trabajador
            node scripts/create_trabajador_user.js
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Usuario trabajador creado"
            }
            
            # Crear proyecto y asignaciones
            node scripts/create_proyecto_trabajador.js
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Proyecto de prueba y asignaciones creadas"
            }
        }
        
    } else {
        Write-Host "Instalación pausada. Inicia MySQL y ejecuta manualmente:" -ForegroundColor Yellow
        Write-Host "  node scripts/create_tables.js" -ForegroundColor Cyan
        Write-Host "  node scripts/create_tareas_table.js" -ForegroundColor Cyan
        Write-Host "  node scripts/create_admin_user.js" -ForegroundColor Cyan
    }
    
    # 7. Verificar instalación
    Write-Status "Verificando instalación..."
    
    if (Test-Path "node_modules") {
        Write-Success "Dependencias instaladas correctamente"
    }
    
    if (Test-Path "src/index.js") {
        Write-Success "Archivos del servidor encontrados"
    }
    
    # 8. Mostrar instrucciones finales
    Write-Host ""
    Write-Host "=== INSTALACIÓN COMPLETADA ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar el servidor:" -ForegroundColor Cyan
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego abre tu navegador en:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Credenciales por defecto del administrador:" -ForegroundColor Cyan
    Write-Host "  Usuario: admin" -ForegroundColor White
    Write-Host "  Contraseña: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "¡El sistema está listo para usar!" -ForegroundColor Green
    
} catch {
    Write-Error-Custom "Error durante la instalación: $($_.Exception.Message)"
    Write-Host "Por favor revisa los errores y ejecuta el script nuevamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")