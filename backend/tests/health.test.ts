import request from 'supertest';
import app from '../src/index';

describe('Health Check', () => {
  it('should return health status from legacy endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });

  it('should return health status from new endpoint', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'OK');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('environment');
  });

  it('should return detailed health status', async () => {
    const response = await request(app)
      .get('/api/v1/health/detailed');

    // Should return either 200 (healthy) or 503 (degraded) depending on database availability
    expect([200, 503]).toContain(response.status);
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('services');
    expect(response.body.data.services).toHaveProperty('database');
    expect(response.body.data).toHaveProperty('system');
  });

  it('should return readiness status', async () => {
    const response = await request(app)
      .get('/api/v1/health/ready');

    // Should return either 200 (ready) or 503 (not ready) depending on database availability
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return liveness status', async () => {
    const response = await request(app)
      .get('/api/v1/health/live')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('status', 'ALIVE');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should return API info', async () => {
    const response = await request(app)
      .get('/api/v1')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Steel Manufacturing ERP API');
    expect(response.body).toHaveProperty('version', 'v1');
    expect(response.body).toHaveProperty('environment');
  });

  it('should return 404 for unknown endpoints', async () => {
    const response = await request(app)
      .get('/unknown-endpoint')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});