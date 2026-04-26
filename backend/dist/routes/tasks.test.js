"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../index"));
const db_1 = __importDefault(require("../db"));
jest.mock('../db', () => ({
    query: jest.fn(),
}));
const mockQuery = db_1.default.query;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
function makeToken(role = 'member', sub = 'user-uuid-1') {
    return jsonwebtoken_1.default.sign({ sub, role, name: 'Alice' }, JWT_SECRET, { expiresIn: '1h' });
}
beforeEach(() => {
    jest.clearAllMocks();
});
describe('POST /tasks', () => {
    it('returns 403 when member tries to submit a task', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('member')}`)
            .send({ description: 'Member task' });
        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Task submission is restricted to delegated tasks only');
    });
    it('returns 403 when ambassador tries to submit a task', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('ambassador')}`)
            .send({ description: 'Ambassador task' });
        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Task submission is restricted to delegated tasks only');
    });
    it('returns 201 with the created task when admin submits (legacy support)', async () => {
        const mockTask = {
            id: 'task-uuid-1',
            description: 'Admin submitted task',
            submitted_by: 'admin-uuid-1',
            status: 'pending',
            submitted_at: new Date().toISOString(),
            screenshot_url: null,
            task_link: null,
        };
        // Mock the insert query
        mockQuery.mockResolvedValueOnce({ rows: [mockTask] });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('admin', 'admin-uuid-1')}`)
            .send({ description: 'Admin submitted task' });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            description: 'Admin submitted task',
            status: 'pending',
        });
    });
    it('returns 409 when submitting duplicate task_link', async () => {
        // Mock finding an existing task with the same link
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-task-id' }] });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('admin', 'admin-uuid-1')}`)
            .send({ description: 'Duplicate task', task_link: 'https://example.com/task1' });
        expect(res.status).toBe(409);
        expect(res.body.error).toContain('already submitted');
    });
    it('returns 400 when description is empty string', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('admin', 'admin-uuid-1')}`)
            .send({ description: '' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(mockQuery).not.toHaveBeenCalled();
    });
    it('returns 400 when description is whitespace-only', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('admin', 'admin-uuid-1')}`)
            .send({ description: '   ' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(mockQuery).not.toHaveBeenCalled();
    });
    it('returns 403 when ambassador_admin tries to submit a task', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken('ambassador_admin', 'amb-admin-uuid-1')}`)
            .send({ description: 'Ambassador Admin task' });
        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Ambassador Admins do not submit tasks');
    });
    it('returns 401 when no auth cookie is provided', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .send({ description: 'Some task' });
        expect(res.status).toBe(401);
        expect(mockQuery).not.toHaveBeenCalled();
    });
});
