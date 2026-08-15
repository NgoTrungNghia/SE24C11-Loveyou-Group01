const request = require('supertest');
const prisma = require('../src/utils/prismaClient');
const app = require('../src/app');
const {
  cleanupAuthData,
  getLastOtp,
  failNextDelivery,
  resetMailState,
  sentMails,
  uniqueEmail,
} = require('./helpers/authOtpReset');

jest.setTimeout(60000);

describe('Password Reset OTP', () => {
  beforeEach(async () => {
    await cleanupAuthData();
  });

  afterAll(async () => {
    await cleanupAuthData();
    await prisma.$disconnect();
  });

  async function createUser(overrides = {}) {
    const email = overrides.email || uniqueEmail('reset');
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: overrides.username || `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        email,
        password: overrides.password || 'secret12',
      });
    expect(res.status).toBe(201);
    return { email, password: overrides.password || 'secret12', user: res.body.data.user };
  }

  describe('User Story 1 - request OTP', () => {
    test('registered email receives OTP by mail without exposing the code', async () => {
      const { email } = await createUser();

      const res = await request(app).post('/api/auth/forgot-password').send({ email });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: { message: 'A reset code was sent to your email' },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/\b\d{6}\b/);
      expect(res.body.data.resetToken).toBeUndefined();
      expect(sentMails).toHaveLength(1);
      expect(getLastOtp()).toMatch(/^\d{6}$/);
    });

    test('unregistered email is rejected and sends no mail', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: uniqueEmail('unknown') });

      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({
        message: 'No account is registered with this email.',
        code: 'EMAIL_NOT_REGISTERED',
      });
      expect(sentMails).toHaveLength(0);
    });

    test('fourth request within an hour is limited and sends no extra mail', async () => {
      const { email } = await createUser();

      for (let i = 0; i < 3; i += 1) {
        const ok = await request(app).post('/api/auth/forgot-password').send({ email });
        expect(ok.status).toBe(200);
      }
      const mailCountAfterThree = sentMails.length;

      const limited = await request(app).post('/api/auth/forgot-password').send({ email });
      expect(limited.status).toBe(200);
      expect(limited.body.data.message).toBe('A reset code was sent to your email');
      expect(sentMails).toHaveLength(mailCountAfterThree);
    });

    test('SMTP failure returns generic delivery error and still counts toward limit', async () => {
      const { email } = await createUser();
      failNextDelivery();

      const failed = await request(app).post('/api/auth/forgot-password').send({ email });
      expect(failed.status).toBe(503);
      expect(failed.body.error.code).toBe('EMAIL_DELIVERY_FAILED');
      expect(JSON.stringify(failed.body)).not.toMatch(/SMTP|password|otp/i);

      resetMailState();
      for (let i = 0; i < 2; i += 1) {
        const ok = await request(app).post('/api/auth/forgot-password').send({ email });
        expect(ok.status).toBe(200);
      }

      const limited = await request(app).post('/api/auth/forgot-password').send({ email });
      expect(limited.status).toBe(200);
      expect(sentMails).toHaveLength(2);
    });
  });

  describe('User Story 2 - verify OTP', () => {
    test('correct OTP returns a ten-minute reset authorization', async () => {
      const { email } = await createUser();
      await request(app).post('/api/auth/forgot-password').send({ email });
      const otp = getLastOtp();

      const res = await request(app).post('/api/auth/verify-otp').send({ email, otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toEqual(expect.any(String));
      expect(res.body.data.expiresAt).toBeDefined();
      const expiresAt = new Date(res.body.data.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now());
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000 + 1000);
      expect(JSON.stringify(res.body)).not.toMatch(new RegExp(`\\b${otp}\\b`));
    });

    test('wrong, unknown, and exhausted codes share one generic failure', async () => {
      const { email } = await createUser();
      await request(app).post('/api/auth/forgot-password').send({ email });
      const otp = getLastOtp();

      const wrong = await request(app).post('/api/auth/verify-otp').send({ email, otp: '000000' });
      const unknown = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: uniqueEmail('nope'), otp: '123456' });

      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(wrong.body.error).toEqual({ message: 'Invalid or expired code', code: 'INVALID_OTP' });
      expect(unknown.body.error).toEqual(wrong.body.error);
      expect(wrong.body.data).toBeUndefined();

      for (let i = 0; i < 4; i += 1) {
        await request(app).post('/api/auth/verify-otp').send({ email, otp: '111111' });
      }
      const exhausted = await request(app).post('/api/auth/verify-otp').send({ email, otp });
      expect(exhausted.status).toBe(401);
      expect(exhausted.body.error.code).toBe('INVALID_OTP');
    });

    test('expired OTP cannot be verified', async () => {
      const { email } = await createUser();
      await request(app).post('/api/auth/forgot-password').send({ email });
      const otp = getLastOtp();

      await prisma.passwordResetToken.updateMany({
        data: { otpExpiresAt: new Date(Date.now() - 1000) },
      });

      const res = await request(app).post('/api/auth/verify-otp').send({ email, otp });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_OTP');
    });
  });

  describe('User Story 3 - reset password', () => {
    async function verifiedReset(email) {
      await request(app).post('/api/auth/forgot-password').send({ email });
      const otp = getLastOtp();
      const verified = await request(app).post('/api/auth/verify-otp').send({ email, otp });
      expect(verified.status).toBe(200);
      return verified.body.data.resetToken;
    }

    test('valid authorization updates password and invalidates recovery credentials', async () => {
      const { email } = await createUser({ password: 'oldpass1' });
      const resetToken = await verifiedReset(email);

      const reset = await request(app)
        .post('/api/auth/reset-password')
        .send({ resetToken, newPassword: 'newpass1' });
      expect(reset.status).toBe(200);
      expect(reset.body.data.message).toBe('Password updated');

      const loginNew = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'newpass1' });
      expect(loginNew.status).toBe(200);

      const reuseToken = await request(app)
        .post('/api/auth/reset-password')
        .send({ resetToken, newPassword: 'another1' });
      expect(reuseToken.status).toBe(401);
      expect(reuseToken.body.error.code).toBe('INVALID_TOKEN');

      const leftover = await prisma.passwordResetToken.count();
      expect(leftover).toBe(0);
    });

    test('expired authorization leaves password unchanged', async () => {
      const { email, password } = await createUser({ password: 'keepme12' });
      const resetToken = await verifiedReset(email);

      await prisma.passwordResetToken.updateMany({
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const failed = await request(app)
        .post('/api/auth/reset-password')
        .send({ resetToken, newPassword: 'changed1' });
      expect(failed.status).toBe(401);

      const loginOld = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginOld.status).toBe(200);
    });
  });
});
