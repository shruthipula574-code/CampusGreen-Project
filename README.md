# 🌱 CampusGreen – Campus Sustainability Ideas Board

CampusGreen is a web-based platform that empowers students to share, discuss, and vote on eco-friendly ideas to make their campus greener and more sustainable.

## ✨ Features

- **User Authentication:** Register and log in securely.
- **Share Ideas:** Submit ideas for improving campus sustainability.
- **Vote on Ideas:** Support ideas you think will make a difference.
- **Comments and Discussion:** Share feedback and discuss submitted ideas.
- **Categories and Status:** Organize ideas and track their progress.
- **Admin Management:** Allow administrators to manage ideas and update their status.
- **Database Integration:** Store application data using Supabase.

## 🛠️ Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **Version Control:** Git and GitHub

## 📁 Project Structure

```text
CampusGreen/
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── database/
│   └── schema.sql
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm installed
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/shruthipula574-code/CampusGreen-Project.git
cd CampusGreen-Project
```

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` folder using `.env.example` as a reference.

Add your own configuration values:

```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_long_random_secret
```

**Important:** Use your own secret values. Never commit your `.env` file or expose your Supabase service-role key in frontend code or on GitHub.

### 4. Set up the database

Run the SQL statements in `database/schema.sql` in your Supabase SQL Editor.

### 5. Start the server

From the `backend` directory, run:

```bash
npm start
```

Open the local URL shown in your terminal, usually `http://localhost:3000`.

## 🌍 Project Goal

CampusGreen encourages students to work together, share practical environmental solutions, and build a more sustainable campus community.

## 🤝 Contributing

Suggestions and improvements are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

No license has been specified yet.
