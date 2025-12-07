import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

// ID или username пися бота (замени на своего!)
const PISYA_BOT_ID = 1264548383; // или "@pisyabot"
const PISYA_BOT_USERNAME = "@pipisabot"; // если знаешь точный username

bot.on("message", async (ctx) => {
  const message = ctx.message;
  if (!message) return;

  // Проверяем, от нужного ли бота сообщение
  const from = message.from;
  if (from.id !== PISYA_BOT_ID && from.username !== PISYA_BOT_USERNAME.replace("@", "")) {
    return;
  }

  // Если есть инлайн-кнопки — это реклама → удаляем
  if (message.reply_markup && message.reply_markup.inline_keyboard) {
    try {
      await ctx.deleteMessage(message.message_id);
      console.log(`Удалил рекламу от пися бота: ${message.message_id}`);
    } catch (e) {
      console.log("Не смог удалить (возможно, уже удалено или нет прав)");
    }
  }
});

// Запускаем long-polling (самый быстрый отклик)
bot.launch();
console.log("Анти-пися бот запущен и следит за группой!");
