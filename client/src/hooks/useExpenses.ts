import { useState } from 'react'
import toast from 'react-hot-toast'

interface ExpenseData {
  amount: string
  description: string
  category: string
}

interface CreateExpenseResult {
  success: boolean
  data?: any
  error?: string
}

export const useExpenses = () => {
  const [loading, setLoading] = useState(false)

  const createExpense = async (expenseData: ExpenseData): Promise<CreateExpenseResult> => {
    setLoading(true)
    try {
      // الحصول على admin ID من localStorage
      const adminData = localStorage.getItem('admin')
      if (!adminData) {
        throw new Error('يجب تسجيل الدخول أولاً')
      }
      
      const admin = JSON.parse(adminData)
      const adminId = admin.id
      
      const response = await fetch(`/api/expenses/${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(expenseData.amount),
          description: expenseData.description,
          type: expenseData.category
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في إنشاء المصروف')
      }

      toast.success('تم إضافة المصروف بنجاح!')
      return { success: true, data: data.expense }
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في إنشاء المصروف')
      return { success: false, error: error instanceof Error ? error.message : 'حدث خطأ في إنشاء المصروف' }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createExpense
  }
} 