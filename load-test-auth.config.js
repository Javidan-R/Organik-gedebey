// load-test-auth.config.js
// Load testing for authenticated endpoints

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@organikgedebey.az';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin123!';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.02'],     // Error rate must be less than 2%
  },
};

// Login and get token
function login() {
  const loginRes = http.post(`${BASE_URL}/api/admin/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return body.user?.token || loginRes.cookies.find(c => c.name === 'og_admin_jwt')?.value;
  }
  return null;
}

export default function () {
  const token = login();
  
  if (!token) {
    console.error('Failed to login');
    return;
  }

  // Test admin dashboard
  const dashboardRes = http.get(`${BASE_URL}/admin/dashboard`, {
    headers: {
      'Cookie': `og_admin_jwt=${token}`,
    },
  });
  check(dashboardRes, {
    'dashboard status 200': (r) => r.status === 200,
    'dashboard response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Test admin orders API
  const ordersRes = http.get(`${BASE_URL}/api/orders`, {
    headers: {
      'Cookie': `og_admin_jwt=${token}`,
    },
  });
  check(ordersRes, {
    'orders API status 200': (r) => r.status === 200,
    'orders API response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);
}
