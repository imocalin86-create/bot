import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Telegram Bot
TELEGRAM_TOKEN = os.environ.get('TELEGRAM_TOKEN')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== HELPERS ====================

async def save_user(user):
    """Save or update user in database"""
    existing = await db.bot_users.find_one({"telegram_id": user.id})
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.bot_users.update_one(
            {"telegram_id": user.id},
            {"$set": {"last_activity": now, "username": user.username or "", "first_name": user.first_name or "", "last_name": user.last_name or ""}}
        )
    else:
        user_doc = {
            "id": str(uuid.uuid4()),
            "telegram_id": user.id,
            "username": user.username or "",
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "created_at": now,
            "last_activity": now
        }
        await db.bot_users.insert_one(user_doc)

async def get_content(key: str, default: str = "") -> str:
    """Get content from database"""
    content = await db.content.find_one({"key": key}, {"_id": 0})
    return content["value"] if content else default

# ==================== BOT HANDLERS ====================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    await save_user(user)
    
    welcome_text = await get_content("welcome_message", 
        f"👋 Привет, {user.first_name}!\n\n"
        "Я помогу вам найти лучшие предложения по микрозаймам.\n\n"
        "Выберите действие:"
    )
    
    keyboard = [
        [InlineKeyboardButton("📋 Каталог МФО", callback_data="catalog")],
        [InlineKeyboardButton("🔢 Калькулятор займа", callback_data="calculator")],
        [InlineKeyboardButton("📝 Подать заявку", callback_data="apply")],
        [InlineKeyboardButton("📊 Сравнить предложения", callback_data="compare")],
        [InlineKeyboardButton("ℹ️ О сервисе", callback_data="about")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(welcome_text, reply_markup=reply_markup)

async def catalog_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show MFO catalog"""
    query = update.callback_query
    await query.answer()
    
    mfos = await db.mfos.find({"is_active": True}, {"_id": 0}).to_list(20)
    
    if not mfos:
        await query.edit_message_text(
            "😔 В данный момент нет доступных МФО.\n\nПопробуйте позже.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="back_main")]])
        )
        return
    
    text = "📋 *Каталог МФО*\n\nВыберите организацию для подробной информации:\n"
    keyboard = []
    
    for mfo in mfos:
        keyboard.append([InlineKeyboardButton(f"🏦 {mfo['name']} ({mfo['interest_rate']}%)", callback_data=f"mfo_{mfo['id']}")])
    
    keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="back_main")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def mfo_detail_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show MFO details"""
    query = update.callback_query
    await query.answer()
    
    mfo_id = query.data.replace("mfo_", "")
    mfo = await db.mfos.find_one({"id": mfo_id}, {"_id": 0})
    
    if not mfo:
        await query.edit_message_text("МФО не найдено", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="catalog")]]))
        return
    
    # Track click
    user = update.effective_user
    click_doc = {
        "id": str(uuid.uuid4()),
        "mfo_id": mfo_id,
        "telegram_id": user.id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clicks.insert_one(click_doc)
    await db.mfos.update_one({"id": mfo_id}, {"$inc": {"clicks": 1}})
    
    text = f"""🏦 *{mfo['name']}*

📝 {mfo['description']}

💰 *Сумма:* {mfo['min_amount']:,} - {mfo['max_amount']:,} ₽
📅 *Срок:* {mfo['min_term']} - {mfo['max_term']} дней
📈 *Ставка:* {mfo['interest_rate']}% в день
✅ *Одобрение:* {mfo['approval_rate']}%

🔗 {mfo['website_url']}"""
    
    keyboard = [
        [InlineKeyboardButton("📝 Подать заявку", callback_data=f"apply_{mfo_id}")],
        [InlineKeyboardButton("🔙 К каталогу", callback_data="catalog")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def calculator_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show loan calculator"""
    query = update.callback_query
    await query.answer()
    
    context.user_data["calc_step"] = "amount"
    
    text = """🔢 *Калькулятор займа*

Введите сумму займа (от 1000 до 100000 ₽):"""
    
    keyboard = [[InlineKeyboardButton("🔙 Назад", callback_data="back_main")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def apply_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start application process"""
    query = update.callback_query
    await query.answer()
    
    mfos = await db.mfos.find({"is_active": True}, {"_id": 0}).to_list(20)
    
    if not mfos:
        await query.edit_message_text(
            "😔 В данный момент нет доступных МФО для подачи заявки.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="back_main")]])
        )
        return
    
    text = "📝 *Подать заявку*\n\nВыберите МФО для подачи заявки:"
    keyboard = []
    
    for mfo in mfos:
        keyboard.append([InlineKeyboardButton(f"🏦 {mfo['name']}", callback_data=f"apply_{mfo['id']}")])
    
    keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="back_main")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def apply_mfo_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start application for specific MFO"""
    query = update.callback_query
    await query.answer()
    
    mfo_id = query.data.replace("apply_", "")
    mfo = await db.mfos.find_one({"id": mfo_id}, {"_id": 0})
    
    if not mfo:
        await query.edit_message_text("МФО не найдено", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="apply")]]))
        return
    
    context.user_data["apply_mfo_id"] = mfo_id
    context.user_data["apply_mfo_name"] = mfo["name"]
    context.user_data["apply_step"] = "amount"
    
    text = f"""📝 *Заявка в {mfo['name']}*

Введите желаемую сумму займа ({mfo['min_amount']:,} - {mfo['max_amount']:,} ₽):"""
    
    keyboard = [[InlineKeyboardButton("❌ Отмена", callback_data="apply")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def compare_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Compare MFO offers"""
    query = update.callback_query
    await query.answer()
    
    mfos = await db.mfos.find({"is_active": True}, {"_id": 0}).sort("interest_rate", 1).to_list(10)
    
    if not mfos:
        await query.edit_message_text(
            "😔 Нет МФО для сравнения.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="back_main")]])
        )
        return
    
    text = "📊 *Сравнение предложений*\n\n"
    text += "Отсортировано по процентной ставке:\n\n"
    
    for i, mfo in enumerate(mfos, 1):
        text += f"*{i}. {mfo['name']}*\n"
        text += f"   💰 {mfo['min_amount']:,}-{mfo['max_amount']:,} ₽\n"
        text += f"   📈 {mfo['interest_rate']}% | ✅ {mfo['approval_rate']}%\n\n"
    
    keyboard = [
        [InlineKeyboardButton("📋 Подробнее в каталоге", callback_data="catalog")],
        [InlineKeyboardButton("🔙 Назад", callback_data="back_main")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def about_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show about info"""
    query = update.callback_query
    await query.answer()
    
    about_text = await get_content("about_message",
        "ℹ️ *О сервисе*\n\n"
        "Мы помогаем найти лучшие предложения по микрозаймам.\n\n"
        "✅ Актуальная информация о МФО\n"
        "✅ Удобный калькулятор\n"
        "✅ Быстрое оформление заявки\n"
        "✅ Сравнение условий\n\n"
        "Сервис бесплатный для пользователей."
    )
    
    keyboard = [[InlineKeyboardButton("🔙 Назад", callback_data="back_main")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(about_text, reply_markup=reply_markup, parse_mode="Markdown")

async def back_main_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Return to main menu"""
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    context.user_data.clear()
    
    welcome_text = f"👋 {user.first_name}, выберите действие:"
    
    keyboard = [
        [InlineKeyboardButton("📋 Каталог МФО", callback_data="catalog")],
        [InlineKeyboardButton("🔢 Калькулятор займа", callback_data="calculator")],
        [InlineKeyboardButton("📝 Подать заявку", callback_data="apply")],
        [InlineKeyboardButton("📊 Сравнить предложения", callback_data="compare")],
        [InlineKeyboardButton("ℹ️ О сервисе", callback_data="about")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(welcome_text, reply_markup=reply_markup)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages for calculator and application"""
    user = update.effective_user
    text = update.message.text
    await save_user(user)
    
    # Calculator flow
    if context.user_data.get("calc_step") == "amount":
        try:
            amount = int(text.replace(" ", "").replace(",", ""))
            if amount < 1000 or amount > 100000:
                await update.message.reply_text("❌ Введите сумму от 1000 до 100000 ₽")
                return
            
            context.user_data["calc_amount"] = amount
            context.user_data["calc_step"] = "term"
            
            await update.message.reply_text(
                f"💰 Сумма: {amount:,} ₽\n\nТеперь введите срок займа (от 1 до 30 дней):",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="back_main")]])
            )
        except ValueError:
            await update.message.reply_text("❌ Введите корректную сумму числом")
        return
    
    if context.user_data.get("calc_step") == "term":
        try:
            term = int(text)
            if term < 1 or term > 30:
                await update.message.reply_text("❌ Введите срок от 1 до 30 дней")
                return
            
            amount = context.user_data["calc_amount"]
            
            # Get best rates from MFOs
            mfos = await db.mfos.find({"is_active": True}, {"_id": 0}).to_list(5)
            
            result_text = f"📊 *Результаты расчета*\n\n💰 Сумма: {amount:,} ₽\n📅 Срок: {term} дней\n\n"
            
            if mfos:
                result_text += "*Предложения МФО:*\n\n"
                for mfo in mfos:
                    interest = amount * (mfo['interest_rate'] / 100) * term
                    total = amount + interest
                    result_text += f"🏦 *{mfo['name']}*\n"
                    result_text += f"   Переплата: {interest:,.0f} ₽\n"
                    result_text += f"   Вернуть: {total:,.0f} ₽\n\n"
            
            context.user_data.clear()
            
            keyboard = [
                [InlineKeyboardButton("📝 Подать заявку", callback_data="apply")],
                [InlineKeyboardButton("🔄 Новый расчет", callback_data="calculator")],
                [InlineKeyboardButton("🔙 Главное меню", callback_data="back_main")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(result_text, reply_markup=reply_markup, parse_mode="Markdown")
        except ValueError:
            await update.message.reply_text("❌ Введите корректный срок числом")
        return
    
    # Application flow
    if context.user_data.get("apply_step") == "amount":
        try:
            amount = int(text.replace(" ", "").replace(",", ""))
            context.user_data["apply_amount"] = amount
            context.user_data["apply_step"] = "term"
            
            await update.message.reply_text(
                f"💰 Сумма: {amount:,} ₽\n\nВведите желаемый срок займа (дней):",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ Отмена", callback_data="apply")]])
            )
        except ValueError:
            await update.message.reply_text("❌ Введите корректную сумму")
        return
    
    if context.user_data.get("apply_step") == "term":
        try:
            term = int(text)
            context.user_data["apply_term"] = term
            context.user_data["apply_step"] = "phone"
            
            await update.message.reply_text(
                "📱 Введите ваш номер телефона для связи:",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ Отмена", callback_data="apply")]])
            )
        except ValueError:
            await update.message.reply_text("❌ Введите корректный срок")
        return
    
    if context.user_data.get("apply_step") == "phone":
        phone = text.strip()
        
        # Create application
        app_doc = {
            "id": str(uuid.uuid4()),
            "mfo_id": context.user_data["apply_mfo_id"],
            "mfo_name": context.user_data["apply_mfo_name"],
            "user_telegram_id": user.id,
            "user_name": f"{user.first_name} {user.last_name or ''}".strip(),
            "amount": context.user_data["apply_amount"],
            "term": context.user_data["apply_term"],
            "phone": phone,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.applications.insert_one(app_doc)
        
        context.user_data.clear()
        
        success_text = f"""✅ *Заявка успешно отправлена!*

🏦 МФО: {app_doc['mfo_name']}
💰 Сумма: {app_doc['amount']:,} ₽
📅 Срок: {app_doc['term']} дней
📱 Телефон: {phone}

С вами свяжутся в ближайшее время."""
        
        keyboard = [[InlineKeyboardButton("🔙 Главное меню", callback_data="back_main")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(success_text, reply_markup=reply_markup, parse_mode="Markdown")
        return
    
    # Default - show menu
    keyboard = [
        [InlineKeyboardButton("📋 Каталог МФО", callback_data="catalog")],
        [InlineKeyboardButton("🔢 Калькулятор займа", callback_data="calculator")],
        [InlineKeyboardButton("📝 Подать заявку", callback_data="apply")],
        [InlineKeyboardButton("📊 Сравнить предложения", callback_data="compare")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Используйте кнопки для навигации или команду /start",
        reply_markup=reply_markup
    )

def main():
    """Start the bot"""
    if not TELEGRAM_TOKEN:
        logger.error("TELEGRAM_TOKEN not set")
        return
    
    application = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # Commands
    application.add_handler(CommandHandler("start", start_command))
    
    # Callbacks
    application.add_handler(CallbackQueryHandler(catalog_callback, pattern="^catalog$"))
    application.add_handler(CallbackQueryHandler(mfo_detail_callback, pattern="^mfo_"))
    application.add_handler(CallbackQueryHandler(calculator_callback, pattern="^calculator$"))
    application.add_handler(CallbackQueryHandler(apply_callback, pattern="^apply$"))
    application.add_handler(CallbackQueryHandler(apply_mfo_callback, pattern="^apply_"))
    application.add_handler(CallbackQueryHandler(compare_callback, pattern="^compare$"))
    application.add_handler(CallbackQueryHandler(about_callback, pattern="^about$"))
    application.add_handler(CallbackQueryHandler(back_main_callback, pattern="^back_main$"))
    
    # Messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("Bot started!")
    application.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
