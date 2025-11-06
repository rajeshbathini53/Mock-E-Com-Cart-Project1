 🛍️ Mock E-Commerce Cart (MERN Stack)

*A full-stack MERN application with shopping cart functionality, built for demonstration and learning.*

#Project Overview  

This project emulates an online shopping cart system using the MERN (MongoDB, Express, React, Node.js) stack. It’s designed to replicate real-world e-commerce functionalities such as browsing products, cart operations, and checkout workflows in a modular, maintainable architecture.

## 🧱 Objectives

- To design a **scalable and modular** e-commerce architecture.  
- To implement **JWT-based authentication** and route protection.  
- To develop **RESTful APIs** for seamless frontend-backend communication.  
- To explore **React state management** with Context API or Redux.  
- To practice **secure backend development** using Express and MongoDB.  

## ✨ Core Features

### 👤 User Management
- Register, login, and logout with JWT authentication.
- Encrypted passwords using bcrypt.
- Profile management with persistent login sessions.

### 🛍️ Product Management
- Browse, search, and filter products by category or price.
- Dynamic product cards with responsive design.
- Product details page with description and price.

### 🛒 Shopping Cart
- Add/remove/update products in the cart.
- Save cart state across sessions.
- Real-time subtotal and total calculation.

### 💳 Order & Checkout
- Simulated checkout and order confirmation.
- Display of order summary and item details.

### ⚙️ Admin Panel *(optional enhancement)*
- Add, update, or delete products.
- Manage user orders.
- Dashboard overview of sales & users.


## 🧑‍💻 Tech Stack 
| Layer        | Technologies                                        |

| Frontend     | React.js, React Router, Context API / Redux, Axios, TailwindCSS |
| Backend      | Node.js, Express.js, REST API                       |
| Database     | MongoDB + Mongoose ORM                              |
| Dev & Tools  | VS Code, Postman, Git & GitHub, ESLint/Prettier    |


## 📂 Project Structure  

mock-ecom-cart-task/
├── frontend/             # React application  
│   ├── public/  
│   └── src/               # React components, contexts, hooks  
│       ├── components/  
│       ├── pages/  
│       ├── services/  
│       └── styles/  
├── backend/              # Node/Express REST API  
│   ├── controllers/  
│   ├── models/  
│   ├── routes/  
│   ├── middlewares/  
│   └── server.js  
├── .gitignore  
└── README.md

🛠️ Installation & Setup

1. Clone the repository
git clone https://github.com/rajeshbathini53/Mock-E-Com-Cart-Project.git
cd Mock-E-Com-Cart-Project

2. Setup Backend
cd backend
npm install
cp .env.example .env       # fill in actual values
npm run dev                # or `node server.js`

3. Setup Frontend
cd ../frontend
npm install
npm start                  # Runs React app at http://localhost:3000

4. Default URLs

Frontend: http://localhost:3000

Backend API: http://localhost:5000/api
