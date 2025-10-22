
# Sistema de Gestión de Proyectos

Un sistema web completo para la gestión de proyectos y tareas, desarrollado con Node.js, Express y MySQL.

## 📋 Características

### Roles de Usuario
- **Administrador**: Gestión completa de usuarios, proyectos y asignaciones
- **Jefe de Proyecto**: Creación y gestión de tareas dentro de sus proyectos
- **Trabajador**: Visualización y actualización del estado de sus tareas asignadas

### Funcionalidades Principales
- ✅ Sistema de autenticación y autorización
- ✅ Gestión de usuarios con diferentes roles
- ✅ Creación y administración de proyectos
- ✅ Asignación de trabajadores a proyectos
- ✅ Gestión completa de tareas (CRUD)
- ✅ Estados de tareas: Pendiente, En Progreso, Revisando, Completada
- ✅ Dashboard específico para cada rol
- ✅ Interfaz responsive y moderna

## 🚀 Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

### Instalación Automática (Recomendada) ⚡

Hemos creado scripts de instalación automática que configuran todo por ti en un solo comando:

#### 📋 Instrucciones Paso a Paso

**PASO 1: Preparar el entorno**
1. Asegúrate de tener **Node.js** instalado (descargar desde [nodejs.org](https://nodejs.org/))
2. Asegúrate de tener **MySQL** instalado y ejecutándose
3. Abre una terminal en la carpeta del proyecto

**PASO 2: Ejecutar el script de instalación**

**Para Windows (PowerShell - RECOMENDADO):**
```powershell
# Abrir PowerShell como administrador (opcional pero recomendado)
# Navegar a la carpeta del proyecto
cd ruta\al\proyecto\gestion

# Ejecutar el script de instalación
.\install.ps1
```

**Para Windows (Command Prompt):**
```cmd
# Abrir Command Prompt
# Navegar a la carpeta del proyecto
cd ruta\al\proyecto\gestion

# Ejecutar el script de instalación
install.bat
```

**Para Linux/macOS:**
```bash
# Abrir terminal
# Navegar a la carpeta del proyecto
cd /ruta/al/proyecto/gestion

# Dar permisos de ejecución y ejecutar
chmod +x install.sh
./install.sh
```

**PASO 3: Seguir las instrucciones del script**
- El script te preguntará si MySQL está ejecutándose ✅
- Opcionalmente te preguntará si quieres crear datos de prueba ✅
- Al final te mostrará las credenciales del administrador ✅

**PASO 4: Iniciar el servidor**
```bash
npm start
```

**PASO 5: Acceder a la aplicación**
- Abrir navegador en `http://localhost:3000`
- Usar credenciales: **Usuario:** `admin` **Contraseña:** `admin123`

#### 🔧 Lo que hacen los scripts automáticamente:
- ✅ Verifican prerrequisitos (Node.js, npm, MySQL)
- ✅ Instalan dependencias de Node.js (`npm install`)
- ✅ Crean la base de datos `gestion_proyectos`
- ✅ Configuran todas las tablas necesarias
- ✅ Crean el usuario administrador con credenciales por defecto
- ✅ Opcionalmente crean datos de prueba (jefe de proyecto, trabajador, proyecto con tareas)
- ✅ Verifican que todo esté funcionando correctamente

#### ⚠️ Requisitos Importantes:
1. **MySQL debe estar ejecutándose** antes de ejecutar el script
2. **Node.js v14 o superior** debe estar instalado
3. **Permisos de administrador** pueden ser necesarios en Windows
4. La **base de datos MySQL** debe ser accesible con las credenciales por defecto (usuario: `root`, sin contraseña)

#### 🆘 Si algo sale mal:
- Verifica que MySQL esté ejecutándose: `mysql --version`
- Verifica que Node.js esté instalado: `node --version`
- Revisa las credenciales de MySQL en `src/db/connection.js`
- Ejecuta los scripts manualmente si es necesario (ver sección de Instalación Manual)

### Instalación Manual

Si prefieres instalar manualmente:

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd gestion
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar la base de datos**
   - Crear una base de datos MySQL llamada `gestion_proyectos`
   - Ejecutar los scripts de inicialización:
   ```bash
   node scripts/create_tables.js
   node scripts/create_tareas_table.js
   ```

4. **Crear usuario administrador**
   ```bash
   node scripts/create_admin_user.js
   ```

5. **Iniciar el servidor**
   ```bash
   npm start
   ```

6. **Acceder a la aplicación**
   - Abrir navegador en `http://localhost:3000`
   - Usar las credenciales del administrador: `admin` / `admin123`

## 📁 Estructura del Proyecto

```
gestion/
├── public/                 # Archivos estáticos (HTML, CSS, JS)
│   ├── dashboard_admin.*   # Dashboard del administrador
│   ├── dashboard_trabajador.* # Dashboard del trabajador
│   ├── login.*            # Página de login
│   └── js/                # Scripts JavaScript adicionales
├── src/
│   ├── controllers/       # Controladores de la aplicación
│   ├── db/               # Configuración de base de datos
│   ├── middleware/       # Middleware de autenticación
│   ├── models/           # Scripts SQL
│   └── routes/           # Definición de rutas
├── scripts/              # Scripts de utilidad y configuración
└── package.json
```

## 🔧 Configuración

### Variables de Entorno
El sistema utiliza las siguientes configuraciones por defecto:
- **Puerto**: 3000
- **Base de datos**: localhost:3306
- **Usuario DB**: root
- **Contraseña DB**: (vacía)

Para modificar estas configuraciones, editar `src/db/connection.js`.

## 👥 Gestión de Usuarios

### Crear Usuarios de Prueba

**Jefe de Proyecto:**
```bash
node scripts/create_jefe_proyecto.js
```

**Trabajador:**
```bash
node scripts/create_trabajador_user.js
```

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin** | Gestión completa del sistema |
| **jefe_proyecto** | Gestión de tareas en sus proyectos |
| **trabajador** | Visualización y actualización de sus tareas |

## 📊 Uso del Sistema

### Dashboard de Administrador
- **Gestión de Usuarios**: Crear, editar y eliminar usuarios
- **Gestión de Proyectos**: Crear y administrar proyectos
- **Asignaciones**: Asignar trabajadores a proyectos
- **Vista General**: Estadísticas del sistema

### Dashboard de Jefe de Proyecto
- **Mis Proyectos**: Ver proyectos asignados
- **Gestión de Tareas**: Crear, editar y eliminar tareas
- **Seguimiento**: Monitorear el progreso de las tareas

### Dashboard de Trabajador
- **Mi Proyecto**: Ver información del proyecto asignado
- **Mis Tareas**: Ver y actualizar el estado de tareas asignadas

## 🗄️ Base de Datos

### Tablas Principales
- `usuarios`: Información de usuarios y roles
- `proyectos`: Datos de proyectos
- `asignaciones`: Relación usuarios-proyectos
- `tareas`: Información de tareas y su estado

### Estados de Tareas
- `pendiente`: Tarea creada, sin iniciar
- `en_progreso`: Tarea en desarrollo
- `revisando`: Tarea completada, en revisión
- `completada`: Tarea finalizada y aprobada

## 🔒 Seguridad

- Autenticación basada en sesiones
- Middleware de verificación de roles
- Validación de datos en servidor
- Protección contra acceso no autorizado

## 🛠️ Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm start

# Crear tablas de base de datos
node scripts/create_tables.js

# Crear usuario administrador
node scripts/create_admin_user.js

# Verificar estructura de usuarios
node scripts/check_usuarios_structure.js

# Crear datos de prueba
node scripts/create_proyecto_trabajador.js
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar que MySQL esté ejecutándose
   - Comprobar credenciales en `src/db/connection.js`

2. **Error de autenticación**
   - Limpiar cookies del navegador
   - Verificar que el usuario existe en la base de datos

3. **Tareas no se cargan**
   - Verificar que el usuario esté asignado a un proyecto
   - Comprobar que existan tareas en el proyecto

## 📝 API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Proyectos
- `GET /api/proyectos` - Listar proyectos
- `POST /api/proyectos` - Crear proyecto
- `PUT /api/proyectos/:id` - Actualizar proyecto

### Tareas
- `GET /api/tareas/proyecto/:id` - Tareas de un proyecto
- `GET /api/tareas/:id` - Detalle de tarea
- `POST /api/tareas` - Crear tarea
- `PUT /api/tareas/:id/estado` - Actualizar estado
- `PUT /api/tareas/:id` - Editar tarea
- `DELETE /api/tareas/:id` - Eliminar tarea

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para la nueva funcionalidad
3. Realizar los cambios necesarios
4. Enviar un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, crear un issue en el repositorio del proyecto.

--- Caca
=======
# gestion-proyecto b8178bd7e5b303ae6482224180f9e06595a7b5e0
