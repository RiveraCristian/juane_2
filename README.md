# Sistema de Reportería SEREMIS Maule

Aplicación web para la gestión y reportería de las Secretarías Regionales Ministeriales (SEREMIS) de la Región del Maule.

## Requisitos previos

- **Node.js** v18 o superior — [https://nodejs.org](https://nodejs.org)
- **npm** (incluido con Node.js)

> La base de datos SQLite se crea automáticamente al iniciar el servidor por primera vez. No se requiere instalar ningún motor de base de datos externo.

## Instalación en el servidor

### 1. Clonar el repositorio

```bash
git clone https://github.com/vlorcap1/juane_2.git
cd juane_2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor

```bash
npm start
```

El servidor se iniciará en `http://localhost:3000` por defecto.

### 4. Configurar el puerto (opcional)

Puedes cambiar el puerto mediante la variable de entorno `PORT`:

```bash
PORT=8080 npm start
```

## Ejecución en segundo plano (producción)

Para mantener el servidor ejecutándose de forma persistente en el servidor se recomienda usar un gestor de procesos como **pm2**:

```bash
# Instalar pm2 de forma global
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name seremis-maule

# Guardar la lista de procesos para que se reinicien tras un reboot
pm2 save
pm2 startup
```

Comandos útiles de pm2:

```bash
pm2 status          # Ver estado de los procesos
pm2 logs seremis-maule  # Ver logs en tiempo real
pm2 restart seremis-maule  # Reiniciar la aplicación
pm2 stop seremis-maule     # Detener la aplicación
```

## Estructura del proyecto

```
juane_2/
├── server.js        # Servidor Express y rutas de la API
├── database.js      # Inicialización de la base de datos SQLite y datos semilla
├── package.json     # Dependencias y scripts del proyecto
├── index.html       # Página principal (raíz)
└── public/
    └── index.html   # Interfaz de usuario (servida como archivo estático)
```

## Tecnologías utilizadas

| Componente      | Tecnología              |
| --------------- | ----------------------- |
| Servidor        | Node.js + Express 4     |
| Base de datos   | SQLite (better-sqlite3) |
| Frontend        | HTML / CSS / JavaScript |

## Endpoints principales de la API

| Método | Ruta                         | Descripción                       |
| ------ | ---------------------------- | --------------------------------- |
| POST   | `/api/login`                 | Autenticación de usuario          |
| GET    | `/api/seremis`               | Listar todas las SEREMIS          |
| GET    | `/api/seremis/:id`           | Detalle de una SEREMI             |
| POST   | `/api/visitas`               | Registrar visita                  |
| POST   | `/api/contactos`             | Registrar contacto                |
| POST   | `/api/prensa`                | Registrar nota de prensa          |
| POST   | `/api/proyectos`             | Registrar proyecto                |
| POST   | `/api/nudos`                 | Registrar nudo crítico            |
| POST   | `/api/temas`                 | Registrar tema clave              |
| POST   | `/api/agenda`                | Registrar evento de agenda        |
| GET    | `/api/contrataciones`        | Listar contrataciones             |
| POST   | `/api/contrataciones`        | Crear contratación                |
| PUT    | `/api/contrataciones/:id/vb` | Aprobar contratación (visto bueno)|
| GET    | `/api/users`                 | Listar usuarios                   |
| POST   | `/api/users`                 | Crear usuario                     |
| PUT    | `/api/users/:id`             | Actualizar usuario                |
| DELETE | `/api/users/:id`             | Eliminar usuario                  |
