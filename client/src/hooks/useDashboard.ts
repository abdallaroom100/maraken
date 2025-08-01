import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface DashboardStats {
  summary: {
    totalExpenses: number;
    totalRevenues: number;
    netAmount: number;
    expensesCount: number;
    revenuesCount: number;
  };
  expensesByType: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  revenuesByType: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  recentExpenses: Array<any>;
  recentRevenues: Array<any>;
  adminStats: Array<any>;
}

interface DashboardFilters {
  year: number;
  month: number;
  adminId: string;
}

export const useDashboard = () => {
  const [allData, setAllData] = useState<{ expenses: any[]; revenues: any[] } | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [admins, setAdmins] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    adminId: ''
  })

  const { getToken, isAuthenticated, loading: authLoading, admin } = useAuth()

  // جلب كل البيانات دفعة واحدة عند تغيير السنة أو الشهر
  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) {
        setError('No token found. Please log in.')
        setLoading(false)
        return
      }
      const queryParams = new URLSearchParams()
      if (filters.year) queryParams.append('year', filters.year.toString())
      if (filters.month) queryParams.append('month', filters.month.toString())
      queryParams.append('allData', 'true')
      const url = `/api/dashboard/stats?${queryParams}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('admin')
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch dashboard data')
      }
      const data = await response.json()
      setAllData(data.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  // جلب قائمة الأدمنين
  const fetchAdmins = async () => {
    try {
      const token = getToken()
      if (!token) return
      const response = await fetch('/api/dashboard/admins', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('admin')
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch admins list')
      }
      const data = await response.json()
      setAdmins(data.data)
    } catch (error) {
      // لا نضع error هنا لأنها ليست حرجة
    }
  }

  // عند تغيير السنة أو الشهر: جلب كل البيانات دفعة واحدة
  useEffect(() => {
    if (!authLoading && isAuthenticated && admin) {
      fetchAllData()
      fetchAdmins()
    }
    // eslint-disable-next-line
  }, [authLoading, isAuthenticated, admin, filters.year, filters.month])

  // عند تغيير الأدمن: فلترة محلية فقط
  useEffect(() => {
    if (!allData) return
    setLoading(true)
    // فلترة البيانات حسب الأدمن
    const filteredExpenses = filters.adminId
      ? allData.expenses.filter(e => e.adminId?.toString() === filters.adminId)
      : allData.expenses
    const filteredRevenues = filters.adminId
      ? allData.revenues.filter(r => r.adminId?.toString() === filters.adminId)
      : allData.revenues
    // حساب الإحصائيات
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalRevenues = filteredRevenues.reduce((sum, r) => sum + (r.amount || 0), 0)
    const netAmount = totalRevenues - totalExpenses
    // حسب النوع
    const expensesByType = Object.values(filteredExpenses.reduce((acc, e) => {
      if (!acc[e.type]) acc[e.type] = { _id: e.type, total: 0, count: 0 }
      acc[e.type].total += e.amount
      acc[e.type].count += 1
      return acc
    }, {} as any)) as Array<{ _id: string; total: number; count: number }>
    const revenuesByType = Object.values(filteredRevenues.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = { _id: r.type, total: 0, count: 0 }
      acc[r.type].total += r.amount
      acc[r.type].count += 1
      return acc
    }, {} as any)) as Array<{ _id: string; total: number; count: number }>

    const recentExpenses = [...filteredExpenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    const recentRevenues = [...filteredRevenues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

    const adminStatsMap: any = {}
    filteredExpenses.forEach(e => {
      const id = e.adminId?.toString() || 'غير محدد'
      if (!adminStatsMap[id]) adminStatsMap[id] = { adminId: id, adminName: '', totalExpenses: 0, expensesCount: 0, totalRevenues: 0, revenuesCount: 0, netAmount: 0 }
      adminStatsMap[id].totalExpenses += e.amount
      adminStatsMap[id].expensesCount += 1
    })
    filteredRevenues.forEach(r => {
      const id = r.adminId?.toString() || 'غير محدد'
      if (!adminStatsMap[id]) adminStatsMap[id] = { adminId: id, adminName: '', totalExpenses: 0, expensesCount: 0, totalRevenues: 0, revenuesCount: 0, netAmount: 0 }
      adminStatsMap[id].totalRevenues += r.amount
      adminStatsMap[id].revenuesCount += 1
    })
    Object.values(adminStatsMap).forEach((s: any) => {
      s.netAmount = s.totalRevenues - s.totalExpenses
      const found = admins.find(a => a._id === s.adminId)
      s.adminName = found ? found.name : 'غير محدد'
    })
    setStats({
      summary: {
        totalExpenses,
        totalRevenues,
        netAmount,
        expensesCount: filteredExpenses.length,
        revenuesCount: filteredRevenues.length
      },
      expensesByType,
      revenuesByType,
      recentExpenses,
      recentRevenues,
      adminStats: Object.values(adminStatsMap).sort((a: any, b: any) => b.netAmount - a.netAmount)
    })
    setLoading(false)
  }, [allData, filters.adminId, admins])

  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      adminId: ''
    })
  }

  const refetch = async () => {
    await fetchAllData();
    await fetchAdmins();
  };

  return { stats, admins, loading, error, filters, updateFilters, resetFilters, refetch }
} 