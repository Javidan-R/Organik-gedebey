export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/checkout/', '/_next/', '/static/'],
    },
    sitemap: 'https://organikgedebey.az/sitemap.xml',
    host: 'https://organikgedebey.az',
  };
}