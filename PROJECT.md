# Разбор проекта «Ąžuolynas International Students Film Festival» (AISFF)

Этот документ описывает реальное устройство сайта **www.azuolynasfilmfestival.lt** строго по состоянию файлов в репозитории (без изменений кода).  
Если какой-то момент зависит от внешних настроек (Firebase Console, Cloudflare, GitHub, почтового расширения или внешнего фотохостинга) и его **нельзя проверить только по коду**, это прямо отмечено.

---

## 1. Из каких файлов состоит сайт и за что отвечает каждый

### 1.1. Публичные страницы сайта (то, что видят посетители)
* **`index.html`** — входная страница в корне домена (`/`). Определяет язык браузера (`navigator.language`): если `en*`, перенаправляет на `en/index.html`, иначе — на `lt/index.html`.
* **`lt/index.html`** — главная страница на литовском языке (тема, даты, таймер обратного отсчёта, карточки выпусков 2027 и 2026, правила, DUK, категории, архив видео и фото, результаты, голосование, запись церемонии, форма подачи заявки).
* **`en/index.html`** — главная страница на английском языке (аналогичная структура и скрипты).
* **`lt/azuolynas-fest-2027.html`**, **`en/azuolynas-fest-2027.html`**, **`azuolynas-fest-2027.html`** (корень) — страницы выпуска FEST 2027 (тема «Mano pašaukimas / My Purpose», описание, видео, галерея фотографий по альбомам).
* **`lt/azuolynas-fest-2026.html`**, **`en/azuolynas-fest-2026.html`** — страницы выпуска FEST 2026 (тема «What If», 30 апреля 2026 г., победители, география, галерея).
* **`lt/azuolynas-festival-2026.html`** — ещё одна почти дублирующая литовская страница о FEST 2026 (см. раздел 5).
* **`voting.html`** — отдельная двуязычная страница зрительского голосования и результатов (`?lang=lt` или `en`).
* **`live.html`** — портал закрытой прямой трансляции (Cloudflare Stream) по токену/коду из письма или ссылке `?token=...`, с проверкой токена, таймером/статусом эфира и блоком «Dabar eteryje».
* **`stream-overlay.html`** — прозрачная плашка (Lower-Third + топ голосования) для OBS / эфира.
* **`faq.html`**, **`lt/faq.html`**, **`en/faq.html`** — отдельные страницы FAQ с поиском и фильтрами (корневой `faq.html` перенаправляет на `lt/faq.html` или `en/faq.html`).
* **Юридические страницы и редиректы**:
  * Литовские: `lt/privatumo-politika.html`, `lt/naudojimosi-taisykles.html`, плюс редиректы `lt/privacy-policy.html` и `lt/terms-of-service.html`.
  * Английские: `en/privacy-policy.html`, `en/terms-of-service.html`, плюс редиректы `en/privacy.html` и `en/terms.html`.
  * Корневые: двуязычные `privacy-policy.html` и `terms-of-service.html`, плюс редиректы `privacy.html` и `terms.html`.
* **`google6cf12430f1a6e62c.html`** — файл подтверждения прав на сайт в Google Search Console.
* **`CNAME`**, **`robots.txt`**, **`sitemap.xml`** — домен `www.azuolynasfilmfestival.lt` для GitHub Pages, правила индексации (закрыт `/admin.html`) и карта сайта для поисковиков.

### 1.2. Админ-панель (`admin.html`) и её модули (`/js/*`)
* **`admin.html`** — вся админ-панель (форма входа + 12 вкладок: Панель статистики, Заявки, Голосование и Лауреаты, Прямая трансляция, Графика эфира/H2H, Годовые выпуски, Альбомы, Архив, Пользователи, Журнал уведомлений, Диагностика, Настройки).
* **`admin-dashboard.js`** — рисует графики и счётчики на первой вкладке «Apžvalga» (категории, бублик «Вживую / Онлайн», страны).
* **`js/admin-main.js`** — точка входа админки (`type="module"`): запускает авторизацию, переключает вкладки, инициализирует все модули и блок «Eterio grafika (H2H / OBS)».
* **`js/firebase-init.js`** — подключает Firebase Compat SDK к проекту `filmfest-509606` и именованной базе `ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83`, задаёт список суперадминов и дефолтные тексты.
* **`js/auth.js`** — вход по Email/паролю, вход через Google, сброс пароля, активация приглашений (`?invite=...`), проверка роли в коллекции `users`.
* **`js/submissions.js`** — таблица заявок, фильтры по году/статусу/категории, карточка фильма, смена статуса, отправка писем участникам, назначение/редактирование победителей (лауреатов), скачивание PDF.
* **`js/submission-pdf-client.js`** — генерация A4-PDF файла заявки прямо в браузере (через `<canvas>` → JPEG → PDF), чтобы скачивание PDF работало на GitHub Pages без сервера.
* **`js/voting-analytics.js`** — вкладка «Balsavimas ir Komisija»: таблица финалистов/участников, оценки жюри (5 критериев), тумблер «Gyvai balsavime», модальное окно редактирования лауреата и кнопка «Į tiesioginį eterį».
* **`js/stream-admin.js`** — управление статусом трансляции (Live/Paused/Ended), настройками OBS/Cloudflare, выдача и рассылка токенов зрителям/учителям, массовое создание классов, список RSVP.
* **`js/editions.js`** — вкладка «Metų leidiniai» (создание и редактирование выпусков FEST в `editions/{year}`, без галереи фото).
* **`js/albums.js`** — вкладка «Albumai» (переключатель годов 2026/2027/новый год, тексты LT/EN, обложка, видео, массовая загрузка фото и распределение по альбомам в `editions/{year}`).
* **`js/archive.js`** — вкладка «Archyvas» (видеоархив, фотоархив и главное фото статуэток/призов в `settings/festival`).
* **`js/settings.js`** — вкладка «Nustatymai» (включение/выключение разделов сайта, тема, даты, правила, категории, запись эфира, тестовая отправка письма и настройки SMTP).
* **`js/users.js`** и **`js/invite-modal.js`** — управление командой (роли: админ, редактор, модератор, жюри, бухгалтер, зритель), приглашения через сервер/Firestore и очередь `mail`.
* **`js/notifications-log.js`** — вкладка «Pranešimų žurnalas» (пытается читать `/api/admin/logs`).
* **`js/diagnostics.js`** — вкладка «Diagnostika» (7 проверок и блок логов сервера).
* **`js/ui-feedback.js`** — всплывающие уведомления (toast) и перехватчик ошибок.
* **`js/firebase-client.js`** — обёртка запросов к `/api/*` для `live.html` и `js/stream-admin.js`.
* **Файлы в `/js/`, которые сейчас НИГДЕ не подключены в HTML и `admin-main.js`**: `js/tasks.js`, `js/activity-logs.js`, `js/test-voting.js` (подробнее в разделе 5).

