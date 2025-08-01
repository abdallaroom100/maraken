import { useState } from 'react'
import toast from 'react-hot-toast'

interface RevenueData {
  amount: string
  description: string
  source: string
}

interface CreateRevenueResult {
  success: boolean
  data?: any
  error?: string
}

export const useRevenues = () => {
  const [loading, setLoading] = useState(false)

  const createRevenue = async (revenueData: RevenueData): Promise<CreateRevenueResult> => {
    setLoading(true)
    try {
      // الحصول على admin ID من localStorage
      const adminData = localStorage.getItem('admin')
      if (!adminData) {
        throw new Error('يجب تسجيل الدخول أولاً')
      }
      
      const admin = JSON.parse(adminData)
      const adminId = admin.id
      
      const response = await fetch(`http://localhost:8000/api/revenues/${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(revenueData.amount),
          description: revenueData.description,
          type: revenueData.source
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في إنشاء الإيراد')
      }

      toast.success('تم إضافة الإيراد بنجاح!')
      return { success: true, data: data.revenue }
    } catch (error) {
      console.error('Error creating revenue:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في إنشاء الإيراد')
      return { success: false, error: error instanceof Error ? error.message : 'حدث خطأ في إنشاء الإيراد' }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createRevenue
  }
} 