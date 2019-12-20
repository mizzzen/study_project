## Установка Docker и Docker-compose
### Docker
Так как мы используем **docker-compose** нам нужен **docker**. Docker-compose без него не работает :)\
\
Устанавливаем необходимые пакеты, которые позволяют apt использовать пакеты по HTTPS:
```bash
$ sudo apt install apt-transport-https ca-certificates curl software-properties-common
```

Затем добавляем в свою систему ключ GPG официального репозитория Docker:
```bash
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

Добавляем репозиторий Docker в список источников пакетов APT:
```bash
$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
```

Затем обновим базу данных пакетов информацией о пакетах Docker из вновь добавленного репозитория:
```bash
$ sudo apt update
```

Следует убедиться, что мы устанавливаем Docker из репозитория Docker, а не из репозитория по умолчанию Ubuntu:
```bash
$ apt-cache policy docker-ce
```

Вывод получится приблизительно следующий. Номер версии Docker может быть иным:
```bash
$ docker-ce:
    Installed: (none)
    Candidate: 18.03.1~ce~3-0~ubuntu
    Version table:
       18.03.1~ce~3-0~ubuntu 500
          500 https://download.docker.com/linux/ubuntu bionic/stable amd64 Packages
```

Далее устанавливаем Docker:
```bash
$ sudo apt install docker-ce
```

Теперь Docker установлен, демон запущен, и процесс будет запускаться при загрузке системы.  Убедимся, что процесс запущен:
```bash
$ sudo systemctl status docker
```

Вывод должен быть похож на представленный ниже, сервис должен быть запущен и активен (Выход из systemctl нажимаем **Ctrl + C**):
```bash
Output
● docker.service - Docker Application Container Engine
   Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
   Active: active (running) since Thu 2018-07-05 15:08:39 UTC; 2min 55s ago
     Docs: https://docs.docker.com
 Main PID: 10096 (dockerd)
    Tasks: 16
   CGroup: /system.slice/docker.service
           ├─10096 /usr/bin/dockerd -H fd://
           └─10113 docker-containerd --config /var/run/docker/containerd/containerd.toml
```

#### Использование команды Docker без sudo 
Чтобы не вводить sudo каждый раз при запуске команды docker, добавьте имя своего пользователя в группу docker:
```bash
$ sudo usermod -aG docker ${USER}
```

Для применения этих изменений в составе группы необходимо разлогиниться и снова залогиниться на сервере или задать следующую команду:
```bash
$ su - ${USER}
```
Для продолжения работы необходимо ввести пароль пользователя. \
\
Убедиться, что пользователь добавлен в группу docker можно следующим образом:
```bash
$ id -nG
```
```bash
Output
sammy sudo docker (docker то что нам нужно)
```
### Docker-compose
Загрузите двоичный файл Docker Compose в каталог /usr/local/bin с помощью следующей команды curl:
```bash
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

После завершения загрузки примените исполняемые разрешения к двоичному файлу Compose.:
```bash
$ sudo chmod +x /usr/local/bin/docker-compose
```

Также даем доступ вызова без **sudo**
```bash
$ sudo chown $USER:docker /var/run/docker.sock
```

Проверьте установку, выполнив следующую команду, которая покажет версию Compose:
```bash
$ docker-compose --version
```

Вывод будет выглядеть примерно так:
```bash
Output
docker-compose version 1.23.1, build b02f1306
```

## Установка NodeJs
Для загрузки установочного скрипта nvm со страницы проекта на GitHub можно использовать curl:
```bash
$ curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh -o install_nvm.sh
```

Запустите скрипт в bash:
```bash
$ bash install_nvm.sh
```

Для получения доступа к функционалу nvm, вам необходимо перелогиниться в системе, либо вы можете использовать команду source для того, чтобы применить изменения не прерывая текущую сессию:
```bash
$ source ~/.profile
```