### 1.3. Публичные скрипты и стили (в корне и `/js/`, в т.ч. `.min.*` версии)
Для скорости на публичных страницах используются минифицированные версии `.min.js` и `.min.css`, которые собираются из исходников:
* **`style.css`** → **`style.min.css`** — основные стили публичного сайта и админки.
* **`live.css`** → **`live.min.css`** — стили страницы `live.html`.
* **`config.js`** → **`config.min.js`** — конфиг Firebase (ID проекта, бакета, именованной БД), правила валидации видео (макс. 180 сек, MP4/MOV/WEBM, разрешённые хосты ссылок) и `DEFAULT_CONTENT` (тексты по умолчанию для LT/EN).
* **`js/server-api.js`** → **`js/server-api.min.js`** — определяет, есть ли у сайта живой Node-сервер (`FestivalApi.hasServer()`). На `github.io` и `azuolynasfilmfestival.lt` всегда возвращает `false`.
* **`js/firebase-public-lazy.js`** → **`js/firebase-public-lazy.min.js`** — ленивая загрузка модульного Firebase SDK 10.8.0 для публичных страниц (подгружает Firestore/Storage только при прокрутке, клике в форму или через ~1.2–1.6 сек после загрузки, без Firebase Auth).
* **`js/voting-and-winners.js`** → **`js/voting-and-winners.min.js`** — отображение карточек голосования и секции «Laureatai» на `lt/index.html` и `en/index.html`, отправка голоса.
* **`js/photo-lightbox.js`** → **`js/photo-lightbox.min.js`** — галерея фотографий с вкладками (Все / Церемония / Лауреаты / Призы) и полноэкранным просмотром (lightbox).
* **`js/yt-facade.js`** → **`js/yt-facade.min.js`** — лёгкая обложка-заглушка для YouTube (грузит плеер `youtube-nocookie.com` только после клика).
* **`js/countdown.js`** → **`js/countdown.min.js`** — таймер обратного отсчёта в шапке главного экрана.
* **`js/burger-menu.js`** → **`js/burger-menu.min.js`** — мобильное выдвижное меню и синхронизация видимости пунктов меню.
* **`js/social-share.js`** → **`js/social-share.min.js`** — кнопки «Поделиться в Facebook / Instagram / Скопировать ссылку».
* **`email-templates.js`** → **`email-templates.min.js`** — готовые HTML-шаблоны всех писем (подтверждение заявки, приглашение на стрим, статусы отбора, победа, приглашение в команду).
* **`js/mail-client.js`** → **`js/mail-client.min.js`** — сохраняет заявку участника + создаёт задания на отправку писем в коллекцию `mail` (на GitHub Pages) или шлёт на `/api/*` (на Node-сервере).
* **`error-reporting.js`** → **`error-reporting.min.js`** — перехватчик JS-ошибок с сокрытием токенов (подробную карточку ошибки показывает только админу или с `?debug=1`).
* **Прочие файлы в корне**:
  * `h2h-export.js` — экспорт титров и статистики в JSON, CSV и отдельный HTML для OBS (используется в `admin.html`).
  * `qr-code.js` — генератор QR-кодов на `<canvas>` для ссылок на трансляцию (подключён в `admin.html`).
  * `voting-client.js` — старый/альтернативный движок голосования с анонимной авторизацией (нигде не подключён).
  * `now-playing.js` — пустой файл-заглушка (плавающий баннер отключён, файл нигде не подключён).
  * `pdf-generator.js` — серверный генератор PDF через `pdfkit` (используется только в `server.js`).
  * `stream-worker.js` — код для Cloudflare Worker (проверяет SHA-256 хеш токена через Firestore REST API и выдаёт ссылку Cloudflare Stream).

