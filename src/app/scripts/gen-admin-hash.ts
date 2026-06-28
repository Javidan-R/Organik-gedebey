// src/app/scripts/gen-admin-hash.ts
// Admin şifrəsi üçün bcrypt hash yaradır.
// İstifadə: npx tsx src/app/scripts/gen-admin-hash.ts
//
// Nümunə çıxış:
//   Password: Admin@2024!
//   Hash: $2a$12$...
//   .env-ə əlavə et: ADMIN_PASSWORD_HASH=$2a$12$...

import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function main() {
  const password = await new Promise<string>((resolve) => {
    rl.question('Şifrəni daxil edin: ', (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })

  if (password.length < 8) {
    console.error('❌ Şifrə ən azı 8 simvol olmalıdır!')
    process.exit(1)
  }

  if (!/[A-Z]/.test(password)) {
    console.error('❌ Şifrədə ən azı 1 böyük hərf olmalıdır!')
    process.exit(1)
  }

  if (!/[0-9]/.test(password)) {
    console.error('❌ Şifrədə ən azı 1 rəqəm olmalıdır!')
    process.exit(1)
  }

  console.log('\n⏳ Hash yaradılır (bu bir neçə saniyə ala bilər)...')
  const hash = await bcrypt.hash(password, 12)

  console.log('\n✅ Hash yaradıldı!\n')
  console.log('─'.repeat(60))
  console.log(`Password: ${password}`)
  console.log(`Hash:     ${hash}`)
  console.log('─'.repeat(60))
  console.log('\n.env.local faylına əlavə et:')
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`)
}

main().catch(console.error)
