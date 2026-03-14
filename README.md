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
├── frontend/           # Web app (Next.js)
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

Crea `frontend/.env.local` a partir de `frontend/.env.example`.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

En produccion (Vercel) usa:

```env
NEXT_PUBLIC_API_URL=https://drizo-ecommerce-production.up.railway.app/api
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

cd ../frontend
npm install
```

### 3. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
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
cd frontend
npm run dev
```

Frontend disponible en `http://localhost:3000`.

## Base de Datos

Scripts disponibles en `backend/src/database/sql/`:

- `feature_setup.sql`
- `user_preference_patch.sql`

Recomendado para dejar el repositorio totalmente reproducible:

- agregar `backend/src/database/init.sql` con tablas base (`users`, `products`, `categories`, `orders`, etc.)

## Deploy (Vercel + Railway)

Arquitectura de produccion actual:

- Frontend: Vercel
- Backend API: Railway
- MySQL: Railway

Pasos minimos:

1. Desplegar `backend` en Railway.
2. Configurar variables del backend en Railway (`DB_*`, `JWT_*`, `PORT`).
3. Desplegar `frontend` en Vercel.
4. Configurar en Vercel `NEXT_PUBLIC_API_URL=https://drizo-ecommerce-production.up.railway.app/api`.
5. Redeploy del frontend tras cambiar variables.

## API Endpoints (Completo)

Base URL: `https://drizo-ecommerce-production.up.railway.app`

### Publicos

| Metodo | Endpoint              | Auth | Descripcion                                                                |
| ------ | --------------------- | ---- | -------------------------------------------------------------------------- |
| GET    | `/`                   | No   | Mensaje de estado del API                                                  |
| GET    | `/health`             | No   | Healthcheck del servicio                                                   |
| POST   | `/api/auth/register`  | No   | Registro de usuario                                                        |
| POST   | `/api/auth/login`     | No   | Login y emision de JWT                                                     |
| GET    | `/api/products`       | No   | Lista de productos (filtros: `category`, `gender`, `minPrice`, `maxPrice`) |
| GET    | `/api/products/:id`   | No   | Detalle de producto                                                        |
| GET    | `/api/categories`     | No   | Lista de categorias (filtro opcional `gender`)                             |
| GET    | `/api/categories/:id` | No   | Detalle de categoria                                                       |

### Usuario autenticado

| Metodo | Endpoint                    | Auth | Descripcion                                                            |
| ------ | --------------------------- | ---- | ---------------------------------------------------------------------- |
| GET    | `/api/user/profile`         | JWT  | Obtener perfil del usuario                                             |
| PUT    | `/api/user/profile`         | JWT  | Actualizar perfil (`name`, `email`, `password`, `shopping_preference`) |
| GET    | `/api/addresses`            | JWT  | Listar direcciones del usuario                                         |
| POST   | `/api/addresses`            | JWT  | Crear direccion                                                        |
| PUT    | `/api/addresses/:id`        | JWT  | Actualizar direccion                                                   |
| DELETE | `/api/addresses/:id`        | JWT  | Eliminar direccion                                                     |
| GET    | `/api/cart`                 | JWT  | Obtener carrito                                                        |
| POST   | `/api/cart`                 | JWT  | Agregar producto al carrito                                            |
| PUT    | `/api/cart/:id`             | JWT  | Actualizar cantidad de item del carrito                                |
| DELETE | `/api/cart/:id`             | JWT  | Eliminar item del carrito                                              |
| GET    | `/api/wishlist`             | JWT  | Obtener wishlist                                                       |
| GET    | `/api/wishlist/check`       | JWT  | Obtener IDs en wishlist                                                |
| POST   | `/api/wishlist`             | JWT  | Agregar producto a wishlist                                            |
| DELETE | `/api/wishlist/:product_id` | JWT  | Eliminar producto de wishlist                                          |
| POST   | `/api/orders`               | JWT  | Crear orden desde carrito (checkout)                                   |
| GET    | `/api/orders`               | JWT  | Listar ordenes del usuario                                             |
| GET    | `/api/orders/:id`           | JWT  | Detalle de orden del usuario                                           |
| PUT    | `/api/orders/:id/cancel`    | JWT  | Cancelar orden en estado pendiente                                     |

### Admin autenticado

Requiere JWT + rol `admin`.

| Metodo | Endpoint                       | Auth  | Descripcion                     |
| ------ | ------------------------------ | ----- | ------------------------------- |
| GET    | `/api/admin/stats`             | Admin | Estadisticas de dashboard       |
| GET    | `/api/admin/users`             | Admin | Listado de usuarios             |
| GET    | `/api/admin/users/:id`         | Admin | Detalle de usuario              |
| PUT    | `/api/admin/users/:id`         | Admin | Actualizar usuario              |
| DELETE | `/api/admin/users/:id`         | Admin | Eliminar usuario                |
| GET    | `/api/admin/orders`            | Admin | Listado de ordenes              |
| GET    | `/api/admin/orders/:id`        | Admin | Detalle de orden                |
| PUT    | `/api/admin/orders/:id/status` | Admin | Actualizar estado de orden/pago |
| POST   | `/api/products`                | Admin | Crear producto                  |
| PUT    | `/api/products/:id`            | Admin | Actualizar producto             |
| DELETE | `/api/products/:id`            | Admin | Eliminar producto               |
| POST   | `/api/categories`              | Admin | Crear categoria                 |
| PUT    | `/api/categories/:id`          | Admin | Actualizar categoria            |
| DELETE | `/api/categories/:id`          | Admin | Eliminar categoria              |

## Scripts

### Backend

- `npm run dev` inicia API con nodemon
- `npm start` inicia API en modo normal

### Frontend

- `npm run dev` inicia Next.js en desarrollo
- `npm run build` compila para produccion
- `npm run start` sirve build de produccion
- `npm run lint` ejecuta ESLint
