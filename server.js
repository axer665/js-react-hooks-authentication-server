const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const passport = require('koa-passport');
const { Strategy } = require('passport-http-bearer');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const faker = require('faker');

const app = new Koa();
app.use(cors());
app.use(koaBody());

const tokens = new Map();
const users = new Map();
const rounds = 10;

users.set('vasya', {
  id: uuid.v4(),
  login: 'vasya',
  name: 'Vasya',
  password: bcrypt.hashSync('password', rounds),
  avatar: 'https://i.pravatar.cc/40'

  
});

/* console.log('vasya:', users.get('vasya'))
const paswd = 'aj123__ULsd?!--=__?';
const hash = bcrypt.hashSync(paswd, rounds);
console.log('hash: ', hash);

const check = bcrypt.compareSync(paswd, hash)
console.log('check: ', check) */


const news = [
  {
    id: uuid.v4(),
    title: faker.lorem.words(),
    image: 'https://loremflickr.com/640/480?lock=1234',
    content: faker.lorem.paragraph(),
  },
  {
    id: uuid.v4(),
    title: faker.lorem.words(),
    image: 'https://loremflickr.com/640/480?lock=1235',
    content: faker.lorem.paragraph(),
  },
  {
    id: uuid.v4(),
    title: faker.lorem.words(),
    image: 'https://loremflickr.com/640/480?lock=1236',
    content: faker.lorem.paragraph(),
  },
  {
    id: uuid.v4(),
    title: faker.lorem.words(),
    image: 'https://loremflickr.com/640/480?lock=1237',
    content: faker.lorem.paragraph(),
  },
];

passport.use(new Strategy((token, callback) => {
  const user = tokens.get(token);
  if (user === undefined) {
    return callback(null, false);
  }

  return callback(null, user);
}));
const bearerAuth = passport.authenticate('bearer', { session: false });

const router = new Router();
router.post('/auth', async (ctx, next) => {
  const { login, password } = ctx.request.body;

  const user = users.get(login);
  if (user === undefined) {
    ctx.response.status = 400;
    ctx.response.body = { message: 'Пользователь не найден' };
    return;
  }

  const result = await bcrypt.compare(password, user.password);
  if (result === false) {
    ctx.response.status = 400;
    ctx.response.body = { message: 'Неверный пароль' };
    return;
  }

  const token = uuid.v4();
  tokens.set(token, user);
  ctx.response.body = { token };
});

router.use('/private**', bearerAuth);

router.get('/private/me', async (ctx, next) => {
  const { user } = ctx.state;
  ctx.response.body = { id: user.id, login: user.login, name: user.name, avatar: user.avatar };
});

router.get('/private/news', async (ctx, next) => {
  ctx.response.body = news;
});

router.get('/private/news/:id', async (ctx, next) => {
  const [item] = news.filter(o => o.id === ctx.params.id);
  if (item === undefined) {
      ctx.response.status = 404;
      ctx.response.body = { message: 'not found' };
      return;
  }
  ctx.response.body = item; 
});

router.get('/', async (ctx) => {
  ctx.response.body = 'Сервер работает';
});

app.use(router.routes())
app.use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
server.listen(port, () => console.log(`The server started on port ${port}`));
