@echo off
REM Script de Instalación Automática - Sistema de Gestión de Proyectos
REM Para Windows (Batch)

echo === INSTALADOR AUTOMATICO - SISTEMA DE GESTION DE PROYECTOS ===
echo.

REM Verificar Node.js
echo Verificando prerrequisitos...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado. Descargalo desde https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm no esta disponible. Reinstala Node.js.
    pause
    exit /b 1
)

echo ✓ Node.js y npm estan instalados
node --version
npm --version
echo.

REM Instalar dependencias
echo Instalando dependencias de Node.js...
if not exist package.json (
    echo ERROR: No se encontro package.json en el directorio actual
    pause
    exit /b 1
)

npm install
if errorlevel 1 (
    echo ERROR: Error al instalar dependencias
    pause
    exit /b 1
)

echo ✓ Dependencias instaladas correctamente
echo.

REM Configurar base de datos
echo Configurando base de datos...
echo IMPORTANTE: Asegurate de que MySQL este ejecutandose antes de continuar.
set /p mysql_running="¿MySQL esta ejecutandose? (s/n): "

if /i "%mysql_running%"=="s" goto setup_db
if /i "%mysql_running%"=="y" goto setup_db
goto skip_db

:setup_db
echo Creando tablas de base de datos...

node scripts/create_tables.js
if errorlevel 1 (
    echo ERROR: Error al crear tablas principales
    echo Verifica la conexion a MySQL y las credenciales en src/db/connection.js
) else (
    echo ✓ Tablas principales creadas
)

node scripts/create_tareas_table.js
if errorlevel 1 (
    echo ERROR: Error al crear tabla de tareas
) else (
    echo ✓ Tabla de tareas creada
)

echo Creando usuario administrador...
node scripts/create_admin_user.js
if errorlevel 1 (
    echo ERROR: Error al crear usuario administrador
) else (
    echo ✓ Usuario administrador creado
)

echo.
set /p create_test="¿Deseas crear datos de prueba? (s/n): "

if /i "%create_test%"=="s" goto create_test_data
if /i "%create_test%"=="y" goto create_test_data
goto finish

:create_test_data
echo Creando datos de prueba...

node scripts/create_jefe_proyecto.js
if not errorlevel 1 echo ✓ Jefe de proyecto creado

node scripts/create_trabajador_user.js
if not errorlevel 1 echo ✓ Usuario trabajador creado

node scripts/create_proyecto_trabajador.js
if not errorlevel 1 echo ✓ Proyecto de prueba y asignaciones creadas

goto finish

:skip_db
echo Instalacion pausada. Inicia MySQL y ejecuta manualmente:
echo   node scripts/create_tables.js
echo   node scripts/create_tareas_table.js
echo   node scripts/create_admin_user.js

:finish
echo.
echo === INSTALACION COMPLETADA ===
echo.
echo Para iniciar el servidor:
echo   npm start
echo.
echo Luego abre tu navegador en:
echo   http://localhost:3000
echo.
echo Credenciales por defecto del administrador:
echo   Usuario: admin
echo   Contraseña: admin123
echo.
echo ¡El sistema esta listo para usar!
echo.
pause