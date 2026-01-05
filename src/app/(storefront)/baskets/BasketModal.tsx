"use client";

export default function BasketModal({ item, onClose }: any) {
  if (!item) return null;

  const whatsappUrl = `https://wa.me/994773676021?text=${encodeURIComponent(
    item.whatsappText
  )}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden">
        <div className="relative h-72">
          <img src={item.media?.[0]?.src} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full">✕</button>
        </div>

        <div className="p-8 space-y-6">
          <h2 className="text-3xl font-extrabold">{item.name}</h2>

          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {(item.contents ?? []).map((c: string, i: number) => (
              <span key={i}>✔ {c}</span>
            ))}
          </div>

          {item.extras && (
            <div className="bg-emerald-50 p-4 rounded-xl">
              <strong>🎁 Bonus:</strong>
              <ul>{item.extras.map((e: string, i: number) => <li key={i}>✔ {e}</li>)}</ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-3xl font-extrabold text-emerald-700">
              {item.price} AZN
            </span>

            <a
              href={whatsappUrl}
              target="_blank"
              className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              WhatsApp ilə sifariş et
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
