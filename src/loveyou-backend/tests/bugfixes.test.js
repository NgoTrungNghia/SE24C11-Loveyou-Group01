const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prismaClient');
const geminiService = require('../src/services/geminiService');
const { hashPassword } = require('../src/utils/password');

jest.setTimeout(30000);

describe('Verification of Bug Fixes (BUG-01, BUG-02, BUG-05, BUG-21)', () => {
  let testUser;
  const timestamp = Date.now();
  const username = `buguser_${timestamp}`;
  const email = `buguser_${timestamp}@example.com`;
  const rawPassword = 'password123';

  beforeAll(async () => {
    const passwordHash = await hashPassword(rawPassword);
    testUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName: 'Bug Test User',
        status: 'ACTIVE',
        role: 'USER',
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: testUser.userId } });
      await prisma.user.deleteMany({ where: { userId: testUser.userId } });
    }
    await prisma.$disconnect();
  });

  test('BUG-01: Forgot password for unregistered email returns generic 200 to prevent enumeration', async () => {
    const nonExistentEmail = `unregistered_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: nonExistentEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('A reset code was sent to your email');
  });

  test('BUG-05: Login with valid username returns 200 and access token', async () => {
    // 1. Login with username in the email field
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: username, password: rawPassword });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.token).toBeDefined();

    // 2. Login with username in the username field
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ username: username, password: rawPassword });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.token).toBeDefined();

    // 3. Login with email
    const res3 = await request(app)
      .post('/api/auth/login')
      .send({ email: email, password: rawPassword });

    expect(res3.status).toBe(200);
    expect(res3.body.success).toBe(true);
    expect(res3.body.data.token).toBeDefined();
  });

  test('BUG-21: detectRedFlags returns explicit degraded mode when Gemini key is invalid/unavailable', async () => {
    // Save original API key
    const originalKey = await geminiService.getGeminiApiKey();
    try {
      // Set an invalid API key to simulate unavailability
      await geminiService.setGeminiApiKey('INVALID_KEY_FOR_TESTING');
      const messages = [
        { senderName: 'Alice', content: 'Chào bạn, chuyển cho mình 500k gấp với!' },
      ];
      const result = await geminiService.detectRedFlags(messages, 'Bob', 'Alice');

      expect(result.aiPowered).toBe(false);
      expect(result.isDegraded).toBe(true);
      expect(result.riskLevel).toBe('UNKNOWN');
      expect(result.safetyScore).toBeNull();
      expect(result.summary).toContain('không khả dụng');
    } finally {
      // Restore original API key
      if (originalKey) {
        await geminiService.setGeminiApiKey(originalKey);
      }
    }
  });
});
