// src/components/admin/users/UserForm.tsx
import React, { useState } from 'react'
import { Mail, Phone, Shield } from 'lucide-react'
import { Input } from './Input'
import { Select } from './Select'
import { Button } from './Button'
import { User, UserFormData, UserRole } from '@/types/user'

interface UserFormProps {
  user: User | null
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || '',
    phone: user?.phone || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'CUSTOMER',
    isActive: user?.isActive ?? true,
  })
  const [loading, setLoading] = useState(false)
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ad"
          value={formData.firstName}
          onChange={(v) => setFormData({ ...formData, firstName: v })}
          placeholder="Ad"
        />
        <Input
          label="Soyad"
          value={formData.lastName}
          onChange={(v) => setFormData({ ...formData, lastName: v })}
          placeholder="Soyad"
        />
      </div>
      <Input
        label="Email"
        value={formData.email}
        onChange={(v) => setFormData({ ...formData, email: v })}
        placeholder="email@example.com"
        icon={Mail}
      />
      <Input
        label="Telefon"
        value={formData.phone}
        onChange={(v) => setFormData({ ...formData, phone: v })}
        placeholder="+994 XX XXX XX XX"
        icon={Phone}
      />
      <Select
        label="Rol"
        value={formData.role}
        onChange={(v) => setFormData({ ...formData, role: v as UserRole })}
        options={[
          { value: 'CUSTOMER', label: 'Müştəri' },
          { value: 'COURIER', label: 'Kuryer' },
          { value: 'WAREHOUSE_STAFF', label: 'Anbar işçisi' },
          { value: 'MANAGER', label: 'Menecer' },
          { value: 'ADMIN', label: 'Admin' },
        ]}
        icon={Shield}
      />
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
        />
        <label className="text-sm text-slate-700">Aktiv istifadəçi</label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Ləğv et
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Yadda saxlanır...' : user ? 'Yadda saxla' : 'Yarat'}
        </Button>
      </div>
    </form>
  )
}