### 1.4. Сервер, база, сборка и тесты
* **`server.js`** — Express-сервер (Node.js) с API `/api/*`, раздачей статики, SMTP-отправкой через `nodemailer`, генерацией PDF через `pdfkit`, JWT и локальным хранением части данных. **На GitHub Pages он не запускается.**
* **`firestore.rules`**, **`storage.rules`**, **`firebase-blueprint.json`**, **`firebase-applet-config.json`** — правила доступа к Firestore и Storage, схема коллекций и конфиг апплета.
* **`data/editions.json`** — резервный/стартовый JSON-файл выпусков фестиваля (2022–2027), который публичные страницы читают до прихода ответа от Firestore.
* **`data/users.json`**, **`data/tasks.json`** — локальные JSON-файлы для Node-сервера (`server.js`).
* **`scripts/minify-assets.mjs`**, **`scripts/check-static.mjs`** — сборка `.min.css` / `.min.js` и проверка синтаксиса скриптов/HTML.
* **`tests/admin-client.test.js`**, **`tests/admin-server.test.js`**, **`tests/regressions.test.js`** — автотесты проекта.
* **`package.json`**, **`bun.lock`**, **`.env.example`**, **`metadata.json`**, **`README.md`**.

---

## 2. Как данные идут из админки в Firestore и из Firestore на сайт

У проекта одна и та же база Cloud Firestore:
* **Проект:** `filmfest-509606`
* **Именованная база данных:** `ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83` *(важно: не `(default)`!)*
* **Firebase Storage bucket:** `filmfest-509606.firebasestorage.app`

### 2.1. Путь «Админка → Firestore (и обратно на сервер)»
1. Админ открывает `admin.html` и входит через Firebase Auth (Google или Email/пароль).
2. `firestore.rules` проверяют права через `isSuperAdmin()` или `isJudge()`:
   * напрямую в правилах прописаны 2 подтверждённых email: `azuolynasfilmfestival@gmail.com` и `karina.brdar@gmail.com`;
   * либо в коллекции `users/{uid}` должен быть документ с `role: 'admin'` (или `'judge'`) и `status: 'active'`.
3. Почти все модули админки работают по схеме **«Сначала Firestore напрямую + если есть Node-сервер, дублировать в `/api/*`»**:
   * **Настройки (`settings.js`)** → пишет одновременно в `settings/festival` и `settings/global`.
   * **Архив (`archive.js`)** → дописывает поля `archiveVideos`, `archivePhotos`, `prizesPhotoUrl` в `settings/festival`.
   * **Выпуски и Альбомы (`editions.js`, `albums.js`)** → пишут в документы `editions/{year}` (например `editions/2026`, `editions/2027`, а для английских полей `albums.js` также синхронизирует `editions/{year}_en`).
   * **Фотографии альбомов и архива** → пытаются загрузиться в Firebase Storage (`archive/...` или `archive_photos/...`). В `albums.js`, если Storage не сработал и есть сервер — шлёт на `/api/admin/albums/upload`, а если нет сервера — сжимает фото в JPEG и кладёт прямо в документ Firestore как `data:image/jpeg;base64,...` (если влезает в лимит ~950 КБ на документ).
   * **Заявки, голосование и победители (`submissions.js`, `voting-analytics.js`)** → обновляют документы в `submissions/{id}` и оценки жюри в `judge_evaluations/{filmId}_{judgeEmail}`.
   * **Эфирная графика (`admin-main.js`, `voting-analytics.js`)** → пишет `nowPlaying`, `nextFilm`, `isPublicVisible` в `stream_config/broadcast`.
   * **Трансляция (`stream-admin.js`)** → **исключение!** В основном шлёт запросы через `FirebaseClient.request(...)` на маршруты `/api/admin/stream/...` и `/api/admin/resend-live-link` (на Node-сервере), а на статическом GitHub Pages эти серверные маршруты не работают (при этом в `live_viewers` и `stream_tokens` без сервера из этого модуля запись не переключена на прямой Firestore SDK).
   * **Письма**:
     * На Node-сервере админка и форма заявки вызывают `/api/...`, и `server.js` шлёт письма через SMTP (`nodemailer`).
     * На статическом хостинге (GitHub Pages) `mail-client.js`, `submissions.js`, `settings.js`, `invite-modal.js` **создают документ в коллекции Firestore `mail`**.
     * **Примечание (нельзя проверить по коду):** чтобы документы из коллекции `mail` реально уходили адресатам на почту, в Firebase/GCP должно быть установлено и настроено расширение **Trigger Email (`firestore-send-email`)** с рабочим SMTP. В репозитории нет папки `functions/` и нет доступа к Firebase Console, поэтому по коду нельзя проверить, развёрнуто ли это расширение и работает ли оно сейчас.

### 2.2. Путь «Firestore → Публичный сайт»
1. **Главная страница (`lt/index.html`, `en/index.html`)**:
   * Сразу показывает текст из HTML и стартовые карточки из `data/editions.json`.
   * Затем срабатывает `js/firebase-public-lazy.min.js` (модульный SDK 10.8.0 без Auth, чтобы не грузить лишний код):
     * слушает `settings/festival` → обновляет видимость секций, тему, даты, правила, категории, архив видео/фото, ссылку на запись эфира и фото призов;
     * слушает `editions` (пропуская документы с суффиксом `_en` на литовской версии) → перерисовывает карточки в блоке «Oficialūs Festivalio Leidimai»;
     * слушает `submissions` с двумя фильтрами безопасности (`where('inVoting', '==', true)` и `where('isWinner', '==', true)`) → заполняет блок зрительского голосования и блок «Laureatai» (`voting-and-winners.min.js`).
