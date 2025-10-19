# Project Context: Animated Wallpaper Web App (Vue3 + Supabase)

## 🎯 Overview
This project aims to build an **online dynamic wallpaper platform** where users can:
- View and enjoy **animated wallpapers** (videos, particle effects, or WebGL loops).
- Listen to **music with player controls** (play, pause, restart, volume).
- Upload and share wallpapers to a **public library**.
- Chat with others in a **global real-time chat channel**.
- Optionally, install and run the app as a **live desktop wallpaper**.

---

## 🧩 Core Features

### 1. Animated Wallpapers
- Default animated background (video, CSS animation, or canvas).
- User can choose from gallery or upload their own.
- Uploaded wallpapers stored in Supabase Storage.

### 2. Music Player
- Supports play/pause/restart and volume control.
- Can switch between different background music options.
- Uses HTML5 Audio API integrated with Vue components.

### 3. Wallpaper Gallery
- Public gallery of uploaded wallpapers.
- Preview wallpapers before setting as active background.
- Metadata stored in Supabase Database (title, uploader, tags).

### 4. Upload System
- Users upload wallpapers (GIF, video, or WebP).
- Files go to Supabase Storage (public bucket).
- Metadata stored in Supabase DB with uploader ID and timestamp.

### 5. Global Chat
- Realtime chat for all users connected to the site.
- Powered by Supabase Realtime channels.
- Shows username, avatar, and message timestamp.

### 6. User Authentication
- Login via Supabase Auth (email/password or guest login).
- Optional OAuth integration for GitHub, Google, etc.
- User data saved in `users` table.

### 7. User Preferences
- Each user can save wallpaper/music preferences.
- Volume level, selected wallpaper, and music track are stored.

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | **Vue3 + Pinia** | UI, state management |
| UI Framework | **TailwindCSS / SCSS** | Styling and layout |
| Backend | **Supabase** | DB, Auth, Storage, Realtime |
| Auth | **Supabase Auth** | User login/session |
| Storage | **Supabase Storage** | Wallpaper & music files |
| Realtime | **Supabase Realtime** | Global chat, sync updates |
| Deployment | **Vercel / Netlify** | Hosting |
| Optional Desktop | **Electron** | Run as live wallpaper app |
| Optional Export | **Wallpaper Engine HTML Export** | External wallpaper support |

---

## 🧱 Database Schema (Supabase)

### Table: `users`
| Field | Type | Notes |
|--------|------|--------|
| id | uuid | Primary key |
| username | text | Display name |
| email | text | Optional |
| avatar_url | text | Profile image |

### Table: `wallpapers`
| Field | Type | Notes |
|--------|------|--------|
| id | uuid | Primary key |
| title | text | Wallpaper name |
| file_url | text | Supabase Storage URL |
| uploader_id | uuid | FK → users.id |
| tags | text[] | Search tags |
| created_at | timestamp | Upload time |

### Table: `chats`
| Field | Type | Notes |
|--------|------|--------|
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| message | text | Chat message |
| created_at | timestamp | Message timestamp |

### Table: `user_preferences`
| Field | Type | Notes |
|--------|------|--------|
| user_id | uuid | FK → users.id |
| wallpaper_id | uuid | Selected wallpaper |
| music_url | text | Chosen background music |
| volume | float | Default volume level |

---

## 🧠 Architecture Flow

```
User → Vue3 App (Frontend)
       ├── Animated Wallpapers
       ├── Music Player
       ├── Global Chat
            ↓
          Supabase
           ├── Database
           ├── Storage
           └── Realtime Channel
```

---

## 💻 Desktop Integration (Electron)

To allow using the app as a **live wallpaper**:
1. Wrap the Vue3 app inside an **Electron shell**.
2. Use a fullscreen, borderless, transparent **BrowserWindow**.
3. On Windows, use PowerShell/WinAPI to set the window behind desktop icons.
4. Optionally, build `.exe` or `.app` using **electron-builder**.

**Command Example:**
```js
const { app, BrowserWindow } = require('electron')
function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    webPreferences: { contextIsolation: true }
  })
  win.loadURL('https://your-supabase-wallpaper.web.app')
}
app.whenReady().then(createWindow)
```

---

## 🚀 Future Extensions

- Private chat rooms or friend lists.
- AI wallpaper generator (text → video/loop).
- Export wallpaper packs (music + theme + effect).
- PWA support for mobile experience.
- Cross-platform desktop wallpaper launcher.

---

## 🧭 Goal for GitHub Copilot
This `context.md` provides Copilot with a complete understanding of:
- Project purpose and features.
- Tech stack and architecture.
- Database schema.
- Integration plan for Electron or web deployment.
So that Copilot can auto-complete and generate relevant Vue3 + Supabase + Electron code.