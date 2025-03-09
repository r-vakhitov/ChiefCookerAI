import {askGPT} from "./askGPT.js";

export const makeAnotherRecipePrompts = async (ctx, state, faster = false) => {
  ctx.reply("Готовлю другой рецепт... ⏳");

  const prompt = `Предложи другой рецепт${faster ? ' , чтоб готовилось побыстрее' : ''}. Ты — шеф-повар из ${state.country} с 20-летним опытом. У меня есть следующие продукты: ${state.products}.
    Не используй их вместе в рецепте, если они НЕ сочетаются. Но возьми их за основу.
    Подскажи рецепт вкусного блюда своей кухни (${state.country}).
    Можешь добавить каких-то продуктов, если будет вкусно. Только не много.
    Распиши сначала количество игридиентов, потом действия по шагам, примерное время готовки. Не пиши завершающее сообщение и не задавай лишних вопросов.`;

  const response = await askGPT(prompt);

  if (response) {
    await ctx.reply(response);
    await ctx.reply("Предложить другой рецепт?");

    state.step = 4;
  } else {
    await ctx.reply("Произошла ошибка, попробуй ещё раз.");
  }
}