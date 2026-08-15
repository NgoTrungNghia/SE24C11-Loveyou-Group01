const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prismaClient');

jest.setTimeout(30000);

describe('Support Chat API Suite: User & Multi-Admin Support', () => {
  let userToken, adminToken;
  let testUserId, adminUserId;
  let conversationId;

  const testUserEmail = `user_sup_${Date.now()}@example.com`;
  const adminEmail = `admin_sup_${Date.now()}@example.com`;

  beforeAll(async () => {
    // 1. Create a regular user
    const userRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `usup_${Date.now()}`,
        email: testUserEmail,
        password: 'password123',
      });
    testUserId = userRes.body.data.user.userId;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: 'password123' });
    userToken = userLogin.body.data.token;

    // 2. Create an admin user
    const adminSignup = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `asup_${Date.now()}`,
        email: adminEmail,
        password: 'adminpassword123',
      });
    adminUserId = adminSignup.body.data.user.userId;

    // Promote to ADMIN role
    await prisma.user.update({
      where: { userId: adminUserId },
      data: { role: 'ADMIN' },
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'adminpassword123' });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    if (conversationId) {
      await prisma.supportMessage.deleteMany({ where: { conversationId } }).catch(() => {});
      await prisma.supportConversation.deleteMany({ where: { id: conversationId } }).catch(() => {});
    }
    if (testUserId) await prisma.user.delete({ where: { userId: testUserId } }).catch(() => {});
    if (adminUserId) await prisma.user.delete({ where: { userId: adminUserId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('1. User gets or creates their support conversation', async () => {
    const res = await request(app)
      .get('/api/support/my-conversation')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conversation).toBeDefined();
    expect(res.body.data.conversation.userId).toBe(testUserId);
    conversationId = res.body.data.conversation.id;
  });

  test('2. User sends a support message to Admin', async () => {
    const res = await request(app)
      .post('/api/support/send')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Xin chào ban quản trị, tôi cần hỗ trợ nâng cấp VIP!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.content).toBe('Xin chào ban quản trị, tôi cần hỗ trợ nâng cấp VIP!');
    expect(res.body.data.message.senderRole).toBe('USER');
    expect(res.body.data.conversation.adminUnreadCount).toBeGreaterThanOrEqual(1);
  });

  test('3. Admin retrieves all support conversations sorted with unread first', async () => {
    const res = await request(app)
      .get('/api/support/admin/conversations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.conversations)).toBe(true);

    const targetConv = res.body.data.conversations.find(c => c.id === conversationId);
    expect(targetConv).toBeDefined();
    expect(targetConv.adminUnreadCount).toBeGreaterThanOrEqual(1);
  });

  test('4. Admin opens conversation messages and resets adminUnreadCount', async () => {
    const res = await request(app)
      .get(`/api/support/admin/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conversation.adminUnreadCount).toBe(0);
    expect(res.body.data.messages.length).toBeGreaterThanOrEqual(1);
  });

  test('5. Admin replies to the user support conversation', async () => {
    const res = await request(app)
      .post(`/api/support/admin/conversations/${conversationId}/send`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Chào bạn, đội ngũ hỗ trợ LoveYou đã nhận được thông tin!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.senderRole).toBe('ADMIN');
    expect(res.body.data.conversation.userUnreadCount).toBeGreaterThanOrEqual(1);

    // User checks their conversation and sees the admin reply
    const userCheck = await request(app)
      .get('/api/support/my-conversation')
      .set('Authorization', `Bearer ${userToken}`);

    expect(userCheck.status).toBe(200);
    const msgs = userCheck.body.data.messages;
    const adminMsg = msgs.find(m => m.senderRole === 'ADMIN');
    expect(adminMsg).toBeDefined();
    expect(adminMsg.content).toBe('Chào bạn, đội ngũ hỗ trợ LoveYou đã nhận được thông tin!');
  });
});
