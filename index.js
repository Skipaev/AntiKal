import { Telegraf } from "telegraf";

// Проверяем токен
if (!process.env.BOT_TOKEN) {
  console.error("❌ ОШИБКА: BOT_TOKEN не найден! Добавь его в Variables на Railway");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// ID пися бота (замени на правильный!)
const PISYA_BOT_ID = 1264548383;
const PISYA_BOT_USERNAME = "pipisabot"; // БЕЗ собаки!

bot.on("message", async (ctx) => {
  const message = ctx.message;
  if (!message) return;

  const from = message.from;
  
  // 👇 ОТЛАДКА: логируем ВСЕ сообщения чтобы понять что приходит
  console.log(`📨 Сообщение от: ${from.username || "без username"} (ID: ${from.id})`);
  
  // Проверяем, от пися бота ли сообщение
  const isPisyaBot = from.id === PISYA_BOT_ID || from.username === PISYA_BOT_USERNAME;
  
  if (!isPisyaBot) {
    return;
  }

  console.log(`🎯 Обнаружено сообщение от пися бота!`);

  // Если есть инлайн-кнопки — это реклама
  if (message.reply_markup && message.reply_markup.inline_keyboard) {
    try {
      await ctx.deleteMessage(message.message_id);
      console.log(`✅ Удалил рекламу! ID сообщения: ${message.message_id}`);
    } catch (e) {
      console.log(`❌ Не смог удалить: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ Сообщение без кнопок, пропускаю`);
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error("❌ Ошибка бота:", err.message);
});

bot.launch()
  .then(() => {
    console.log("✅ Анти-пися бот запущен и следит за группой!");
  })
  .catch((err) => {
    console.error("❌ Не удалось запустить бота:", err.message);
  });

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