2. **Страницы выпусков (`lt/azuolynas-fest-2026.html`, `en/azuolynas-fest-2026.html`, `lt/azuolynas-fest-2027.html`, `en/azuolynas-fest-2027.html`, `azuolynas-fest-2027.html`)**:
   * Сначала берут данные из `data/editions.json` (если доступны).
   * После ленивой загрузки Firebase слушают `editions/{year}` (а `en/azuolynas-fest-2026.html` также `editions/2026_en`) и обновляют заголовок, дату, подзаголовок, обложку, историю, видео и фотогалерею с вкладками по альбомам.
3. **Страница голосования (`voting.html`)**:
   * Слушает `settings/festival` и `settings/global`, коллекцию `movies` и `submissions` (`inVoting == true`, `isWinner == true`).
   * При нажатии «Голосовать» на GitHub Pages напрямую увеличивает `votesCount` (или `votes` для `movies`) на `+1` через `FieldValue.increment(1)` и пишет запись аудита в `votes`.
4. **Страница трансляции (`live.html`) и оверлей (`stream-overlay.html`)**:
   * Не грузят Firebase SDK вообще — напрямую делают HTTP-запросы к **Firestore REST API** (`https://firestore.googleapis.com/v1/projects/filmfest-509606/databases/ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83/documents/...`):
     * `live.html` проверяет `stream_tokens/{sha256}` и `live_viewers/{token}`, читает `settings/festival` (живой эфир / оверлей).
     * `stream-overlay.html` раз в 4 секунды запрашивает `stream_config/broadcast` и `submissions` (`inVoting == true` / `isWinner == true`).

---

## 3. Таблица: поле в админке → где хранится → где видно на сайте

