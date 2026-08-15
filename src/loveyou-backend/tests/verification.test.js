const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prismaClient');
const bcrypt = require('bcrypt');

jest.setTimeout(30000);

describe('Verification API: Email OTP & Admin Citizen CCCD Verification', () => {
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
    testUserId = signupRes.body.data?.user?.userId;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });
    userToken = loginRes.body.data?.token;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.deleteMany({ where: { userId: testUserId } });
    }
    await prisma.$disconnect();
  });

  test('1. Send email verification code and verify with OTP', async () => {
    if (!userToken) return;

    const sendRes = await request(app)
      .post('/api/users/send-email-verification')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.success).toBe(true);

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

  test('2. Citizen CCCD verification without front or back photo is rejected', async () => {
    if (!userToken) return;

    const badRes = await request(app)
      .post('/api/users/verify-citizen')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        frontPhoto: '',
        backPhoto: 'data:image/jpeg;base64,sampleBack',
      });

    expect(badRes.status).toBe(400);
  });

  test('3. Citizen CCCD verification with front & back photos sets status PENDING', async () => {
    if (!userToken) return;

    const goodRes = await request(app)
      .post('/api/users/verify-citizen')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        frontPhoto: 'data:image/jpeg;base64,sampleFrontCompressed',
        backPhoto: 'data:image/jpeg;base64,sampleBackCompressed',
      });

    expect(goodRes.status).toBe(200);
    expect(goodRes.body.success).toBe(true);

    const pendingUser = await prisma.user.findUnique({ where: { userId: testUserId } });
    expect(pendingUser.citizenVerificationStatus).toBe('PENDING');
    expect(pendingUser.isCitizenVerified).toBe(false);
    expect(pendingUser.citizenFrontPhoto).toBe('data:image/jpeg;base64,sampleFrontCompressed');
  });

  test('4. Admin can approve or reject citizen verification', async () => {
    const adminService = require('../src/services/adminService');

    // Test Admin Approval
    const approvedUser = await adminService.approveCitizenVerification(testUserId);
    expect(approvedUser.isCitizenVerified).toBe(true);
    expect(approvedUser.citizenVerificationStatus).toBe('APPROVED');

    // Test Admin Rejection with reason
    const rejectedUser = await adminService.rejectCitizenVerification(testUserId, 'Ảnh chụp bị mờ');
    expect(rejectedUser.isCitizenVerified).toBe(false);
    expect(rejectedUser.citizenVerificationStatus).toBe('REJECTED');
    expect(rejectedUser.citizenRejectReason).toBe('Ảnh chụp bị mờ');
  });
});

