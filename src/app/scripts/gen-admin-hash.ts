// scripts/gen-admin-hash.ts
// İstifadəsi: npx tsx scripts/gen-admin-hash.ts
// Çıxışı .env-ə köçürün: ADMIN_PASSWORD_HASH=...

import bcrypt from 'bcryptjs'

const password = process.argv[2] ?? 'admin123'
const hash = await bcrypt.hash(password, 10)

console.log('\n✅ Bcrypt hash hazırdır:\n')
console.log(`ADMIN_EMAIL=admin@organikgedebey.az`)
console.log(`ADMIN_PASSWORD_HASH=${hash}`)
console.log('\n.env faylınıza əlavə edin.')