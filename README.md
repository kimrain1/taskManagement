# TaskFlow Pro - Task Management Application

App is live right now on https://taskmanagement-7lsd.onrender.com

A premium task management application with user authentication built with Node.js, Express, and SQLite.

## Project Structure

```
├── public/                 # Frontend static files
│   ├── index.html         # Main application page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── css/
│   │   └── styles.css     # Application styles
│   └── js/
│       ├── app.js         # Main application logic
│       └── auth.js        # Authentication module
├── src/                    # Backend source code
│   ├── server.js          # Express API server
│   ├── config/
│   │   └── drizzle.config.js  # Database configuration
│   └── db/
│       ├── index.js       # Database connection
│       ├── schema.js      # Drizzle ORM schema
│       └── clientRepository.js  # User data operations
├── data/                   # Database files
│   └── data.db            # SQLite database
├── package.json           # Project dependencies
└── README.md              # This file
```

## Getting Started

### Install Dependencies
```bash
npm install
```

### Start the Server
```bash
npm start
```

The server will run on http://localhost:3000

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes directly to database
- `npm run db:studio` - Open Drizzle Studio GUI

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| DELETE | /api/auth/account | Delete account |

## Utility Commands

```bash
# Kill process on port 3000
lsof -i :3000 -t | xargs kill -9

# Kill any serve process
pkill -f "serve"
```

## Technologies

- **Backend**: Express.js, Node.js
- **Database**: SQLite with Drizzle ORM
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Session-based with localStorage
