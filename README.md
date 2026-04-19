# 🐾 Adoptly — Backend

The backend API for the Adoptly pet adoption platform. Built with Node.js, Express, and MongoDB.

📖 **[View API Documentation](./README.API.md)**

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB Atlas + Mongoose
- JWT (Bearer tokens)
- Nodemailer

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- A MongoDB Atlas cluster (or local MongoDB)
- An SMTP email account (e.g. Gmail App Password)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in this directory:

```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 3. Run the app

```bash
npm run dev
```

The API will run at **http://localhost:5001**.

## 🌍 Deployment

### Render

1. Push your `backend/` folder to a GitHub repository.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add all variables from `backend/.env` under **Environment → Environment Variables**.
