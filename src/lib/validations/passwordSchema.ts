import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Şifrə ən azı 8 simvol olmalıdır')
  .regex(/[A-Z]/, 'Şifrədə ən azı 1 böyük hərf olmalıdır')
  .regex(/[0-9]/, 'Şifrədə ən azı 1 rəqəm olmalıdır')
