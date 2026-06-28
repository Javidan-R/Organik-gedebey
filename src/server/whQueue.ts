export type WhatsDraft = {
  id: string;
  createdAt: string;
  text: string;
  items: { productId: string; qty: number }[];
  customerName?: string;
  channel: 'whatsapp';
};

const store: WhatsDraft[] = [];

export const WhatsQueue = {
  push(d: WhatsDraft) { store.unshift(d); },
  list() { return [...store]; },
  pop(id: string) {
    const i = store.findIndex(x=>x.id===id);
    if (i>=0) store.splice(i,1);
  }
};