| Вкладка в админке | Поле / элемент управления в админке | Где хранится | Где видно на сайте |
|---|---|---|---|
| **Nustatymai** | `Priežiūros režimas` (`#cfgMaintenance`) | `settings/festival` и `settings/global` → `maintenanceMode` *(в админке также сохраняется локально через `server.js` при наличии)* | Скрывает ли? **Только проверка на некоторых местах / `DEFAULT_CONTENT`**, но в `lt/index.html` и `en/index.html` в `applyFestivalSettings()` `maintenanceMode` **не скрывает страницу** (нет обработчика заглушки) |
| **Nustatymai** | Тумблеры секций: `Apie`, `Taisyklės`, `DUK`, `Kategorijos`, `Metų Leidimai`, `Archyvas`, `Balsavimas`, `Registracija` (`#cfgShowAbout`…`#cfgShowSubmit`) | `settings/festival` → `showAbout`, `showTerms`, `showFaq`, `showCategories`, `showEditions`, `showArchive`, `showVoting`, `showSubmit` | Скрывает/показывает соответствующие `<section>` и пункты в бургер-меню на `lt/index.html` и `en/index.html` (исключение: секция голосования всё равно откроется, если есть фильм с `inVoting: true`) |
| **Nustatymai** | `Įrašytas vaizdo įrašas` (`#cfgRecordingUrl`) | `settings/festival` → `recordingVideoUrl` | `lt/index.html` и `en/index.html` → секция `#screening` (`#screeningPlayerContainer`) |
| **Nustatymai** | Тема, история темы, даты, «Apie festivalį» (LT: `#cfgLtTopic`, `#cfgLtTopicDesc`, `#cfgLtOpening`, `#cfgLtDeadline`, `#cfgLtEvent`, `#cfgLtDates`, `#cfgLtAbout`; EN: `#cfgEn...`) | `settings/festival` → `lt.*`, `en.*` | `lt/index.html` и `en/index.html` → `#dynTopic`, `#dynTopicDesc`, `#dynOpening`, `#dynDeadline`, `#dynEvent`, `#dynAboutText`. *(Таймер обратного отсчёта дату из этого поля НЕ берёт — см. раздел 4)* |
| **Nustatymai** | Правила 1–3, политика детей, категории I и II, текст заглушки записи (LT/EN) | `settings/festival` → `lt.rule1..3`, `policyText`, `cat1Age/Desc`, `cat2Age/Desc`, `recordingPlaceholder` (и `en.*`) | `lt/index.html` и `en/index.html` → секции `#terms`, `#categories`, `#screening` |
| **Nustatymai** | Срок ответа после заявки (`#cfgLtResponseTime`, `#cfgEnResponseTime`) | `settings/festival` → `submissionResponseTime.{lt, en}` | Подпись в форме `#submissionResponseTimeValue` на главной + подстановка `{{responseTime}}` в автописьмах |
| **Nustatymai** | Кнопка `Testuoti el. paštą` и поля SMTP (`#cfgSmtpHost`, `#cfgSmtpPass`…) | `/api/admin/smtp-settings` (на Node-сервере); на GitHub Pages блок SMTP скрыт (`d-none`) | Только для отправки писем организаторам/участникам |
| **Albumai** | Вкладки лет (`2026`, `2027`, `+ Pridėti`), заголовок, дата, статус, тема, подзаголовок, история (LT/EN) | `editions/{year}` (и `editions/{year}_en` для EN); поля `title`, `titleEn`, `date`, `dateEn`, `status`, `theme`, `subtitle`, `subtitleEn`, `story`, `storyEn` | Карточки в `#editions` на главных страницах + страницы `lt/azuolynas-fest-2026.html`, `en/azuolynas-fest-2026.html`, `lt/azuolynas-fest-2027.html`, `en/azuolynas-fest-2027.html` *(кроме новых годов: для них нет отдельных HTML-файлов)* |
| **Albumai** | Обложка (`#albumHeroImage`), видео (`#albumVideoUrl`) и список фото (`photos[]` с `url`, `caption`, `captionEn`, `album`) | `editions/{year}` → `heroImage`, `videoUrl`, `photos[]` (сами файлы — в Firebase Storage `archive/...`, либо Base64 внутри документа) | Обложка карточки на главной + видео и фотогалерея с фильтром по категориям на страницах `azuolynas-fest-2026.html` и `azuolynas-fest-2027.html` |
| **Metų leidiniai** | Поля выпуска (`#edYearSelect`, `#edTitle`, `#edDate`, `#edHeroImage`, `#edVideoUrl`, `#edPageUrl` и EN) | `editions/{year}` (те же документы, что и в «Albumai», но без `photos[]`) | Там же, где и «Albumai» |
| **Archyvas** | Видеоархив (`#arcVidTitle`, `#arcVidLabel`, `#arcVidUrl`/`File`) | `settings/festival` → `archiveVideos[]` (файл — в Storage `archive_videos/...`) | Блок `#archiveVideosContainer` в секции `#archive` на `lt/index.html` и `en/index.html` |
| **Archyvas** | Фотоархив (`#arcImgAlbum`, `#arcImgCaption`, `#arcImgUrl`/`File`) | `settings/festival` → `archivePhotos[]` (файл — в Storage `archive_photos/...`) | Блок `#archivePhotosContainer` в секции `#archive` на `lt/index.html` и `en/index.html` |
| **Archyvas** | Фото трофеев / статуэток (`prizesPhotoUrl` через кнопку в карточке призов или настройку) | `settings/festival` → `prizesPhotoUrl` | Картинка `#dynPrizeImg` в секции `#categories` на главных страницах |
| **Paraiškos** | Статус заявки (`submitted`, `accepted`, `semifinal`, `final`, `winner`, `rejected`), галочка `Įtraukti į balsavimą` (`#mInVoting`) | `submissions/{id}` → `status`, `inVoting` | При `inVoting: true` фильм появляется в голосовании на главной (`#competition`), на `voting.html` и в `stream-overlay.html` |
| **Paraiškos / Balsavimas ir Komisija** | Награда (`#mAwardTitle` / `#adminAwardTitle` / `#winnerEditAwardTitle`), место жюри (`juryPlace`), статус `winner` / `isWinner`, кнопка `Atšaukti` | `submissions/{id}` → `isWinner`, `status: 'winner'`, `awardTitle`, `juryPlace`, `awardYear` | Секция `#results` («Laureatai») на `lt/index.html`, `en/index.html` и экран результатов на `voting.html` |
| **Balsavimas ir Komisija** | Оценка жюри (5 ползунков 1–10 + комментарий) | `judge_evaluations/{filmId}_{email}` → `scores`, `averageScore`, `notes` | Видно **только в админке** (средний балл жюри в таблице лидерборда), на публичный сайт не выводится |
| **Eterio grafika (H2H / OBS)** | `Dabar rodoma` (`Now Playing`), `Kitas filmas`, галочка `Rodyti viešai` | `stream_config/broadcast` → `nowPlaying`, `nextFilm`, `isPublicVisible` | Бегущая плашка на `stream-overlay.html` и блок под плеером на `live.html` *(в `live.html` запрашивает `/api/broadcast/overlay`)* |
| **Tiesioginė transliacija** | Статус эфира (`Live`/`Paused`/`Ended`), URL/Stream Key OBS, добавление токена зрителя / учителя | В коде `stream-admin.js` — через серверные `/api/admin/stream/...` (на Node: JSON-файлы и/или Firestore `stream_config`, `stream_tokens`, `live_viewers`) | `live.html` читает `stream_tokens`, `live_viewers` и `settings/festival` |
| **Vartotojai ir Prieiga** | Приглашение пользователя, смена роли/статуса/пароля | Приглашение пишет в `users`, `invitations`, `mail`; редактирование/блокировка/удаление — только через `/api/admin/users/*` | Определяет доступ к `admin.html` (`users`) |

---

## 4. Какие тексты и SEO-данные прописаны прямо в коде и не меняются из админки

Даже если вы измените настройки в админке, следующие части зашиты жёстко в HTML/JS файлах:

1. **Весь SEO-блок во всех HTML-файлах** (поисковики видят именно его, а не данные из Firestore):
   * `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`, `hreflang`.
   * Карточки соцсетей OpenGraph (`og:title`, `og:description`, `og:image`, `og:url`) и Twitter Cards.
   * Структурированные данные **Schema.org JSON-LD** (`Festival`, `Organization`, `WebSite`, `FAQPage`, `BreadcrumbList`).
   * `sitemap.xml` и `robots.txt` (даты `<lastmod>`, список URL).
   * По умолчанию почти везде для `og:image` указано фото статуэток `IMG_3463.jpeg`, а для страниц 2026 года — `ceremonija-2026-03-6612.jpg`.
