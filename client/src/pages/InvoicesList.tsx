import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InvoiceModal from '../components/InvoiceModal';
import './InvoicesList.css';

interface Invoice {
  _id: string;
  clientType: 'فردي' | 'تجاري';
  clientData: any;
  products: Array<{
    name: string;
    priceOfPieace: string;
    quantity: string;
    description?: string;
    discount?: number;
    tax?: string;
  }>;
  createdAt: string;
}

const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'فردي' | 'تجاري'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoice/list');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        toast.error('فشل في تحميل الفواتير');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('حدث خطأ في تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoice/delete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('تم حذف الفاتورة بنجاح');
        fetchInvoices();
      } else {
        toast.error('فشل في حذف الفاتورة');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('حدث خطأ في حذف الفاتورة');
    }
  };

  const openInvoiceModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setModalOpen(false);
    setSelectedInvoiceId(null);
  };

  const calculateTotal = (products: Invoice['products']) => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.priceOfPieace) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      const discount = product.discount || 0;
      return total + (price * quantity) - discount;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClientName = (invoice: Invoice) => {
    if (invoice.clientType === 'فردي') {
      return invoice.clientData.fullName;
    } else {
      return `${invoice.clientData.firstName} ${invoice.clientData.lastName}`;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = getClientName(invoice).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || invoice.clientType === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="invoices-list-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>جاري تحميل الفواتير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoices-list-container">
      <div className="invoices-list-header">
        <h1>قائمة الفواتير</h1>
        <button 
          className="create-invoice-btn"
          onClick={() => navigate('/create-invoice')}
        >
          <i className="fas fa-plus"></i>
          إنشاء فاتورة جديدة
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="البحث عن طريق اسم العميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            جميع الفواتير
          </button>
          <button
            className={`filter-btn ${filterType === 'فردي' ? 'active' : ''}`}
            onClick={() => setFilterType('فردي')}
          >
            العملاء الأفراد
          </button>
          <button
            className={`filter-btn ${filterType === 'تجاري' ? 'active' : ''}`}
            onClick={() => setFilterType('تجاري')}
          >
            العملاء التجاريين
          </button>
        </div>
      </div>

      <div className="invoices-stats">
        <div className="stat-card">
          <i className="fas fa-file-invoice"></i>
          <div>
            <h3>{invoices.length}</h3>
            <p>إجمالي الفواتير</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-user"></i>
          <div>
            <h3>{invoices.filter(i => i.clientType === 'فردي').length}</h3>
            <p>العملاء الأفراد</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-building"></i>
          <div>
            <h3>{invoices.filter(i => i.clientType === 'تجاري').length}</h3>
            <p>العملاء التجاريين</p>
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="no-invoices">
          <i className="fas fa-file-invoice"></i>
          <h3>لا توجد فواتير</h3>
          <p>لم يتم إنشاء أي فواتير بعد</p>
          <button 
            className="create-first-invoice-btn"
            onClick={() => navigate('/create-invoice')}
          >
            إنشاء أول فاتورة
          </button>
        </div>
      ) : (
        <div className="invoices-grid">
          {filteredInvoices.map((invoice) => (
            <div key={invoice._id} className="invoice-card">
              <div className="invoice-header">
                <div className="invoice-type">
                  <span className={`type-badge ${invoice.clientType === 'فردي' ? 'individual' : 'business'}`}>
                    {invoice.clientType}
                  </span>
                </div>
                <div className="invoice-actions">
                                     <button 
                     className="view-btn"
                     onClick={() => openInvoiceModal(invoice._id)}
                     title="عرض الفاتورة"
                   >
                     <i className="fas fa-eye"></i>
                   </button>
                                     <button 
                     className="edit-btn"
                     onClick={() => navigate(`/invoice/edit/${invoice._id}`)}
                     title="تعديل الفاتورة"
                   >
                     <i className="fas fa-edit"></i>
                   </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteInvoice(invoice._id)}
                    title="حذف الفاتورة"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div className="invoice-content">
                <div className="client-info">
                  <h4>{getClientName(invoice)}</h4>
                  <p>
                    <i className="fas fa-envelope"></i>
                    {invoice.clientType === 'فردي' 
                      ? invoice.clientData.email 
                      : invoice.clientData.email
                    }
                  </p>
                  <p>
                    <i className="fas fa-phone"></i>
                    {invoice.clientType === 'فردي' 
                      ? invoice.clientData.phone 
                      : invoice.clientData.phone
                    }
                  </p>
                  {invoice.clientType === 'تجاري' && (
                    <p>
                      <i className="fas fa-building"></i>
                      {invoice.clientData.businessName}
                    </p>
                  )}
                </div>

                <div className="invoice-details">
                  <div className="products-summary">
                    <h5>المنتجات ({invoice.products.length})</h5>
                    <ul>
                      {invoice.products.slice(0, 3).map((product, index) => (
                        <li key={index}>
                          {product.name} - {product.quantity} قطعة
                        </li>
                      ))}
                      {invoice.products.length > 3 && (
                        <li>و {invoice.products.length - 3} منتجات أخرى...</li>
                      )}
                    </ul>
                  </div>

                  <div className="invoice-total">
                    <span className="total-label">المجموع:</span>
                    <span className="total-amount">
                      {calculateTotal(invoice.products).toFixed(2)} ج.م
                    </span>
                  </div>
                </div>

                <div className="invoice-footer">
                  <span className="invoice-date">
                    <i className="fas fa-calendar"></i>
                    {formatDate(invoice.createdAt)}
                  </span>
                  <span className="invoice-id">
                    رقم الفاتورة: {invoice._id.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          ))}
                 </div>
       )}

       <InvoiceModal 
         isOpen={modalOpen}
         onClose={closeInvoiceModal}
         invoiceId={selectedInvoiceId}
       />
     </div>
   );
 };

export default InvoicesList; 