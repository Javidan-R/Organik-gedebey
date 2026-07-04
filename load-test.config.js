// load-test.config.js
// Load testing configuration using k6

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  // Test homepage
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test products page
  const productsRes = http.get(`${BASE_URL}/products`);
  check(productsRes, {
    'products status 200': (r) => r.status === 200,
    'products response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test API endpoint (public)
  const apiRes = http.get(`${BASE_URL}/api/products`);
  check(apiRes, {
    'API status 200': (r) => r.status === 200,
    'API response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
