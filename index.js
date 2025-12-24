import { Telegraf, Context } from "telegraf";
import { Message, Update } from "telegraf/types";

// ============ ЛОГИРОВАНИЕ СТАРТА ============
console.log("=".repeat(50));
console.log("🚀 ANTI-PISYA BOT STARTING...");
console.log("📅 Time:", new Date().toISOString());
console.log("🖥️  Node:", process.version);
console.log("=".repeat(50));

// ============ ПРОВЕРКА ТОКЕНА ============
const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("❌ FATAL: BOT_TOKEN не найден!");
  console.error("📋 Доступные ENV:", Object.keys(process.env).filter(k => !k.includes("npm")).join(", "));
  process.exit(1);
}

console.log("✅ BOT_TOKEN найден");
console.log("🔑 Длина токена:", token.length);
console.log("🔑 Формат:", token.includes(":") ? "OK" : "НЕВЕРНЫЙ");

// ============ НАСТРОЙКИ ============
const PISYA_BOT_ID = 1264548383;
const PISYA_BOT_USERNAME = "pipisabot";

// ============ СТАТИСТИКА ============
const stats = {
  startTime: Date.now(),
  messagesTotal: 0,
  botsDetected: 0,
  pisyaMessages: 0,
  adsDeleted: 0,
  errors: 0
};

// ============ СОЗДАНИЕ БОТА ============
const bot = new Telegraf(token);

// ============ MIDDLEWARE - ЛОГИРУЕМ ВСЁ ============
bot.use(async (ctx, next) => {
  const updateType = Object.keys(ctx.update).filter(k => k !== "update_id").join(", ");
  console.log(`📥 Update: ${updateType}`);
  return next();
});

// ============ КОМАНДА /start ============
bot.command("start", async (ctx) => {
  console.log(`👤 /start от ${ctx.from?.username || ctx.from?.id}`);
  await ctx.reply(
    "👋 Привет! Я анти-спам бот.\n\n" +
    "Добавь меня в группу как *администратора* с правом удалять сообщения.\n\n" +
    "Команды:\n" +
    "/status - статистика\n" +
    "/check - проверка прав\n" +
    "/ping - жив ли бот",
    { parse_mode: "Markdown" }
  );
});

// ============ КОМАНДА /ping ============
bot.command("ping", async (ctx) => {
  const latency = Date.now();
  const msg = await ctx.reply("🏓 Pong!");
  const ping = Date.now() - latency;
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    msg.message_id,
    undefined,
    `🏓 Pong! Задержка: ${ping}ms`
  );
});

// ============ КОМАНДА /status ============
bot.command("status", async (ctx) => {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000 / 60);
  const hours = Math.floor(uptime / 60);
  const mins = uptime % 60;

  await ctx.reply(
    `📊 *Статистика бота*\n\n` +
    `⏱ Аптайм: ${hours}ч ${mins}м\n` +
    `📨 Сообщений всего: ${stats.messagesTotal}\n` +
    `🤖 От ботов: ${stats.botsDetected}\n` +
    `🎯 От пися-бота: ${stats.pisyaMessages}\n` +
    `🗑 Рекламы удалено: ${stats.adsDeleted}\n` +
    `❌ Ошибок: ${stats.errors}`,
    { parse_mode: "Markdown" }
  );
});

