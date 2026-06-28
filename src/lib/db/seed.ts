// src/lib/db/seed.ts
import { config } from 'dotenv'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function seed() {
  const { db } = await import('./index')
  const { users, categories, products, productVariants, settings, coupons, aboutUsSections, aboutUsRegions, aboutUsStats } = await import('./schema')

  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ??
    process.env.ADMIN_EMAIL ??
    process.env.DEV_ADMIN_EMAIL ??
    'admin@organikgedebey.az'

  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ??
    process.env.DEV_ADMIN_PASSWORD ??
    'Admin123!'

  const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin'
  const adminLastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Manager'
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '+994501234567'
  const adminRole = (process.env.SEED_ADMIN_ROLE ?? 'ADMIN') as
    | 'ADMIN'
    | 'SUPERADMIN'
    | 'MANAGER'
    | 'WAREHOUSE_STAFF'

  console.log('🌱 Seed başladı...\n')

  try {
    const adminHash = await bcrypt.hash(adminPassword, 12)

    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail.toLowerCase().trim(),
        passwordHash: adminHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        phone: adminPhone,
        role: adminRole,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
      })
      .returning()
      .onConflictDoNothing()

    console.log('✅ Admin:', admin?.email || `${adminEmail} (artıq mövcuddur)`)

    const catsData = [
      { name: 'Bal və Arı Məhsulları', slug: 'bal-ari-mehsullari', isFeatured: true, description: 'Təbii dağ balı və arı məhsulları' },
      { name: 'Süd Məhsulları', slug: 'sud-mehsullari', isFeatured: true, description: 'Kənd südü, qaymaq, kəsmik' },
      { name: 'Pendir Çeşidləri', slug: 'pendir-cesidleri', isFeatured: true, description: 'Ənənəvi pendir növləri' },
      { name: 'Tərəvəzlər', slug: 'terevezler', isFeatured: true, description: 'Mövsümi təzə tərəvəzlər' },
      { name: 'Meyvələr', slug: 'meyveler', isFeatured: true, description: 'Təbii bağ meyvələri' },
      { name: 'Göyərti', slug: 'goyerti', isFeatured: false, description: 'Təzə göyərti çeşidləri' },
      { name: 'Yumurta', slug: 'yumurta', isFeatured: false, description: 'Kənd yumurtası' },
      { name: 'Taxıl və Un Məmulatı', slug: 'taxil-un-memulati', isFeatured: false, description: 'Üzvi taxıl məhsulları' },
      { name: 'Quru Meyvələr', slug: 'quru-meyveler', isFeatured: false, description: 'Təbii qurudulmuş meyvələr' },
      { name: 'Ədviyyatlar', slug: 'edviyyatlar', isFeatured: false, description: 'Ətirli ədviyyatlar' },
      { name: 'Çaylar', slug: 'caylar', isFeatured: false, description: 'Dağ çayları' },
      { name: 'Şirniyyatlar', slug: 'sirniyyatlar', isFeatured: false, description: 'Əl işi şirniyyatlar' },
    ]

    const createdCats = await db.insert(categories).values(catsData).onConflictDoNothing().returning()

    console.log(`✅ ${createdCats.length} kateqoriya əlavə edildi`)

    const balCat = createdCats.find((c) => c.slug === 'bal-ari-mehsullari')
    const sudCat = createdCats.find((c) => c.slug === 'sud-mehsullari')
    const pendirCat = createdCats.find((c) => c.slug === 'pendir-cesidleri')
    const terevezCat = createdCats.find((c) => c.slug === 'terevezler')
    const yumurtaCat = createdCats.find((c) => c.slug === 'yumurta')

    const productsData = []

    if (balCat) {
      productsData.push(
        {
          name: 'Dağ Balı 500q',
          slug: 'dag-bali-500g',
          description: 'Gədəbəy dağlarından toplanmış, heç bir qatqısız təbii saf bal.',
          shortDescription: 'Təmiz Gədəbəy dağ balı',
          categoryId: balCat.id,
          basePrice: '25.00',
          discountType: 'PERCENTAGE' as const,
          discountValue: '20',
          unit: 'ədəd',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          isFeatured: true,
          isNewArrival: true,
          shelfLifeDays: 365,
          caloriesPer100g: 304,
        },
        {
          name: 'Çiçək Balı 250q',
          slug: 'cicek-bali-250g',
          description: 'Yaz çiçəklərindən toplanmış ətri bal',
          shortDescription: 'Yaz çiçəyi balı',
          categoryId: balCat.id,
          basePrice: '15.00',
          unit: 'ədəd',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          caloriesPer100g: 300,
        }
      )
    }

    if (sudCat) {
      productsData.push(
        {
          name: 'Kənd Qaymağı 500q',
          slug: 'kend-qaymagi-500g',
          description: 'Təbii inək südündən hazırlanmış qatı qaymaq',
          shortDescription: 'Qatı kənd qaymağı',
          categoryId: sudCat.id,
          basePrice: '8.00',
          unit: 'ədəd',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          isFeatured: true,
          shelfLifeDays: 7,
          caloriesPer100g: 340,
          proteinPer100g: '3.00',
          fatPer100g: '35.00',
        },
        {
          name: 'Kəsmik 1kq',
          slug: 'kesmik-1kg',
          description: 'Təzə hazırlanmış kənd kəsmiki',
          shortDescription: 'Təzə kənd kəsmiki',
          categoryId: sudCat.id,
          basePrice: '6.00',
          unit: 'kq',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          proteinPer100g: '18.00',
          caloriesPer100g: 160,
        }
      )
    }

    if (pendirCat) {
      productsData.push(
        {
          name: 'Kənd Pendiri 1kq',
          slug: 'kend-pendiri-1kg',
          description: 'Ənənəvi üsulla hazırlanmış kənd pendiri',
          shortDescription: 'Ənənəvi kənd pendiri',
          categoryId: pendirCat.id,
          basePrice: '12.00',
          unit: 'kq',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          isFeatured: true,
          proteinPer100g: '25.00',
          caloriesPer100g: 350,
          fatPer100g: '28.00',
        },
        {
          name: 'Motal Pendiri 500q',
          slug: 'motal-pendiri-500g',
          description: 'Dəridə saxlanılmış ənənəvi motal pendiri',
          shortDescription: 'Ənənəvi motal pendiri',
          categoryId: pendirCat.id,
          basePrice: '18.00',
          unit: 'ədəd',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          shelfLifeDays: 90,
          proteinPer100g: '28.00',
          caloriesPer100g: 380,
        }
      )
    }

    if (terevezCat) {
      productsData.push(
        {
          name: 'Üzvi Pomidor 1kq',
          slug: 'uzvi-pomidor-1kg',
          description: 'Kənd bağında yetişdirilmiş təbii pomidor',
          shortDescription: 'Təbii bağ pomidoru',
          categoryId: terevezCat.id,
          basePrice: '3.50',
          unit: 'kq',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          shelfLifeDays: 7,
          caloriesPer100g: 18,
        },
        {
          name: 'Üzvi Xiyar 1kq',
          slug: 'uzvi-xiyar-1kg',
          description: 'Təzə yığılmış bağ xiyarı',
          shortDescription: 'Təzə bağ xiyarı',
          categoryId: terevezCat.id,
          basePrice: '2.50',
          unit: 'kq',
          grade: 'A' as const,
          originRegion: 'Gədəbəy',
          isOrganic: true,
          shelfLifeDays: 5,
          caloriesPer100g: 15,
        }
      )
    }

    if (yumurtaCat) {
      productsData.push({
        name: 'Kənd Yumurtası 10 ədəd',
        slug: 'kend-yumurtasi-10-eded',
        description: 'Sərbəst gəzən toyuqlardan təbii yumurta',
        shortDescription: 'Təbii kənd yumurtası',
        categoryId: yumurtaCat.id,
        basePrice: '4.00',
        unit: 'qutu',
        grade: 'A' as const,
        originRegion: 'Gədəbəy',
        isOrganic: true,
        shelfLifeDays: 21,
        caloriesPer100g: 155,
        proteinPer100g: '13.00',
      })
    }

    if (productsData.length > 0) {
      const createdProducts = await db.insert(products).values(productsData).onConflictDoNothing().returning()

      console.log(`✅ ${createdProducts.length} məhsul əlavə edildi`)

      const variantsData = createdProducts.map((p) => ({
        productId: p.id,
        name: 'Standart',
        basePrice: p.basePrice,
        stock: Math.floor(Math.random() * 50) + 20,
        unit: p.unit,
        grade: p.grade,
        isDefault: true,
      }))

      await db.insert(productVariants).values(variantsData).onConflictDoNothing()

      console.log(`✅ ${variantsData.length} variant əlavə edildi`)
    }

    const settingsData = [
      { key: 'store_name', value: 'Organik Gədəbəy', type: 'string', category: 'general' },
      { key: 'store_currency', value: 'AZN', type: 'string', category: 'general' },
      { key: 'store_description', value: 'Gədəbəydən təbii kənd məhsulları', type: 'string', category: 'general' },
      { key: 'free_delivery_threshold', value: '50', type: 'number', category: 'delivery' },
      { key: 'delivery_fee', value: '5', type: 'number', category: 'delivery' },
      { key: 'contact_phone', value: '+994501234567', type: 'string', category: 'contact' },
      { key: 'contact_email', value: 'info@organikgedebey.az', type: 'string', category: 'contact' },
      { key: 'contact_whatsapp', value: '+994501234567', type: 'string', category: 'contact' },
      { key: 'working_hours', value: '09:00-18:00', type: 'string', category: 'general' },
      { key: 'min_order_amount', value: '10', type: 'number', category: 'order' },
    ]

    await db.insert(settings).values(settingsData).onConflictDoNothing()

    console.log(`✅ ${settingsData.length} parametr əlavə edildi`)

    await db
      .insert(coupons)
      .values([
        {
          code: 'XOSGELDIN10',
          discountType: 'PERCENTAGE',
          discountValue: '10',
          minOrderAmount: '20',
          maxDiscountAmount: '15',
          usageLimit: 100,
          usagePerUser: 1,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'BAL20',
          discountType: 'PERCENTAGE',
          discountValue: '20',
          minOrderAmount: '40',
          maxDiscountAmount: '25',
          applicableTo: 'category',
          usageLimit: 50,
          usagePerUser: 1,
          isActive: true,
        },
      ])
      .onConflictDoNothing()

    console.log('✅ Kuponlar əlavə edildi')

    // Seed About Us data
    const aboutUsSectionsData = [
      {
        title: 'Təbii Məhsulların Zərifliyi',
        subtitle: 'Azərbaycanın münbit torpaqlarından süfrənizə',
        description: 'Gədəbəy, Tovuz, Gəncə, Şəmkir, Daşkəsən, Qax, Zaqatala və digər Azərbaycan regionlarından təbii orqanik kənd məhsulları gətiririk mağazamıza və sizin süfrənizə.',
        sectionType: 'hero',
        displayOrder: 0,
        isActive: true,
      },
      {
        title: 'Bizim Hekayəmiz',
        subtitle: 'Torpaqdan süfrəyə olan səfərimiz',
        description: 'Biz kiçik bir ailə işi kimi başladıq. Gədəbəyin münbit torpaqlarında əkilən tərəvəzlərdən tutmuş, Qaxın bağ meyvələrinə qədər - hər bir məhsulu birbaşa yerli kəndlilərdən əldə edirik. Məqsədimiz şəhər sakinlərinə kəndin təzəliyini və təbiiliyini çatdırmaqdır.',
        sectionType: 'story',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Dəyərlərimiz',
        subtitle: 'Keyfiyyət, Etibar və Təbiiyyət',
        description: 'Hər bir məhsulumuz 100% orqanik və təbiidir. Heç bir kimyəvi qatqı, hormon və ya konservant istifadə etmirik. Kəndlilərimizlə birbaşa əməkdaşlıq edirik, onlara ədalətli qiymət ödəyirik.',
        sectionType: 'values',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Bizimlə Əlaqə',
        subtitle: 'Sualınız var? Bizə yazın!',
        description: 'Məhsullarımız haqqında daha çox məlumat almaq və ya sifariş vermək üçün bizimlə əlaqə saxlayın. WhatsApp vasitəsilə də sifariş edə bilərsiniz.',
        sectionType: 'cta',
        displayOrder: 3,
        isActive: true,
      },
    ]

    const createdSections = await db.insert(aboutUsSections).values(aboutUsSectionsData).onConflictDoNothing().returning()
    console.log(`✅ ${createdSections.length} Haqqımızda bölməsi əlavə edildi`)

    const aboutUsRegionsData = [
      {
        name: 'Gədəbəy',
        description: 'Dağ balı, tərəvəzlər və süd məhsulları',
        displayOrder: 0,
        isActive: true,
        featuredProducts: ['Dağ Balı', 'Kənd Südü', 'Tərəvəzlər'],
      },
      {
        name: 'Tovuz',
        description: 'Taxıl məhsulları və ət məhsulları',
        displayOrder: 1,
        isActive: true,
        featuredProducts: ['Buğda', 'Qoyun əti'],
      },
      {
        name: 'Gəncə',
        description: 'Meyvələr və tərəvəzlər',
        displayOrder: 2,
        isActive: true,
        featuredProducts: ['Narınc', 'Alma', 'Kartof'],
      },
      {
        name: 'Şəmkir',
        description: 'Süd məhsulları və pendirlər',
        displayOrder: 3,
        isActive: true,
        featuredProducts: ['Kəsmik', 'Pendir', 'Süd'],
      },
      {
        name: 'Daşkəsən',
        description: 'Tərəvəzlər və göyərti',
        displayOrder: 4,
        isActive: true,
        featuredProducts: ['Pomidor', 'Biber', 'Göyərti'],
      },
      {
        name: 'Qax',
        description: 'Bağ meyvələri və quru meyvələr',
        displayOrder: 5,
        isActive: true,
        featuredProducts: ['Ərik', 'Şaftalı', 'Quru meyvələr'],
      },
      {
        name: 'Zaqatala',
        description: 'Fındıq və meyvələr',
        displayOrder: 6,
        isActive: true,
        featuredProducts: ['Fındıq', 'Armud', 'Narınc'],
      },
    ]

    const createdRegions = await db.insert(aboutUsRegions).values(aboutUsRegionsData).onConflictDoNothing().returning()
    console.log(`✅ ${createdRegions.length} region əlavə edildi`)

    const aboutUsStatsData = [
      {
        label: 'Məmnun Müştəri',
        value: '5000+',
        description: 'Azərbaycanın bölgələrindən',
        icon: 'Users',
        displayOrder: 0,
        isActive: true,
      },
      {
        label: 'Region',
        value: '7+',
        description: 'Məhsul təchiz edən region',
        icon: 'Globe',
        displayOrder: 1,
        isActive: true,
      },
      {
        label: 'Məhsul Növü',
        value: '100+',
        description: 'Orqanik kənd məhsulları',
        icon: 'Award',
        displayOrder: 2,
        isActive: true,
      },
      {
        label: 'Kəndli',
        value: '50+',
        description: 'Birbaşa əməkdaşlıq',
        icon: 'Zap',
        displayOrder: 3,
        isActive: true,
      },
    ]

    const createdStats = await db.insert(aboutUsStats).values(aboutUsStatsData).onConflictDoNothing().returning()
    console.log(`✅ ${createdStats.length} statistika əlavə edildi`)

    console.log('\n🎉 Seed uğurla tamamlandı!')
    console.log(`📧 Admin girişi: ${adminEmail} / (SEED_ADMIN_PASSWORD və ya .env-dəki şifrə)`)
  } catch (error) {
    console.error('❌ Seed xətası:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

seed()
