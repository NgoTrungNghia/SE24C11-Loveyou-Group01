const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prismaClient');
const bcrypt = require('bcrypt');

jest.setTimeout(30000);

describe('Verification API: Email OTP & Citizen CCCD Verification', () => {
  let userToken;
  let testUserId;
  const testEmail = `verify_test_${Date.now()}@example.com`;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `vuser_${Date.now()}`,
        email: testEmail,
        password: 'password123',
      });
    testUserId = signupRes.body.data.user.userId;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });
    userToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { userId: testUserId } });
    }
    await prisma.$disconnect();
  });

  test('1. Send email verification code and verify with OTP', async () => {
    const sendRes = await request(app)
      .post('/api/users/send-email-verification')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.success).toBe(true);

    // Fetch user to retrieve hashed OTP or simulate correct OTP verification
    const dbUser = await prisma.user.findUnique({ where: { userId: testUserId } });
    expect(dbUser.emailVerifyCode).toBeDefined();

    // Verify with invalid OTP
    const failRes = await request(app)
      .post('/api/users/verify-email')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: '000000' });
    expect(failRes.status).toBe(400);

    // Test correct code by setting known hash
    const testOtp = '123456';
    const otpHash = await bcrypt.hash(testOtp, 10);
    await prisma.user.update({
      where: { userId: testUserId },
      data: { emailVerifyCode: otpHash, emailVerifyExp: new Date(Date.now() + 600000) },
    });

    const successRes = await request(app)
      .post('/api/users/verify-email')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: testOtp });

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);

    const verifiedUser = await prisma.user.findUnique({ where: { userId: testUserId } });
    expect(verifiedUser.isEmailVerified).toBe(true);
  });

  test('2. Citizen CCCD verification with invalid QR format is rejected', async () => {
    const badRes = await request(app)
      .post('/api/users/verify-citizen')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        frontPhoto: 'data:image/jpeg;base64,sampleFront',
        backPhoto: 'data:image/jpeg;base64,sampleBack',
        qrData: 'https://invalid-url.com/something',
      });

    expect(badRes.status).toBe(400);
  });

  test('3. Citizen CCCD verification with valid Vietnamese CCCD QR format succeeds', async () => {
    const validCccdQr = '001200012345|012345678|NGUYỄN VĂN A|15052000|Nam|Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội|10102021';
    const goodRes = await request(app)
      .post('/api/users/verify-citizen')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        frontPhoto: 'data:image/jpeg;base64,sampleFrontCompressed',
        backPhoto: 'data:image/jpeg;base64,sampleBackCompressed',
        qrData: validCccdQr,
        parsedInfo: {
          idNumber: '001200012345',
          fullName: 'NGUYỄN VĂN A',
          dob: '15052000',
          gender: 'Nam',
          address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
          issueDate: '10102021',
        },
      });

    expect(goodRes.status).toBe(200);
    expect(goodRes.body.success).toBe(true);

    const verifiedUser = await prisma.user.findUnique({ where: { userId: testUserId } });
    expect(verifiedUser.isCitizenVerified).toBe(true);
    expect(verifiedUser.citizenIdNumber).toBe('001200012345');
    expect(verifiedUser.citizenName).toBe('NGUYỄN VĂN A');
  });

  test('4. Reporting is blocked for unverified users and allowed for verified users', async () => {
    // Create an unverified user
    const unverifiedEmail = `unverified_${Date.now()}@example.com`;
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `unv_${Date.now()}`,
        email: unverifiedEmail,
        password: 'password123',
      });
    const unvUserId = signupRes.body.data.user.userId;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: unverifiedEmail,
        password: 'password123',
      });
    const unvToken = loginRes.body.data.token;

    // Unverified user tries to report
    const unvReportRes = await request(app)
      .post('/api/users/report')
      .set('Authorization', `Bearer ${unvToken}`)
      .send({ targetId: -1, reason: 'Spam' });

    expect(unvReportRes.status).toBe(403);
    expect(unvReportRes.body.error.code).toBe('VERIFICATION_REQUIRED');

    // Verified user tries to report
    const verifiedReportRes = await request(app)
      .post('/api/users/report')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetId: -1, reason: 'Spam' });

    expect(verifiedReportRes.status).toBe(200);
    expect(verifiedReportRes.body.success).toBe(true);

    // Cleanup unvUser
    await prisma.user.delete({ where: { userId: unvUserId } });
  });
});