2. **Таймер обратного отсчёта (`js/countdown.js` и `js/countdown.min.js`)**:
   * Целевая дата **жёстко зашита в коде**: `new Date(2027, 3, 5, 23, 59, 59)` (5 апреля 2027 года, 23:59:59).
   * Если в админке поменять дату дедлайна (`#cfgLtDeadline` / `#cfgEnDeadline`), текст на карточке обновится, а **таймер всё равно будет отсчитывать до 5 апреля 2027 года**.
3. **Шапка сайта, бургер-меню и подвал (`<footer>`)**:
   * Кнопки годов в шапке (`2027`, `2026`), ссылки меню, копирайт, адрес (`Kauno tarptautinė gimnazija`), email (`azuolynasfilmfestival@gmail.com`), Instagram (`@azuolynas.iff`).
4. **Статические тексты внутри главной страницы (`lt/index.html`, `en/index.html`)**:
   * Заголовки и подписи секций (`AISFF`, `EDICIJA 07 • 2026–2027`, `KAUNAS • LIETUVA`, `PARAIŠKOS AKTYVIOS`), 3 шага участия (`01. Nufilmuok`, `02. Pateik paraišką`, `03. Peržiūra ir balsavimas`).
   * Карточка-анонс DUK и памятка сбоку от формы (4 шага и 4 раскрывающихся ответа).
   * Названия полей формы заявки, чекбоксы согласия, кнопки, модальные окна голосования и Instagram-шаринга.
   * Официальный логотип (`azuolynasfilmfest.webp` из старого бакета `azuolynas-film-fest.firebasestorage.app`).
5. **Страницы выпусков 2026 года (`lt/azuolynas-fest-2026.html`, `en/azuolynas-fest-2026.html`, `lt/azuolynas-festival-2026.html`)**:
   * Секция победителей и гостей 2026 года (**«Mūsų pergalės / Our Victories»**: Dominikas Šuškevič — I место, коллектив «Drama club» — III место, участники из Армении, Эстонии, Канады, Кении, Вильнюса, статистика «4 žemynai / 3 šalys / 100% telefonais») прописана прямо в HTML и **из админки не редактируется**.
   * Дополнительно в `lt/index.html` и страницах 2026 года есть специальная защита `isLegacy2026`: если документ `editions/2026` в Firestore не содержит свежего `updatedAt` (>= `2026-11-23T09:00:00Z`) или ссылается на старую дату `balandžio 17` / старые фото `IMG_3458`, код **игнорирует старые поля** и показывает зашитые дату `2026 m. balandžio 30 d.`, тему `What If` и обложку `6612`.
6. **Отдельные страницы `faq.html`, `lt/faq.html`, `en/faq.html`, `privatumo-politika.html`, `naudojimosi-taisykles.html`, `privacy-policy.html`, `terms-of-service.html`** — полностью статический HTML, из админки не меняются.
7. **Шаблоны писем (`email-templates.js`)** и **PDF-бланки (`js/submission-pdf-client.js`, `pdf-generator.js`)** — заголовки, тема года (`Mano pašaukimas` / `My Purpose`), даты (`2027 m. balandžio 27 d.`), адрес школы зашиты прямо в JS-шаблонах.

---

## 5. Какие кнопки и функции не работают, дублируются или не нужны фестивалю

### 5.1. Что НЕ работает (особенно на GitHub Pages, без Node-сервера `server.js`)
* **Управление пользователями в «Vartotojai ir Prieiga» (`js/users.js`)**: просмотр списка из Firestore работает, а вот кнопки **Заблокировать/Разблокировать, Изменить роль/профиль, Удалить пользователя, Отправить сброс пароля и Повторно отправить верификацию** жёстко вызывают `/api/admin/users/*` (Express-сервер) и не имеют запасного варианта через Firestore. На GitHub Pages они выдают ошибку/404/405.
* **Вкладка «Pranešimų žurnalas» (`js/notifications-log.js`)**: читает только `/api/admin/logs`. На GitHub Pages журнал уведомлений всегда пустой (при этом в проекте лежит более новый файл `js/activity-logs.js` с поддержкой Firestore, но он **не подключён**).
* **Вкладка «Tiesioginė transliacija» (`js/stream-admin.js`)**: все кнопки статуса эфира, настроек OBS/Stream Key, создания/редактирования/перевыпуска токенов и таблицы зрителей вызывают `FirebaseClient.request(...)`, который ходит на `/api/admin/stream/*` и `/api/admin/live/viewers`. Без Node-сервера эти действия не сохраняются и не загружают список зрителей.
* **Активация приглашения по ссылке `?invite=...` (`js/auth.js`)**: проверка токена `/api/admin/invite-info` и активация `/api/admin/activate-invite` работают только при наличии Node-сервера.
* **Блок «Dabar eteryje» в `live.html`**: сам плеер и проверка токена на `live.html` умеют ходить напрямую в Firestore REST API, но плашка «Dabar eteryje» (`fetch("/api/broadcast/overlay")`) на GitHub Pages работать не будет (в отличие от `stream-overlay.html`, где чтение `stream_config/broadcast` через Firestore REST API уже сделано).
* **Тумблер `Priežiūros režimas` (`maintenanceMode`) в настройках**: сохраняется в базу, но публичные страницы на него не реагируют (страницу на техработы он не закрывает).
* **Создание нового года в «Albumai» (`+ Pridėti`, например `2028`)**: в Firestore альбом создастся, и на главной карточке он появится, но кнопки «Peržiūra LT / EN» откроют несуществующий URL `/lt/azuolynas-fest-2028.html` (404), пока вручную не создать HTML-файл.
* **Вкладка «Diagnostika» (`js/diagnostics.js`)**: почти все 7 проверок написаны так, что **всегда возвращают `PASS` («ОК»)** даже если запрос упал или Firebase не настроен (ошибки глотаются в `catch`), а верхние карточки метрик и терминал логов просят `/api/admin/diagnostics/*` (на GitHub Pages не работают).
* **Надёжность защиты от накрутки в голосовании**: на GitHub Pages ограничение «1 голос с устройства» на `lt/index.html`, `en/index.html` и `voting.html` держится только на `localStorage` браузера (`festival_voted`). Если открыть инкогнито или очистить кеш, браузер разрешит проголосовать снова.

