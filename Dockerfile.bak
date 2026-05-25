# Используем официальный образ nginx
FROM nginx:alpine

# Копируем все файлы сайта в контейнер
COPY . /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порты
EXPOSE 80 443

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]