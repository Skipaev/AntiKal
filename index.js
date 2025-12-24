import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

const PISYA_BOT_ID = 1264548383;

// Проверка прав бота при старте в группе
bot.command("checkrights", async (ctx) => {
  try {
    const chat = await ctx.getChat();
    const botInfo = await ctx.telegram.getMe();
    const member = await ctx.telegram.getChatMember(ctx.chat!.id, botInfo.id);
    
    const isAdmin = member.status === "administrator" || member.status === "creator";
    const canDelete = member.status === "administrator" && member.can_delete_messages;
    
    await ctx.reply(
`🔍 *Диагностика:*

🤖 Мой ID: ${botInfo.id}
👥 Чат: ${chat.title || "личка"}
📊 Мой статус: ${member.status}
🛡 Я админ: ${isAdmin ? "✅ Да" : "❌ Нет"}
🗑 Могу удалять: ${canDelete ? "✅ Да" : "❌ Нет"}

${!isAdmin ? "⚠️ *Сделай меня админом чтобы видеть ботов!*" : ""}`,
      { parse_mode: "Markdown" }
    );
  } catch (e: any) {
    await ctx.reply(`❌ Ошибка: ${e.message}`);
  }
});

// Слушаем ВСЕ типы апдейтов
bot.use(async (ctx, next) => {
  // Логируем сырой апдейт
  const update = ctx.update;
  console.log("📥 Raw update type:", Object.keys(update).join(", "));
  
  if ("message" in update && update.message) {
    const msg = update.message;
    console.log(`📨 From: ${msg.from?.username || msg.from?.id} | is_bot: ${msg.from?.is_bot}`);
  }
  
  return next();
});

bot.on("message", async (ctx) => {
  const from = ctx.message.from;
  if (!from) return;

  // Логируем КАЖДОЕ сообщение
  console.log(`💬 [${from.is_bot ? "BOT" : "USER"}] @${from.username || from.id}: ${(ctx.message as any).text?.slice(0, 30) || "[media]"}`);

  // Проверяем пися бота
  if (from.id === PISYA_BOT_ID) {
    console.log("🎯 PISYA BOT DETECTED!");
    
    if ((ctx.message as any).reply_markup?.inline_keyboard) {
      try {
        await ctx.deleteMessage();
        console.log("✅ Deleted!");
      } catch (e: any) {
        console.log(`❌ Delete failed: ${e.message}`);
      }
    }
  }
});

bot.launch().then(() => console.log("✅ Bot started"));
