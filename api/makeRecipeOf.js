import {askGPT} from "./askGPT.js";

export const makeRecipeOf = async (ctx, state) => {
  ctx.reply("Ищу рецепт, секундочку ... ⏳");

  const prompt = `Ты — шеф-повар мирового класса с 20-летним опытом. Найди мне вкусный рецепт ${state.dish}, ингридиенты должны быть доступными.
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