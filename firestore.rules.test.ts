/**
 * Security Rule Tests for mini eCitizen Firestore Rules
 * Validates rejection of the "Dirty Dozen" invalid & unauthorized payloads.
 */

export interface TestPayload {
  name: string;
  collection: string;
  docId: string;
  data: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: TestPayload[] = [
  {
    name: '1. Self-assigned admin role on user creation',
    collection: 'users',
    docId: 'user_attacker',
    data: { uid: 'user_attacker', name: 'Malicious User', email: 'mallory@example.com', role: 'admin' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '2. Ghost field injection on user update',
    collection: 'users',
    docId: 'user_attacker',
    data: { isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '3. Citizen status tampering to Resolved',
    collection: 'requests',
    docId: 'req_123',
    data: { status: 'Resolved' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '4. Identity spoofing on request creation',
    collection: 'requests',
    docId: 'req_spoof',
    data: { userId: 'victim_user', category: 'Road Pothole', location: '1st Ave', description: 'Big hole', status: 'Pending' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '5. Unauthenticated write',
    collection: 'requests',
    docId: 'req_unauth',
    data: { userId: 'user_1', category: 'Garbage Collection', location: '2nd Ave', description: 'Trash bin full', status: 'Pending' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '6. Wallet denial attack with 500k char description',
    collection: 'requests',
    docId: 'req_oversized',
    data: { userId: 'user_1', category: 'Road Pothole', location: 'Main St', description: 'a'.repeat(500000), status: 'Pending' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '7. Invalid category injection',
    collection: 'requests',
    docId: 'req_invalid_cat',
    data: { userId: 'user_1', category: 'InvalidCategoryExploit', location: 'Main St', description: 'Some issue', status: 'Pending' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '8. Citizen modifying a Resolved request',
    collection: 'requests',
    docId: 'req_resolved_locked',
    data: { description: 'Trying to edit finished request' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '9. Citizen setting adminNote',
    collection: 'requests',
    docId: 'req_note_exploit',
    data: { adminNote: 'Self-approved' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '10. Write to admins collection by normal citizen',
    collection: 'admins',
    docId: 'user_attacker',
    data: { uid: 'user_attacker', email: 'mallory@example.com' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '11. Cross-citizen request deletion',
    collection: 'requests',
    docId: 'req_belonging_to_other',
    data: {},
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '12. Deletion of request when In Progress or Resolved',
    collection: 'requests',
    docId: 'req_in_progress',
    data: {},
    expectedResult: 'PERMISSION_DENIED'
  }
];