// ============ КОМАНДА /check - ПРОВЕРКА ПРАВ ============
bot.command("check", async (ctx) => {
  console.log(`🔍 /check от ${ctx.from?.username}`);

  if (ctx.chat.type === "private") {
    await ctx.reply("ℹ️ Эта команда работает только в группах");
    return;
  }

  try {
    const botInfo = await ctx.telegram.getMe();
    const member = await ctx.telegram.getChatMember(ctx.chat.id, botInfo.id);

    let canDelete = false;
    let status = member.status;

    if (member.status === "administrator") {
      canDelete = member.can_delete_messages || false;
    }

    const isOk = status === "administrator" && canDelete;

    await ctx.reply(
      `🔍 *Проверка прав*\n\n` +
      `🤖 Мой ID: \`${botInfo.id}\`\n` +
      `📊 Статус: ${status}\n` +
      `🛡 Админ: ${status === "administrator" ? "✅" : "❌"}\n` +
      `🗑 Удаление: ${canDelete ? "✅" : "❌"}\n\n` +
      (isOk
        ? "✅ *Всё настроено правильно!*"
        : "⚠️ *Сделай меня админом с правом удалять сообщения!*"),
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    console.error("❌ /check error:", err.message);
    await ctx.reply(`❌ Ошибка: ${err.message}`);
  }
});

// ============ ОБРАБОТКА ВСЕХ СООБЩЕНИЙ ============
bot.on("message", async (ctx) => {
  const message = ctx.message;
  const from = message.from;

  if (!from) {
    console.log("⚠️ Сообщение без from");
    return;
  }

  stats.messagesTotal++;

  // Логируем каждое сообщение
  const text = "text" in message ? message.text?.slice(0, 40) : "[media]";
  const chatTitle = "title" in ctx.chat ? ctx.chat.title : "private";
  
  console.log(
    `💬 [${chatTitle}] ` +
    `${from.is_bot ? "🤖" : "👤"} ` +
    `@${from.username || from.id}: ${text}`
  );

  // Если это бот
  if (from.is_bot) {
    stats.botsDetected++;
    console.log(`   ↳ БОТ обнаружен! ID: ${from.id}, Username: @${from.username}`);

    // Проверяем пися бота
    const isPisya = from.id === PISYA_BOT_ID || from.username === PISYA_BOT_USERNAME;

    if (isPisya) {
      stats.pisyaMessages++;
      console.log("🎯 ========== ПИСЯ БОТ! ==========");

      // Проверяем наличие кнопок (реклама)
      const hasButtons = "reply_markup" in message && 
                        message.reply_markup && 
                        "inline_keyboard" in message.reply_markup;

      if (hasButtons) {
        console.log("🗑 Обнаружена реклама с кнопками, удаляю...");

        try {
          await ctx.deleteMessage();
          stats.adsDeleted++;
          console.log(`✅ Удалено! Всего удалено: ${stats.adsDeleted}`);
        } catch (err: any) {
          stats.errors++;
          console.error(`❌ Ошибка удаления: ${err.message}`);

          // Если нет прав - сообщаем
          if (err.message.includes("rights") || err.message.includes("admin")) {
            try {
              await ctx.reply(
                "⚠️ Не могу удалить рекламу - нет прав администратора!",
                { reply_to_message_id: message.message_id }
              );
            } catch {}
          }
        }
      } else {
        console.log("ℹ️ Сообщение без кнопок - не удаляю");
      }
    }
  }
});

// ============ ОБРАБОТКА ОШИБОК ============
bot.catch((err: any, ctx) => {
  stats.errors++;
  console.error("❌ Bot error:", err.message);
  console.error("   Context:", ctx.updateType);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});

// ============ ЗАПУСК ============
console.log("🔄 Подключаюсь к Telegram...");

bot.launch({
  dropPendingUpdates: true // Игнорируем старые сообщения
})
.then(() => {
  console.log("=".repeat(50));
  console.log("✅ БОТ УСПЕШНО ЗАПУЩЕН!");
  console.log("👀 Жду сообщений...");
  console.log("=".repeat(50));
})
.catch((err) => {
  console.error("❌ FATAL: Не удалось запустить бота!");
  console.error("   Причина:", err.message);
  
  if (err.message.includes("401")) {
    console.error("   💡 Неверный BOT_TOKEN!");
  }
  if (err.message.includes("409")) {
    console.error("   💡 Бот уже запущен где-то ещё!");
  }
  
  process.exit(1);
});

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("👋 Получен SIGINT, выключаюсь...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("👋 Получен SIGTERM, выключаюсь...");
  bot.stop("SIGTERM");
});
