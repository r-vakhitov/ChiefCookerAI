import {askGPT} from "./askGPT.js";

export const makeAnotherRecipePrompts = async (ctx, state) => {
  ctx.reply("Готовлю другой рецепт... ⏳");

  const prompt = `Предложи другой рецепт. Ты — шеф-повар из ${state.country} с 20-летним стажем. У меня есть следующие продукты: ${state.products}.
    Подскажи рецепт вкусного блюда своей кухни (${state.country}) с использованием перечисленных продуктов.
    Распиши сначала количество игридиентов, потом действия по шагам. Не пиши завершающее сообщение и не задавай лишних вопросов.
    В ответе используй только русский язык.`;

  // Запрашиваем Groq API
  const response = await askGPT(prompt);

  if (response) {
    await ctx.reply(response);  // Сначала отправляем ответ пользователю
    await ctx.reply("Предложить другой рецепт?");

    state.step = 4;
  } else {
    await ctx.reply("Произошла ошибка, попробуй ещё раз.");
  }
}