Теперь, когда nvm установлен, вы можете устанавливать изолированные версии Node.js. Чтобы узнать, какие версии Node.js доступны для установки, наберите:
```bash
$ nvm ls-remote
```
```bash
Вывод
...
         v8.11.1   (Latest LTS: Carbon)
         v9.0.0
         v9.1.0
         v9.2.0
         v9.2.1
         v9.3.0
         v9.4.0
         v9.5.0
         v9.6.0
         v9.6.1
         v9.7.0
         v9.7.1
         v9.8.0
         v9.9.0
         v9.10.0
         v9.10.1
         v9.11.0
         v9.11.1
         v10.0.0 
         ... там их очень много :)
```
Нам нужен не ниже **v8.17.0**\
Установить ее можно при помощи следующей команды:
```bash
$ nvm install 8.17.0
```

Обычно nvm переключается на использование последней установленной версии. Вы можете указать nvm использовать только что загруженную версию в явном виде следующим образом:
```bash
$ nvm use 8.17.0
```

Если вы устанавливаете Node.js через nvm, исполняемый файл будет иметь имя node. Посмотреть, какую версию в данный момент использует shell, можно при помощи команды:
```bash
$ node -v
```
```bash
Вывод
v10.18.0
```
## Установка зависимостей
Все команды выолнены в терминале(**Ctrl + Alt + T**) находясь в корне проекта\
\
Устанавливаем все пакеты:
```bash
$ npm install
```
Некоторые лучше установить глобально:
```bash
$ sudo npm i -g typescript typeorm
```

Копируем или перейменовуем файл [`example.env`](example.env) в `.env`\
Устанвливаем значения:
```bash
// Просто название приложение
APP_NAME=study-project
// Почта тут укажи любую(так как сервис платный письма не отправляем)
APP_EMAIL=

// Тут оставляем без изменений настройки Mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=docker
DB_DATABASE=api_notes

// Тут так же без изменений
MYSQL_ROOT_PASSWORD=docker
MYSQL_DATABASE=api_notes

// Тут тоже))
REDIS_HOST=localhost
REDIS_PORT=6379

// Это наша среда так на сервер не заливаем оставляем
NODE_ENV=development
// Это порт нашего приложения можно менять как хочешь потом будет доступно по адресу\
`http://localhost:PORT`
PORT=4000

// Это наш ключ для шифрования, тут что угодно
JWT_SECRET=
// Время жизни нашего токена через полчаса нужно заново логинится
JWT_ACCESS_TOKEN_EXPIRATION_TIME=30m
```
\
Теперь мы готовы к запуску
## Запуск
Поднимаем Mysql, Redis, Adminer это делает docker-compose\
Открываем терминал в корне папки и пишем:
```bash
$ docker-compose up -d
```

Для выключения наших сервисов(там же где и писали прошлую команду):
```bash
$ docker-compose down
```

Админка к базе достпна по адресу [http://localhost:8080](http://localhost:8080)\
Для логина пишем:
```bash
Движок -> MySQL
Сервер -> mysql
(Все что далее мы устанавливали выше, файл .env Но если что меняли тогда и тут тоже)
Имя пользователя -> root
Пароль -> docker 
База данных -> api_notes (Можно оставить пустым но мы используем базу api_notes, почему бы и не написать)
```
Нужно запустить миграции(создание таблиц и т.д.):
```bash
$ npm run migration:run
```
Можем зайти [http://localhost:8080](http://localhost:8080) и проверить

Теперь старт сервера локально.\
Открываем новый терминал.
Включаем watcher, как только файлы изменяться они автоматом скомпилируються из TypeScript в JavaScript\
```bash
$ npm run tsc:watch
```
Либо компилируем один раз:
```bash
$ npm run build
```
Включили, свернули терминал и забыли про него.\
Далее запускаем сервер:
```bash
// Запускаем сервер без авто перезапуска при краше или ошибке
$ npm run dev

