import { Telegraf } from "telegraf";

if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не найден!");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройки пися бота
const PISYA_BOT_ID = 1264548383;
const PISYA_BOT_USERNAME = "pipisabot";

// Статистика
let stats = {
  started: new Date().toISOString(),
  messagesTotal: 0,
  messagesFromPisya: 0,
  adsDeleted: 0,
  lastPisyaMessage: null
};

// Команда /status — проверка что бот работает
bot.command("status", async (ctx) => {
  const uptime = Math.floor((Date.now() - new Date(stats.started)) / 1000 / 60);
  
  await ctx.reply(
`✅ *Анти-пися бот работает!*

⏱ Работаю уже: ${uptime} мин
📨 Всего сообщений видел: ${stats.messagesTotal}
🎯 От пися бота: ${stats.messagesFromPisya}
🗑 Рекламы удалено: ${stats.adsDeleted}
📅 Последнее от пися бота: ${stats.lastPisyaMessage || "ещё не было"}`,
    { parse_mode: "Markdown" }
  );
});

// Команда /ping — быстрая проверка
bot.command("ping", (ctx) => ctx.reply("🏓 Понг! Бот жив!"));

// Логируем ВСЕ сообщения
bot.on("message", async (ctx) => {
  const message = ctx.message;
  if (!message || !message.from) return;

  stats.messagesTotal++;
  
  const from = message.from;
  const isBot = from.is_bot;
  
  // Логируем сообщения от ЛЮБЫХ ботов (чтобы понять что видим)
  if (isBot) {
    console.log(`🤖 Сообщение от бота: @${from.username || "?"} (ID: ${from.id})`);
    console.log(`   Текст: ${message.text?.slice(0, 50) || "[не текст]"}`);
    console.log(`   Есть кнопки: ${!!message.reply_markup}`);
  }

  // Проверяем пися бота
  const isPisyaBot = from.id === PISYA_BOT_ID || from.username === PISYA_BOT_USERNAME;
  
  if (!isPisyaBot) return;

  stats.messagesFromPisya++;
  stats.lastPisyaMessage = new Date().toLocaleString("ru-RU");
  
  console.log(`🎯 ===== ПИСЯ БОТ ОБНАРУЖЕН =====`);
  console.log(`   ID: ${from.id}`);
  console.log(`   Username: @${from.username}`);
  console.log(`   Текст: ${message.text || "[медиа/стикер]"}`);

  // Есть кнопки = реклама
  if (message.reply_markup?.inline_keyboard) {
    console.log(`🗑 Удаляю рекламу...`);
    try {
      await ctx.deleteMessage();
      stats.adsDeleted++;
      console.log(`✅ Реклама удалена! Всего удалено: ${stats.adsDeleted}`);
    } catch (e) {
      console.log(`❌ Ошибка удаления: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ Без кнопок — не удаляю`);
  }
});

bot.catch((err) => console.error("❌ Ошибка:", err.message));

bot.launch()
  .then(() => console.log("✅ Бот запущен! Жду сообщений..."))
  .catch((err) => console.error("❌ Не запустился:", err.message));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
