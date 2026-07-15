// src/lib/services/notificationEvents.ts

import { NotificationService } from './notificationService';

interface EventContext {
  userId: string;
  orderId?: string;
  productId?: string;
  customerId?: string;
  message?: string;
  amount?: number;
  quantity?: number;
  [key: string]: any;
}

export class NotificationEvents {
  /**
   * Yeni sifariş yaradıldıqda admin-lərə bildiriş
   */
  static async orderCreated(context: EventContext) {
    // Burada admin-lərin siyahısını alıb hamısına göndərə bilərik
    // İndi sadəcə bir nümunə:
    await NotificationService.create({
      userId: context.userId,
      type: 'ORDER_CREATED',
      title: 'Yeni sifariş',
      message: `#${context.orderId} nömrəli sifariş yaradıldı`,
      refType: 'ORDER',
      refId: context.orderId,
    });
  }

  static async orderStatusChanged(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'ORDER_STATUS_CHANGED',
      title: 'Sifariş statusu dəyişdi',
      message: `#${context.orderId} sifarişin statusu "${context.newStatus}" olaraq dəyişdi`,
      refType: 'ORDER',
      refId: context.orderId,
    });
  }

  static async lowStock(context: EventContext) {
    await NotificationService.create({
      userId: context.userId, // warehouse staff
      type: 'LOW_STOCK',
      title: 'Stok azalıb',
      message: `${context.productName} məhsulunun stoku ${context.quantity} ədədə düşüb`,
      refType: 'PRODUCT',
      refId: context.productId,
    });
  }

  static async outOfStock(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'OUT_OF_STOCK',
      title: 'Stok bitdi',
      message: `${context.productName} məhsulunun stoku tamamilə bitdi`,
      refType: 'PRODUCT',
      refId: context.productId,
    });
  }

  static async newMessage(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'NEW_MESSAGE',
      title: 'Yeni mesaj',
      message: context.message || 'Yeni WhatsApp mesajı gəldi',
      refType: 'MESSAGE',
      refId: context.messageId,
    });
  }

  static async customerRegistered(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'CUSTOMER_REGISTERED',
      title: 'Yeni istifadəçi qeydiyyatı',
      message: `${context.customerName} qeydiyyatdan keçdi`,
      refType: 'USER',
      refId: context.customerId,
    });
  }

  static async paymentReceived(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Ödəniş alındı',
      message: `#${context.orderId} sifarişi üçün ${context.amount} AZN ödəniş alındı`,
      refType: 'ORDER',
      refId: context.orderId,
    });
  }

  static async deliveryStarted(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'DELIVERY_STARTED',
      title: 'Çatdırılma başladı',
      message: `#${context.orderId} sifarişi çatdırılmaya verildi`,
      refType: 'ORDER',
      refId: context.orderId,
    });
  }

  static async deliveryCompleted(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'DELIVERY_COMPLETED',
      title: 'Çatdırılma tamamlandı',
      message: `#${context.orderId} sifarişi müştəriyə çatdırıldı`,
      refType: 'ORDER',
      refId: context.orderId,
    });
  }

  static async couponUsed(context: EventContext) {
    await NotificationService.create({
      userId: context.userId,
      type: 'COUPON_USED',
      title: 'Kupon istifadə edildi',
      message: `${context.couponCode} kuponu istifadə edildi`,
      refType: 'COUPON',
      refId: context.couponId,
    });
  }
}