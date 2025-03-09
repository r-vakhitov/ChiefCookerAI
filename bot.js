import {makeAnotherRecipePrompts} from './api/makeAnotherRecipePrompt.js'
import {askGPT} from './api/askGPT.js'
import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import {makeRecipeOf} from "./api/makeRecipeOf.js";

dotenv.config();

// Загружаем токены из .env
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Храним состояния пользователей
const userState = {};

// Функция запроса к Groq API

// Команда /start

const mainMenu = Markup.keyboard([
  ["Изменить страну"],
  ["Изменить продукты"],
  ["Напиши мне рецепт блюда"]
]);

const secondMenu = Markup.keyboard([
  ["Изменить страну", "Изменить продукты"],
  ["Что нибудь побыстрее", "Другой рецепт"],
  ["В главное меню"]
])
  .resize(); // Делаем кнопки компактными

// При старте показываем меню
bot.start((ctx) => {
  ctx.reply(
    "Привет! Я - твой личный шеф-повар. Давай сначала определимся с кухней. Куда сегодня летим?",
    mainMenu
  );
});

bot.hears("В главное меню", (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { step: 1 };

  ctx.reply("Куда сегодня летим? Если неважно, просто напиши 'Любая'", mainMenu);
});

bot.hears("Напиши мне рецепт блюда", async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { step: 0 };

  ctx.reply("Введи название блюда");
});


// Обрабатываем выбор пользователя
bot.hears("Изменить страну", (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { step: 1 };

  ctx.reply("Куда сегодня летим? Если неважно, просто напиши 'Любая'");
});

bot.hears("Изменить продукты", (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { step: 2 };
  ctx.reply("Перечисли продукты, которые у тебя есть:");
});

bot.hears("Другой рецепт", async (ctx) => {
  const chatId = ctx.chat.id;

  if (!userState[chatId] || !userState[chatId].country) {
    userState[chatId] = { step: 1 };
    ctx.reply("Сначала выбери страну");
  } else if (userState[chatId].step === 1 || !userState[chatId].products) {
    userState[chatId].step = 2;
    ctx.reply("Сначала напиши продукты");
  } else {
    const state = userState[chatId];

    await makeAnotherRecipePrompts(ctx, state);
  }
});

bot.hears("Что нибудь побыстрее", async (ctx) => {
  const chatId = ctx.chat.id;

  if (!userState[chatId] || !userState[chatId].country) {
    userState[chatId] = { step: 1 };
    ctx.reply("Сначала выбери страну");
  } else if (userState[chatId].step === 1 || !userState[chatId].products) {
    userState[chatId].step = 2;
    ctx.reply("Сначала напиши продукты");
  } else {
    const state = userState[chatId];

    await makeAnotherRecipePrompts(ctx, state, true);
  }
});

// Обрабатываем входящие сообщения
bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;

  if (!userState[chatId]) {
    userState[chatId] = { step: 1 };
  }

  const state = userState[chatId];

  if (state.step === 0) {
    state.dish = userMessage;

    await makeRecipeOf(ctx, state);

    state.step = 3;
  } else if (state.step === 1) {
    state.country = userMessage;
    state.step = 2;
    ctx.reply(`Отлично! Ты выбрал кухню ${state.country}. Теперь перечисли, какие продукты у тебя есть?`);
  } else if (state.step === 2) {
    state.products = userMessage;
    state.step = 3;

    // Формируем финальный промпт
    const prompt = `Ты — шеф-повар из ${state.country} с 20-летним стажем. У меня есть следующие продукты: ${state.products}.
    Не используй их вместе в рецепте, если они НЕ сочетаются. Но возьми их за основу.
    Подскажи рецепт вкусного блюда своей кухни (${state.country}).
    Можешь добавить каких-то продуктов, если будет вкусно. Только не много.
    Напиши сначала название блюда, потом распиши количество игридиентов, потом действия по шагам, примерное время готовки. Не пиши завершающее сообщение и не задавай лишних вопросов.
    В ответе используй только русский язык.`;

    ctx.reply("Готовлю рецепт... ⏳");

    // Запрашиваем Groq API
    const response = await askGPT(prompt);

    if (response) {
      await ctx.reply(response);  // Сначала отправляем ответ пользователю
      await ctx.reply("Предложить другой рецепт?", secondMenu);

      state.step = 4;
    } else {
      await ctx.reply("Произошла ошибка, попробуй ещё раз.");
    }

  } else if (state.step === 4) {
    if (userMessage.toLowerCase() === "да") {
      await makeAnotherRecipePrompts(ctx, state);
    } else {
      state.step = 5;
      ctx.reply("Изменим продукты?");
    }
  } else if (state.step === 5) {
    if (userMessage.toLowerCase() === "да") {
      state.step = 2;
      ctx.reply("Перечисли новые продукты:");
    } else {
      ctx.reply("Отлично! Приятного аппетита! 🍽️");
      delete userState[chatId];
    }
  }
});

// Запуск бота
bot.launch();
console.log("🤖 Бот запущен!");