import { BasketItem } from "@/types/basket";

export const baskets: BasketItem[] = [
  {
    id: "sahar",
    name: "Səhər Süfrəsi",
    tagline: "Günə təbii və sağlam başlanğıc",
    description: "Ailə üçün təbii kənd məhsullarından hazırlanmış balanslı səhər süfrəsi.",
    type: "sahar",
    servings: "2 nəfərlik",
    unit: "səbət",
    media: [{ type: "image", src: "/images/sahar-2.jpg" }],
    variants: {
      econom: { price: 15, contents: ["🥛 Kənd südü — 0.5 L","🥚 Yumurta — 6 ədəd"], extras: ["🍏 Mövsümi meyvə — 0.3 kq"] },
      standard: { price: 19, contents: ["🥛 Təzə kənd südü — 1 L","🧈 Camış qaymağı — 100 q","🥚 Kənd yumurtası — 10 ədəd"], extras: ["🍏 Mövsümi meyvə — 0.5 kq","🍯 Ev mürəbbəsi — 200 q"] },
      premium: { price: 25, contents: ["🥛 Camış südü — 1 L","🧈 Camış qaymağı — 150 q","🧀 İnək pendiri — 150 q","🥚 Kənd yumurtası — 12 ədəd"], extras: ["🍏 Mövsümi meyvə — 0.7 kq","🍯 Ev mürəbbəsi — 300 q","🍞 Gəncə kürə çörəyi"] },
    },
    highlights: ["100% təbii kənd məhsulları","Səhər üçün ideal balans","Uşaqlar üçün təhlükəsiz"],
  },
  {
    id: "ramazan-sahur",
    name: "Ramazan Sahur Səbəti",
    tagline: "Oruca sağlam və bərəkətli başlanğıc",
    description: "Sahur üçün xüsusi seçilmiş, toxluq verən və faydalı məhsullar.",
    type: "ramazan",
    servings: "2 nəfərlik",
    unit: "səbət",
    lowStock: true,
    media: [{ type: "image", src: "/images/ramazan-2.jpg" }],
    variants: {
      econom: { price: 20, contents: ["🌴 Acvə xurması — 150 q","🥛 Kənd südü — 0.5 L"], extras: ["🍎 Mövsümi meyvə — 0.3 kq"] },
      standard: { price: 29, contents: ["🌴 Acvə xurması — 250 q","🍯 Təbii bal — 100 q","🥛 Camış südü — 1 L","🧀 İnək pendiri — 150 q"], extras: ["🍎 Mövsümi meyvə — 0.5 kq"] },
      premium: { price: 39, contents: ["🌴 Acvə xurması — 350 q","🍯 Təbii bal — 200 q","🥛 Camış südü — 1 L","🧀 Camış pendiri — 150 q","🥣 Qatıq — 1 L"], extras: ["🍎 Mövsümi meyvə — 0.7 kq","🍯 Ev mürəbbəsi — 300 q","🍞 Gəncə lavaşı"] },
    },
    highlights: ["Uzunmüddətli toxluq","Ramazan üçün ideal seçim","İmam tövsiyəli məhsullar"],
  },
  {
    id: "gedebey",
    name: "Gədəbəy Səbəti",
    tagline: "Dağ havası dadında süd məhsulları",
    description: "Gədəbəy yaylaqlarından birbaşa gətirilmiş camış məhsulları.",
    type: "gedebey",
    servings: "2–4 nəfərlik",
    unit: "səbət",
    media: [{ type: "image", src: "/images/gedebey.jpg" }],
    variants: {
      econom: { price: 30, contents: ["🧀 Camış pendiri — 100 q","🥛 Camış südü — 0.5 L"], extras: [] },
      standard: { price: 39, contents: ["🧀 Camış pendiri","🥛 Camış südü","🥣 Camış qatığı","🧈 Nəhrə yağı"], extras: ["🍎 Mövsümi meyvə","🍯 Ev mürəbbəsi"] },
      premium: { price: 49, contents: ["🧀 Camış pendiri — 200 q","🥛 Camış südü — 1 L","🥣 Camış qatığı — 800 q","🧈 Nəhrə yağı — 150 q"], extras: ["🍎 Mövsümi meyvə — 0.7 kq","🍯 Ev mürəbbəsi — 300 q"] },
    },
    highlights: ["Dağ kəndi məhsulları","Əlavəsiz və qatqısız","Ən çox satılan səbət"],
  },
  {
    id: "novruz",
    name: "Novruz Səbəti",
    tagline: "Bayram ruhu ilə təbii məhsullar",
    description: "Novruz bayramı üçün xüsusi seçilmiş balanslı və təbii səbət.",
    type: "novruz",
    servings: "2–4 nəfərlik",
    unit: "səbət",
    media: [{ type: "image", src: "/images/novruz.jpg" }],
    variants: {
      econom: { price: 25, contents: ["🥚 Yumurtalar — 6 ədəd","🍏 Meyvə — 0.3 kq"], extras: [] },
      standard: { price: 35, contents: ["🥚 Yumurtalar — 10 ədəd","🍏 Mövsümi meyvə — 0.5 kq","🍯 Ev mürəbbəsi — 200 q"], extras: ["🍞 Qura çörək"] },
      premium: { price: 45, contents: ["🥚 Yumurtalar — 12 ədəd","🍏 Mövsümi meyvə — 0.7 kq","🍯 Ev mürəbbəsi — 300 q","🧈 Camış qaymağı — 150 q"], extras: ["🍞 Qura çörək","🌸 Bayram dekoru"] },
    },
    highlights: ["Bayram üçün ideal balans","100% təbii məhsullar","Ailə üçün təhlükəsiz"],
  }
];
