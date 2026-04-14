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
    it('returns 201 with the created task on valid submission', async () => {
        const mockTask = {
            id: 'task-uuid-1',
            description: 'Write unit tests',
            submitted_by: 'user-uuid-1',
            status: 'pending',
            submitted_at: new Date().toISOString(),
        };
        mockQuery.mockResolvedValueOnce({ rows: [mockTask] });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken()}`)
            .send({ description: 'Write unit tests' });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            description: 'Write unit tests',
            status: 'pending',
            submitted_by: 'user-uuid-1',
        });
    });
    it('returns 400 when description is empty string', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken()}`)
            .send({ description: '' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(mockQuery).not.toHaveBeenCalled();
    });
    it('returns 400 when description is whitespace-only', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken()}`)
            .send({ description: '   ' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(mockQuery).not.toHaveBeenCalled();
    });
    it('returns 400 when description is missing', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken()}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(mockQuery).not.toHaveBeenCalled();
    });
    it('returns 401 when no auth cookie is provided', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .send({ description: 'Some task' });
        expect(res.status).toBe(401);
        expect(mockQuery).not.toHaveBeenCalled();
    });
    it('returns 500 when the database throws', async () => {
        mockQuery.mockRejectedValueOnce(new Error('DB error'));
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/tasks')
            .set('Cookie', `token=${makeToken()}`)
            .send({ description: 'Valid task' });
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});
