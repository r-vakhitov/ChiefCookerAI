# Используем Node.js
FROM node:18-alpine

# Устанавливаем зависимости
WORKDIR /app
COPY package*.json ./
RUN npm install

# Копируем файлы проекта
COPY . .

# Запуск бота
CMD ["node", "bot.js"]