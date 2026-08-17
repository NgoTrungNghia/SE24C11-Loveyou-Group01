const chatService = require('../src/services/chatService');
const matchingService = require('../src/services/matchingService');
const aiMatchingService = require('../src/services/aiMatchingService');
const prisma = require('../src/utils/prismaClient');

jest.setTimeout(30000);

describe('Feature Suite: Unmatch, Filter & Mini Game Options', () => {
  let userA, userB;
  let matchRecord;
  let convRecord;

  beforeAll(async () => {
    // Create 2 test users
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        username: `test_user_a_${timestamp}`,
        email: `usera_${timestamp}@example.com`,
        passwordHash: 'hashed_password',
        fullName: 'User A Test',
        gender: 'MALE',
        dateOfBirth: new Date('1998-05-15'),
        latitude: 10.762622,
        longitude: 106.660172,
        status: 'ACTIVE',
        role: 'USER',
      },
    });

    userB = await prisma.user.create({
      data: {
        username: `test_user_b_${timestamp}`,
        email: `userb_${timestamp}@example.com`,
        passwordHash: 'hashed_password',
        fullName: 'User B Test',
        gender: 'FEMALE',
        dateOfBirth: new Date('2000-08-20'),
        latitude: 10.772622,
        longitude: 106.670172,
        status: 'ACTIVE',
        role: 'USER',
      },
    });

    // Create Match
    const [u1, u2] = userA.userId < userB.userId ? [userA.userId, userB.userId] : [userB.userId, userA.userId];
    matchRecord = await prisma.match.create({
      data: {
        user1Id: u1,
        user2Id: u2,
        isUnmatched: false,
      },
    });

    convRecord = await prisma.conversation.create({
      data: {
        matchId: matchRecord.matchId,
      },
    });

    // Send a message
    await chatService.saveMessage(convRecord.id, userA.userId, 'Xin chào bạn!');
  });

  afterAll(async () => {
    try {
      if (convRecord) {
        await prisma.message.deleteMany({ where: { conversationId: convRecord.id } });
        await prisma.conversation.deleteMany({ where: { id: convRecord.id } });
      }
      if (matchRecord) {
        await prisma.match.deleteMany({ where: { matchId: matchRecord.matchId } });
      }
      if (userA) await prisma.user.delete({ where: { userId: userA.userId } }).catch(() => {});
      if (userB) await prisma.user.delete({ where: { userId: userB.userId } }).catch(() => {});
      await prisma.$disconnect();
    } catch { /* ignore */ }
  });

  test('Unmatch preserves conversation and messages, but marks isUnmatched: true', async () => {
    // Perform unmatch from userA to userB
    await matchingService.unmatchUser(userA.userId, userB.userId);

    // Check Match in DB
    const matchInDb = await prisma.match.findUnique({
      where: { matchId: matchRecord.matchId },
    });
    expect(matchInDb).not.toBeNull();
    expect(matchInDb.isUnmatched).toBe(true);
    expect(matchInDb.unmatchedBy).toBe(userA.userId);

    // Check conversation still exists and has messages
    const messages = await chatService.getMessages(convRecord.id, userA.userId);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].content).toBe('Xin chào bạn!');

    // Check getUserConversations returns isUnmatched: true
    const convs = await chatService.getUserConversations(userA.userId);
    const targetConv = convs.find(c => c.conversationId === convRecord.id);
    expect(targetConv).toBeDefined();
    expect(targetConv.isUnmatched).toBe(true);
  });

  test('Sending message is blocked when match is unmatched', async () => {
    await expect(
      chatService.saveMessage(convRecord.id, userA.userId, 'Tin nhắn sau khi unmatch')
    ).rejects.toThrow('Hai bạn đã hủy ghép đôi');
  });

  test('Matching again clears isUnmatched status and restores chat permission', async () => {
    // Both swipe LIKE again
    await matchingService.handleSwipe(userA.userId, userB.userId, 'LIKE');
    const result = await matchingService.handleSwipe(userB.userId, userA.userId, 'LIKE');
    expect(result.isMatch).toBe(true);

    const matchInDb = await prisma.match.findUnique({
      where: { matchId: matchRecord.matchId },
    });
    expect(matchInDb.isUnmatched).toBe(false);

    // Now message sending works again
    const newMsg = await chatService.saveMessage(convRecord.id, userA.userId, 'Chúng mình đã kết nối lại!');
    expect(newMsg.content).toBe('Chúng mình đã kết nối lại!');
  });

  test('resetCandidates clears swiped candidates allowing them to be recommended again while preserving active matches', async () => {
    const timestamp = Date.now();
    const userC = await prisma.user.create({
      data: {
        username: `test_user_c_${timestamp}`,
        email: `userc_${timestamp}@example.com`,
        passwordHash: 'hashed_password',
        fullName: 'User C Test',
        gender: 'FEMALE',
        dateOfBirth: new Date('1999-01-01'),
        latitude: 10.762622,
        longitude: 106.660172,
        status: 'ACTIVE',
        role: 'USER',
      },
    });

    try {
      // 1. Initial candidates should include userC
      let candidates = await matchingService.getCandidates(userA.userId);
      expect(candidates.some(c => c.id === userC.userId)).toBe(true);

      // 2. User A swipes PASS on User C
      await matchingService.handleSwipe(userA.userId, userC.userId, 'PASS');

      // 3. User C should no longer be in candidates
      candidates = await matchingService.getCandidates(userA.userId);
      expect(candidates.some(c => c.id === userC.userId)).toBe(false);

      // 4. Reset candidates for User A
      const resetRes = await matchingService.resetCandidates(userA.userId);
      expect(resetRes.success).toBe(true);

      // 5. User C should reappear in candidates
      candidates = await matchingService.getCandidates(userA.userId);
      expect(candidates.some(c => c.id === userC.userId)).toBe(true);

      // 6. Active match with User B is NOT in candidates deck
      expect(candidates.some(c => c.id === userB.userId)).toBe(false);

      // 7. Test getAICandidates as well
      const aiCandidates = await aiMatchingService.getAICandidates(userA.userId);
      expect(aiCandidates.some(c => c.id === userC.userId)).toBe(true);
      expect(aiCandidates.some(c => c.id === userB.userId)).toBe(false);
    } finally {
      await prisma.swipe.deleteMany({ where: { OR: [{ swiperId: userC.userId }, { targetId: userC.userId }] } });
      await prisma.user.delete({ where: { userId: userC.userId } }).catch(() => {});
    }
  });
});