// Или же с авто перезапуском, при какой либо ошибке автоматически перезапуститься после малейших изменений файлов
$ npm run dev:watch
```
После чего увидим:
```bash
Server running at 4000
Running in development v1.0.0
Link http://localhost:4000
```
Если порт меняли то увидим другой и другую ссылку.\
Переходим по ссылке [http://localhost:4000](http://localhost:4000) и видим в браузере:
```bash
{"message":"Hi there 1.0.0"}
```

А в терменале где запускали сервер:\
Либо в файле логов `logs/main.log`
```bash
[2019-12-15T01:23:51.121] [INFO] development - GET / 200
[2019-12-15T01:23:51.318] [INFO] development - GET /favicon.ico 404
```
### Теперь готовы к разработке
Все что мы меняем или добовляем находится в папке [`src`](src).\

#### Добавление новой таблици
Документация [TypeORM](https://typeorm.io/#/)\
\
Создаем миграцию:
```bash
$ typeorm migration:create -n [НАЗВАНИЕ]

Пример
$ typeorm migration:create -n PostRefactoring
```
В папке [`src/db/migrations`](src/db/migrations) появится файл по типу `1570438732306-[НАЗВАНИЕ].ts`.\
В методе `public async up(queryRunner: QueryRunner): Promise<any>` пишем как создать таблицу.\
В методе `public async down(queryRunner: QueryRunner): Promise<any>` пишем как удалить таблицу.\
\
Смотрим как делал я там три примера.\
После чего запускаем миграцию:
```bash
$ npm run migration:run
```
Ничего плохого не произойдет, а создаться только новая таблица :)\
Все можем проверить здесь [http://localhost:8080](http://localhost:8080)\
\
Потом создаем модель таблици подробное описание в документации **раздел Entity**(я все не смогу рассказать физически):
```bash
$ typeorm entity:create -n [Название Модели]

Пример
$ typeorm entity:create -n User
```
В папке [`src/entities`](src/entities) появится файл по типу `[Название Модели].ts`.\
Пишем по примеру, опять же их 3.
#### Добавление новых ENDPOINTS(конечных точек) API
Приложение написано по принципу REST API или подобии на него\
POST,PUT,DELETE,... запросы.\
Все это удобно делать с [Postman](https://www.getpostman.com/). Так как у нас нет UI.

Попробуй отправить POST запрос на адрес http://localhost:4000/api/v1/user/signup
вот такой json и посмотри что получишь в ответ(это регестрация):
```json
{
  "firstName": "Lada",
  "lastName": "Kalina",
  "username": "newUser",
  "email": "test@example.com",
  "password": "qwerty1234"
}
```

В папке [`src/routes`](src/routes) создаем свой файл `[название].ts`\
Смело вставляем этот отрезок:
```typescript
import { Router, Response, Request, NextFunction } from 'express';
import jwt from '../middleware/jwt';
import config from '../config';
// Подключаем наш контроллер
import NoteController from '../controllers/NoteController';

const route = Router();

// Создаем екземпляр контроллера
const noteCtrl = new NoteController();

const jwtMiddleware = jwt({ secret: config.get('jwt.secret') });

export default (app: Router) => {

    app.use('/api/v1/[НАЗВАНИЕ ВАШЕГО ЕНДПОИНТА]', route);  

    // Далее пишем все сюда

};
```

Это путь по которому мы можем достучаться к этим функциям:
```js
app.use('/api/v1/[НАЗВАНИЕ ВАШЕГО ЕНДПОИНТА]', route);
```
Тоесть например: `http://localhost:4000/api/v1/node`


Вот этот отрезок:
```typescript
route.post(
    '/',
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      noteCtrl.create(req, res);
    });
```
Запрос типа **POST** и нужно слать такого типа на адрес.\
`'/'` означает адрес `http://localhost:4000/api/v1/node/`, было бы `'/test'` тогда `http://localhost:4000/api/v1/node/test`.\
`req` и `res` это объекты запроса и ответа соответсвенно.