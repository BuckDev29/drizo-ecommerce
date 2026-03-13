# Drizo Ecommerce

Ecommerce full-stack de moda construido con Next.js, Node.js, Express y MySQL.

Proyecto orientado a portafolio profesional: autenticacion con JWT, carrito, wishlist, checkout, perfil de usuario y panel administrativo.

## Caracteristicas

- Registro e inicio de sesion con JWT
- Catalogo de productos y vista detalle
- Filtro por categorias
- Carrito de compras
- Wishlist
- Direcciones y perfil de usuario
- Flujo de checkout y ordenes
- Dashboard de administracion

## Arquitectura

```text
drizo-ecommerce/
├── backend/            # API REST (Express + MySQL)
├── frontend-next/      # Web app (Next.js)
├── database/           # SQL para levantar features y parches
├── .gitignore
└── README.md
```

## Stack Tecnologico

### Frontend

- Next.js 16
- React 19
- TypeScript

### Backend

- Node.js
- Express
- MySQL2
- jsonwebtoken
- bcryptjs

## Variables de Entorno

Este repositorio no incluye secretos reales.

### Backend

Crea `backend/.env` a partir de `backend/.env.example`.

```env
PORT=5000
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES=1h
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=drizo_ecommerce
```

### Frontend

Crea `frontend-next/.env.local` a partir de `frontend-next/.env.example`.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Instalacion Local

### 1. Clonar el proyecto

```bash
git clone https://github.com/TUUSUARIO/drizo-ecommerce.git
cd drizo-ecommerce
```

### 2. Instalar dependencias

```bash
cd backend
npm install

cd ../frontend-next
npm install
```

### 3. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend-next/.env.example frontend-next/.env.local
```

Completa tus credenciales locales de MySQL y tu JWT secret.

### 4. Levantar backend

```bash
cd backend
npm run dev
```

Backend disponible en `http://localhost:5000`.

### 5. Levantar frontend

```bash
cd frontend-next
npm run dev
```

Frontend disponible en `http://localhost:3000`.

## Base de Datos

Scripts disponibles en `database/`:

- `feature_setup.sql`
- `user_preference_patch.sql`

Recomendado para dejar el repositorio totalmente reproducible:

- agregar `database/schema.sql` con tablas base (`users`, `products`, `categories`, `orders`, etc.)

## Endpoints Base

Prefijo general del backend: `/api`

- `/api/auth`
- `/api/user`
- `/api/products`
- `/api/categories`
- `/api/cart`
- `/api/wishlist`
- `/api/orders`
- `/api/admin`

## Scripts

### Backend

- `npm run dev` inicia API con nodemon
- `npm start` inicia API en modo normal

### Frontend

- `npm run dev` inicia Next.js en desarrollo
- `npm run build` compila para produccion
- `npm run start` sirve build de produccion
- `npm run lint` ejecuta ESLint