### 5.2. Мёртвый (неподключённый) код и «хвосты» в проекте
* **`#taskModal` в `admin.html` + `js/tasks.js` + `data/tasks.json`**: модальное окно задач в HTML осталось, а кнопки вкладки «Задачи» и подключения `js/tasks.js` нет.
* **`js/activity-logs.js`** и **`js/test-voting.js`**: файлы написаны, но нигде не импортируются (кнопка `#btnOpenTestVotingModal` и модал `#testVotingModal` отсутствуют).
* **`voting-client.js`** и **`now-playing.js`**: лежат в корне, но ни одна страница их не загружает.
* **`admin.html` вызывает `fetch("/api/admin/token")` после входа** (`js/auth.js`): на GitHub Pages даёт лишнюю ошибку сети, хотя и перехватывается тихо в `catch`.

### 5.3. Что дублируется
* **Три похожих вкладки для контента и фото**:
  1. `Metų leidiniai` (`editions.js`) — правит `editions/{year}` (без фото).
  2. `Albumai` (`albums.js`) — правит тот же `editions/{year}` (плюс `_en` и галерею `photos[]`). Если потом сохранить что-то в `Metų leidiniai`, данные смешаются с тем, что делалось в `Albumai`.
  3. `Archyvas` (`archive.js`) — правит `settings/festival` (`archiveVideos`, `archivePhotos`, `prizesPhotoUrl`), которые показываются на **главной** странице, а **не** на страницах `2026`/`2027`! Организатору легко запутаться, куда загружать фото.
* **Лишние/дублирующие HTML-страницы**:
  * `lt/azuolynas-festival-2026.html` дублирует `lt/azuolynas-fest-2026.html` (и даже упомянута в `sitemap.xml`).
  * `azuolynas-fest-2027.html` в корне дублирует `lt/azuolynas-fest-2027.html`.
  * Юридические страницы дублируются по 2–3 раза: `privacy.html` → `privacy-policy.html` + `lt/privacy-policy.html` → `lt/privatumo-politika.html` + `en/privacy.html` → `en/privacy-policy.html` (и так же с `terms`).
* **Два документа настроек**: `settings.js` сохраняет одно и то же в `settings/festival` и `settings/global`.
* **Два генератора PDF**: `pdf-generator.js` (для Node-сервера) и `js/submission-pdf-client.js` (для браузера на GitHub Pages).

### 5.4. Что, вероятно, избыточно или не нужно школьному фестивалю
* **Телевизионный экспорт H2H (`Tab: Eterio grafika`, `h2h-export.js`)**: формат CasparCG / vMix / H2H Graphic JSON+CSV сделан под профессиональные ТВ-студии. Для школьного зала и OBS хватило бы одной простой плашки в `stream-overlay.html`.
* **Панель «Роли: Бухгалтер (Sąskaitos & Finansai)»**: фестиваль бесплатный (`Offers: 0 EUR`), роль бухгалтера для счетов не нужна.
* **Псевдо-QR генератор (`qr-code.js`)**: если не подключена внешняя библиотека `window.QRCode` (а в проекте её нет!), функция рисует на `<canvas>` **декоративную псевдо-матрицу** на основе `Math.sin(hash...)`, которую **невозможно отсканировать телефоном как настоящий QR-код**.

---

## 6. Почему на GitHub Pages часть данных или картинок может не показываться

GitHub Pages — это **только статические файлы** (HTML/CSS/JS), там нет Node.js (`server.js`). Из-за этого возникают следующие причины пропажи данных и картинок:

### 6.1. Почему не загружаются или не сохраняются картинки
1. **Загрузка новых фото на GitHub Pages в «Albumai» падает в Base64 внутри Firestore**:
   * Сначала `albums.js` пытается загрузить файл в Firebase Storage (`filmfest-509606.firebasestorage.app`).
   * **Если загрузка в Storage падает** (например, из-за CORS, App Check, блокировки домена `www.azuolynasfilmfestival.lt` в настройках Firebase, или прав в `storage.rules`), `albums.js` пытается отправить фото на `/api/admin/albums/upload` — **на GitHub Pages там ошибка 405/404**.
   * Тогда срабатывает запасной вариант №3: фото сжимается и сохраняется как длинная текстовая строка `data:image/jpeg;base64,...` прямо внутри документа `editions/{year}`. Но **лимит одного документа Firestore — 1 МБ** (`~950 КБ` в коде): при загрузке нескольких фотографий документ переполняется, сохранение падает, и фото на сайте не появляются.
