import config from '../src/config';
import supertest from 'supertest';
import { createConnection, getConnection, getConnectionOptions } from 'typeorm';

// Only run tests if we've specifically set NODE_ENV to testing
if (config.get('env') !== 'test') {
  throw new Error('NODE_ENV not set');
}

// This starts the app up
import { default as App } from './../src/app';
const app = new App().app;
const request = supertest(app);

let migrations;

const options = {
  contentType: 'application/json; charset=utf-8',
  accept: 'application/json',
};

const fakeUser = {
  firstName: 'fakeFN',
  lastName: 'fakeLN',
  username: 'fakeUS',
  email: 'fake@example.com',
  password: 'fake1234',
};

const testUser = {
  firstName: 'TestFirstName',
  lastName: 'TestLastName',
  username: 'TestUsername',
  email: 'TestEmail@example.com',
  password: 'TestPassword',
};

beforeAll(async () => {
  const connectionOptions = await getConnectionOptions(config.get('env'));
  const connection = await createConnection({
    ...connectionOptions,
    name: 'default',
  });
  migrations = await connection.runMigrations();

  await request
      .post('/api/v1/user/signup')
      .set('Accept', options.accept)
      .send(fakeUser);
});

afterAll(async () => {
  const connection = await getConnection();

  for (const m of migrations) {
    await connection.undoLastMigration();
  }

  await connection.close();
});

/////////////
// General //
/////////////

describe('/', () => {
  it('GET /', async (done) => {
    request
      .get('/')
      .expect(200, done);
  });
});
///////////////
// Functions //
///////////////
const keyInResponse = (res, key) => {
  if (!(key in res.body)) throw new Error(`missing ${ key } key`);
};

//////////
// User //
//////////

describe('/user', () => {

  let accessToken;
  let refreshToken;
  let passwordResetToken;

  beforeEach(async () => {
    const response = await request
      .post('/api/v1/user/authenticate')
      .set('Accept', options.accept)
      .send({
        username: fakeUser.username,
        password: fakeUser.password,
      });

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('POST /signup', async () => {
    const signUpForm = { ...testUser };

    await request
      .post('/api/v1/user/signup')
      .send(signUpForm)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });

  it('POST /authenticate', async () => {
    const authForm = {
      username: testUser.username,
      password: testUser.password,
    };

    const hasAccessTokenAndRefresh = (res) => {
      keyInResponse(res, 'accessToken');
      keyInResponse(res, 'refreshToken');
    };

    const response = await request
      .post('/api/v1/user/authenticate')
      .send(authForm)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(hasAccessTokenAndRefresh)
      .expect(200);
  });

  it('POST /authenticate (invalid credentials)', async () => {
    const authForm = {
      username: '_*InvalidUsername*_',
      password: '_*InvalidPassword*_',
    };

    await request
      .post('/api/v1/user/authenticate')
      .send(authForm)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(400);
  });

  it('POST /refreshAccessToken', async () => {
    const refreshAccessTokenForm = {
      refreshToken,
      username: fakeUser.username,
    };

    const hasAccessTokenAndRefresh = (res) => {
      keyInResponse(res, 'accessToken');
      keyInResponse(res, 'refreshToken');
    };

    await request
      .post('/api/v1/user/refreshAccessToken')
      .send(refreshAccessTokenForm)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(hasAccessTokenAndRefresh)
      .expect(200);
  });

  it('POST /invalidateRefreshToken', async () => {
    const form = {
      refreshToken,
      username: fakeUser.username,
    };

    await request
      .post('/api/v1/user/invalidateRefreshToken')
      .send(form)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });

  it('POST /invalidateAllRefreshTokens', async () => {
    const form = {
      username: fakeUser.username,
    };

    await request
      .post('/api/v1/user/invalidateAllRefreshTokens')
      .send(form)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });

  it('POST /forgot', async () => {
    const forgotForm = {
      email: testUser.email,
    };

    const hasFields = (res) => {
      keyInResponse(res, 'passwordResetToken');
    };

    const response = await request
      .post('/api/v1/user/forgot')
      .send(forgotForm)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(hasFields)
      .expect(200);

    passwordResetToken = response.body.passwordResetToken;
  });

  it('POST /checkPasswordResetToken', async () => {
    const form = {
      passwordResetToken,
      email: testUser.email,
    };

    await request
      .post('/api/v1/user/checkPasswordResetToken')
      .send(form)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });

  it('POST /resetPassword', async () => {
    const form = {
      passwordResetToken,
      email: 'TestEmail@example.com',
      password: 'TestPassword',
    };

    await request
      .post('/api/v1/user/resetPassword')
      .send(form)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });

  it('POST /private', async () => {
    await request
      .post('/api/v1/user/private')
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });
});

///////////
// Notes //
///////////

describe('/note', () => {
  type NoteUnit = {
    title: string,
    content: string,
    id?: number,
  };

  const noteUnit: NoteUnit = {
    title: 'Here is my first note',
    content: 'Here is my main content.',
  };

  let accessToken;
  let refreshToken;

  beforeEach(async () => {
    const response = await request
      .post('/api/v1/user/authenticate')
      .set('Accept', options.accept)
      .send({
        username: fakeUser.username,
        password: fakeUser.password,
      });

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('POST / (create)', async () => {
    const response = await request
      .post('/api/v1/notes')
      .send(noteUnit)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);

    noteUnit.id = response.body.id;
  });

  it('GET /:id (show one unit)', async () => {
    expect.assertions(3);

    const response = await request
      .get(`/api/v1/notes/${ noteUnit.id }`)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);

    const body = response.body;
    expect(body.id).toBe(noteUnit.id);
    expect(body.title).toBe(noteUnit.title);
    expect(body.content).toBe(noteUnit.content);
  });

  it('GET / (list)', async () => {
    expect.assertions(3);

    const query = {
      sort: '',
      order: 'desc',
      page: 0,
      limit: 20,
    };

    const response = await request
      .get('/api/v1/notes/')
      .query(query)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);

    const note = response.body[0];
    expect(note.id).toBe(noteUnit.id);
    expect(note.title).toBe(noteUnit.title);
    expect(note.content).toBe(noteUnit.content);
  });

  it('PUT /:id (update)', async () => {
    const form = {
      title: 'UPDATE - Here is my first note',
      content: 'UPDATE - Here is my main content.',
    };

    await request
      .put(`/api/v1/notes/${ noteUnit.id }`)
      .send(form)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);

    Object.assign(noteUnit, form);
  });

  it('DELETE /:id', async () => {
    await request
      .delete(`/api/v1/notes/${ noteUnit.id }`)
      .set('Authorization', `Bearer ${ accessToken }`)
      .set('Accept', options.accept)
      .expect('Content-Type', options.contentType)
      .expect(200);
  });
});
