# MicroLoan Bot - PRD (Product Requirements Document)

## Original Problem Statement
Создать Telegram бота для микрозаймов с админ-панелью с функционалом:
- Каталог МФО
- Калькулятор займов  
- Подача заявки на займ
- Сравнение предложений
- Админ-панель: управление МФО, статистика, контент, аналитика

## User Personas
1. **Пользователь бота** - ищет микрозаймы, сравнивает условия, подает заявки
2. **Администратор** - управляет каталогом МФО, обрабатывает заявки, анализирует статистику

## Core Requirements
- Telegram Bot с inline-клавиатурами
- REST API для админ-панели
- JWT авторизация
- MongoDB для хранения данных
- React админ-панель

## What's Been Implemented (January 14, 2025)

### Backend (FastAPI)
- ✅ JWT авторизация (регистрация/вход)
- ✅ CRUD для МФО (создание, редактирование, удаление)
- ✅ Управление заявками (просмотр, изменение статуса)
- ✅ Статистика и аналитика
- ✅ Управление контентом бота
- ✅ Трекинг кликов по МФО

### Telegram Bot
- ✅ Команда /start с приветствием
- ✅ Каталог МФО с inline-клавиатурами
- ✅ Калькулятор займа (сумма, срок, расчет)
- ✅ Подача заявки на займ
- ✅ Сравнение предложений по ставке
- ✅ Отслеживание пользователей и активности

### Frontend (React)
- ✅ Login/Register страница
- ✅ Dashboard с метриками и графиками
- ✅ Управление МФО (CRUD)
- ✅ Список заявок с фильтрацией
- ✅ Аналитика (графики Recharts)
- ✅ Список пользователей
- ✅ Управление контентом
- ✅ Страница настроек

## Tech Stack
- Backend: FastAPI + python-telegram-bot
- Frontend: React + Tailwind + Shadcn/UI + Recharts
- Database: MongoDB
- Auth: JWT

## Prioritized Backlog

### P0 (Critical)
- ✅ Все основные функции реализованы

### P1 (High Priority)
- [ ] Webhook режим для бота (вместо polling)
- [ ] Push-уведомления админу о новых заявках
- [ ] Экспорт статистики в Excel

### P2 (Medium Priority)  
- [ ] Партнерские ссылки с UTM-метками
- [ ] Рассылка сообщений пользователям
- [ ] A/B тестирование текстов бота

## Files Structure
```
/app/backend/
├── server.py          # FastAPI API
├── telegram_bot.py    # Telegram Bot
└── .env              # Environment vars

/app/frontend/src/
├── App.js            # Routes
├── context/          # Auth context
├── components/       # Layout, UI
└── pages/            # All pages
```

## Bot Token
7806638733:AAFJcKj0-d8efDlOmN5EXMc7BnuwN1BWANM
Bot Username: @zaimbadkibot