2. **Скрытая ошибка в `storage.rules` (именованная БД vs `(default)`)**:
   * В файле `storage.rules` проверка админа написана так:
     `firestore.exists(/databases/(default)/documents/users/$(request.auth.uid))`
   * Но все пользователи админки хранятся не в `(default)`, а в базе `ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83`!
   * Пока вы заходите под `azuolynasfilmfestival@gmail.com` или `karina.brdar@gmail.com`, в папках `archive/`, `archive_photos/`, `archive_videos/` правило пускает по email (`isTopAdmin`) или `isSignedIn()`. Но если зайдёт другой админ/редактор из `users` и попытается загрузить постер в `movies/` или `posters/`, Storage откажет ему в доступе.
3. **Картинки раскиданы по трём разным местам**:
   * **Старый бакет Firebase Storage** `azuolynas-film-fest.firebasestorage.app` (логотип `azuolynasfilmfest.webp`, фото `IMG_3458.jpeg`, `IMG_3459.jpeg`, `IMG_3462.jpeg`, `IMG_3463.jpeg`).
   * **Новый бакет Firebase Storage** `filmfest-509606.firebasestorage.app` (сюда грузит админка).
   * **Внешний бесплатный фотохостинг `https://i.postimg.cc/...`** (7 фотографий 2026 года). Если `postimg.cc` ограничит хотлинкинг, удалит файл или будет заблокирован сетью школы/провайдером, эти фото перестанут открываться.
4. **Путаница между «Archyvas» и «Albumai»**:
   * Фото, загруженные во вкладке «Archyvas», попадают только в нижнюю галерею на **главной** странице (`lt/index.html`, `en/index.html`), но **не** на страницы `azuolynas-fest-2026.html` / `2027.html` — и наоборот.

### 6.2. Почему не показывается часть данных на сайте и в админке
1. **Серверные маршруты `/api/*` на GitHub Pages не работают (HTTP 404 / 405)**:
   * На статическом хостинге не работают вкладка **Tiesioginė transliacija (`js/stream-admin.js`)**, **Pranešimų žurnalas (`js/notifications-log.js`)**, действия над пользователями в **Vartotojai ir Prieiga (`js/users.js`)**, отправка SMTP без Trigger Email, а также плашка «Dabar eteryje» внутри `live.html`.
2. **Публичные правила Firestore (`firestore.rules`) скрывают обычные заявки**:
   * Посетитель сайта видит фильмы из `submissions` **только** если у фильма стоит `inVoting == true` или `isWinner == true`. Если модератор поставил статус `accepted` или `final`, но забыл включить галочку/тумблер `inVoting`, фильм не появится в программе голосования.
3. **Задержка ленивой загрузки Firebase (`firebase-public-lazy.js`)**:
   * На публичных страницах Firebase специально не грузится при старте, а ждёт ~1.2–1.6 сек, прокрутки или клика. Если нажать кнопку или проверить страницу в первую секунду при медленном интернете, сначала видны только стартовые заглушки из HTML и `data/editions.json`.
4. **Переключатели видимости в админке и фильтр `isLegacy2026`**:
   * Если в настройках снята галочка (`showResults: false`, `showVoting: false`, `showArchive: false`), секция скрыта.
   * А правило `isLegacy2026` может подменить часть полей выпуска 2026 жёстко прописанными текстами, если у документа в базе старая дата `updatedAt`.
5. **Рассинхронизация `.js` и `.min.js` / кеш браузера**:
   * Публичные страницы подключают `.min.js` и `.min.css` файлы (`config.min.js`, `style.min.css` и др.). Если отредактировать обычный `.js`/`.css` и забыть запустить `npm run build`, на GitHub Pages продолжит работать старая минифицированная версия.

---

### Что нельзя проверить только по коду репозитория (нужно смотреть в консолях сервисов)
1. **Authorized Domains в Firebase Authentication**: добавлен ли домен `www.azuolynasfilmfestival.lt` (и `azuolynasfilmfestival.lt`) в разрешённые домены в Firebase Console (иначе вход через Google в `admin.html` на боевом домене не откроется).
2. **Развёрнуты ли в облаке актуальные `firestore.rules` и `storage.rules`**: файлы в репозитории не гарантируют, что команда `firebase deploy --only firestore:rules,storage` реально выполнена в проекте `filmfest-509606`.
3. **Настройки CORS в бакете `filmfest-509606.firebasestorage.app`** и доступность старого бакета `azuolynas-film-fest.firebasestorage.app` (могут ли оба бакета отдавать файлы для `www.azuolynasfilmfestival.lt`, и не закончились ли токены/права).
4. **Расширение Trigger Email (`firestore-send-email`) и Cloud Function `sendUserInvitationEmail`**: в репозитории их серверного кода нет — нельзя проверить, установлены ли они в Firebase и настроены ли там пароли SMTP (уходят ли письма с GitHub Pages через коллекцию `mail`).
5. **Настройки Cloudflare Worker (`stream-worker.js`) и Cloudflare Stream**: развёрнут ли воркер и верны ли секреты `CLOUDFLARE_STREAM_*` в Cloudflare Dashboard.
6. **Текущая доступность 7 ссылок на `i.postimg.cc`** и настройки DNS/HTTPS для `www.azuolynasfilmfestival.lt` в GitHub Pages.
