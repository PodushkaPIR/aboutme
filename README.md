# aboutme

Персональный сайт: проекты с GitHub + секция «Обо мне». Статика, RU/EN переключатель, автоматический HTTPS от Let's Encrypt через Caddy.

## Структура

```
├── index.html        # разметка
├── css/style.css     # стили (цвета — в :root переменных)
├── js/main.js        # GitHub API, i18n, рендер карточек
├── favicon.svg
└── deploy/
    ├── Caddyfile     # конфиг Caddy с авто-HTTPS
    └── deploy.sh     # rsync-деплой на VPS
```

## Локальный запуск

```bash
python3 -m http.server 8080
# открыть http://localhost:8080
```

## Настройка под себя

- **js/main.js** → объект `CONFIG`: ник на GitHub, исключать ли форки, закреплённые репозитории (`pinned`), лимит карточек.
- **js/main.js** → объект `I18N`: все тексты сайта на RU и EN.
- **index.html** → имя в hero-секции и `<title>`.
- **css/style.css** → `:root` переменные: цвета, радиусы.

## Деплой на VPS (Ubuntu/Debian)

### 1. DNS

Создай A-запись у регистратора домена:

```
@      →  IP_твоего_VPS
www    →  IP_твоего_VPS
```

Let's Encrypt выпускает сертификат только если домен уже указывает на сервер — сначала DNS, потом Caddy.

### 2. Установка Caddy

Caddy сам получает и автоматически продлевает сертификаты Let's Encrypt — certbot не нужен.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### 3. Конфиг

Замени `example.com` в `deploy/Caddyfile` на свой домен и скопируй на сервер:

```bash
scp deploy/Caddyfile user@vps:/tmp/Caddyfile
ssh user@vps 'sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy'
```

### 4. Код сайта

Вариант А — прямо из git (обновление = `git pull`):

```bash
sudo mkdir -p /var/www/aboutme
sudo chown $USER /var/www/aboutme
git clone git@github.com:PodushkaPIR/aboutme.git /var/www/aboutme
```

Вариант Б — со своей машины через `deploy.sh`:

```bash
chmod +x deploy/deploy.sh
# укажи SERVER="user@ip" в начале скрипта
./deploy/deploy.sh
```

### 5. Файрвол

Открыть 80 и 443 порты (нужны для HTTP-challenge и HTTPS):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Проверка

```bash
curl -I https://твой-домен
sudo journalctl -u caddy -f   # логи выпуска сертификата
```

## Как работает авто-сертификация

При старте Caddy видит домен в Caddyfile → сам запрашивает сертификат у Let's Encrypt (HTTP-01 challenge по 80 порту) → обслуживает сайт по HTTPS → за 30 дней до истечения продлевает в фоне. Ничего настраивать или обновлять вручную не нужно.

Если нужен email для уведомлений LE — добавь первой строкой Caddyfile:

```
{
	email you@example.com
}
```
