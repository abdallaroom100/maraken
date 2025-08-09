import React, { useEffect, useState } from 'react';
import './InvoiceModal.css';

interface Product {
  name: string;
  priceOfPieace: string;
  quantity: string;
  description?: string;
  discount?: number;
  tax?: string;
}

interface Invoice {
  _id: string;
  clientType: 'فردي' | 'تجاري';
  clientData: any;
  products: Product[];
  createdAt: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  previewData?: {
    clientType: 'فردي' | 'تجاري';
    clientData: any;
    products: Product[];
    createdAt: string;
  };
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoiceId, previewData }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (previewData) {
        // استخدام البيانات المعاينة
        setInvoice({
          ...previewData,
          _id: 'preview-' + Date.now() // ID مؤقت للمعاينة
        });
        setLoading(false);
      } else if (invoiceId) {
        // جلب البيانات من API
        fetchInvoice();
      }
    }
  }, [isOpen, invoiceId, previewData]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoice/${invoiceId}`);
      if (!res.ok) throw new Error('Invoice not found');
      const data = await res.json();
      setInvoice(data);
    } catch (e) {
      console.error('Error fetching invoice:', e);
    } finally {
      setLoading(false);
    }
  };

  const calcProductTotal = (p: Product) => {
    const price = parseFloat(p.priceOfPieace) || 0;
    const qty = parseFloat(p.quantity) || 0;
    const discount = p.discount || 0;
    const subtotal = price * qty;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const subtotal = invoice?.products.reduce((t, p) => t + calcProductTotal(p), 0) || 0;
  // const vat = invoice?.products.reduce((t, p) => t + (p.tax === 'القيمة المضافة' ? calcProductTotal(p) * 0.14 : 0), 0) || 0;
 

  const printPdf = () => {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (printWindow && invoice) {
      const clientName = invoice.clientType === 'فردي'
        ? invoice.clientData.fullName
        : `${invoice.clientData.firstName} ${invoice.clientData.lastName}`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>عرض الأسعار</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700&display=swap');
            
            body { 
              font-family: 'Tajawal', Arial, sans-serif; 
              margin: 0; 
              padding: 30px; 
              background: white;
              color: #333;
            }
            
            .document-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            
            .main-title {
              text-align: center;
              margin-bottom: 30px;
            }
            
            .main-title h1 {
              font-size: 28px;
              font-weight: 700;
              color: #1e40af;
              margin: 0;
            }
            
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 40px; 
              border-bottom: 2px solid #e0e7ff;
              padding-bottom: 20px;
            }
            
            .title { 
              font-size: 28px; 
              font-weight: 700; 
              color: #1e40af;
            }
            
            .logo-section {
              text-align: center;
            }
            
            .logo-text {
              font-size: 18px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 5px;
            }
            
            .company-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            
            .company-logo-section {
              display: flex;
              align-items: flex-start;
              text-align: right;
            }
            
            .company-details {
              text-align: right;
            }
            
            .company-name {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 5px;
              color: #1e293b;
            }
            
            .company-sub {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 3px;
            }
            
            .document-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              font-size: 14px;
              flex-direction:row-reverse;
              color: #64748b;
            }
            .client-flex{
            display:flex;
            }
            .offer-details {
              text-align: right;
          
            }
            
            .detail-item {
              margin-bottom: 5px;
            }
            
            .detail-label {
              font-weight: 600;
              color: #374151;
              margin-right: 8px;
            }
            
            .detail-value {
              color: #1e293b;
            }
            
            .client-details {
              text-align: right;
            }
            
            .client-phone {
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 5px;
            }
            
            .client-address {
              color: #64748b;
              font-size: 14px;
            }
            
            .client-info {
              text-align: right;
            }
            
            .client-label {
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            
            .client-name {
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 5px;
            }
            
            .client-details {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 3px;
            }
            
            .items { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 25px 0; 
              font-size: 14px;
            }
            
            .items th, .items td { 
              padding: 12px 8px; 
              border: 1px solid #e5e7eb; 
              text-align: right; 
              vertical-align: top;
            }
            
            .items th { 
              background: #f8fafc; 
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .items td {
              color: #1e293b;
            }
            
            .items tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .totals { 
              width: 350px; 
              margin-top: 25px; 
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .totals .row { 
              display: flex; 
              justify-content: space-between; 
              padding: 12px 16px; 
              border-bottom: 1px solid #e5e7eb;
              background: #f8fafc;
            }
            
            .totals .row:last-child {
              border-bottom: none;
            }
            
            .totals .row.grand { 
              background: #1e40af; 
              color: white; 
              font-weight: 700;
              font-size: 16px;
            }
            
            @media print {
              body { margin: 0; padding: 20px; }
              .document-container { max-width: none; }
            }
          </style>
        </head>
                  <body>
            <div class="document-container">
              
              
              <div class="company-info">
              <div class="company-logo-section">
                <img src="/img/maraken.jpg" alt="مراكن الورد" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin-left: 15px;" />
                <div class="company-details">
                  <div class="company-name">مؤسسه وادي الدرر للمقاولات</div>
                  <div class="company-sub">مراكن الورد</div>
                  <div class="company-sub">سجل تجاري: 4031360492</div>
                  <div class="company-sub">الرقم الضريبي: 300527769300003</div>
                  <div class="company-sub">جده</div>
                  <div class="company-sub">جده، المنطقه الغربيه 2136</div>
                </div>
              </div>
            <div class="client-flex" >
            
            </div>
            </div>
              
            
            <hr style="border: none; height: 2px; background: #e0e7ff; margin: 30px 0;" />
           
            
            <div class="document-meta">
              <div class="offer-details" >
                <div class="detail-item">
                  <span class="detail-label">رقم عرض الاسعار:</span>
                  <span class="detail-value">${invoice._id.slice(-6)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">تاريخ عرض الاسعار:</span>
                  <span class="detail-value">${new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
             <div class="client-flex">
             <div class="client-label">فاتورة إلى:</div>
             <div class="client-info">
              <div class="client-name">${clientName}</div>
              ${invoice.clientType === 'تجاري' && invoice.clientData.businessName ? `<div class="client-details">${invoice.clientData.businessName}</div>` : ''}
              <div class="client-phone">${invoice.clientData.phone || ''}</div>
              <div class="client-address">${[invoice.clientData.city, invoice.clientData.government, invoice.clientData.country, invoice.clientData.postalCode].filter(Boolean).join('، ')}</div>
             </div>
             </div>

            </div>
            
            <table class="items">
              <thead>
                <tr>
                  <th>البند</th>
                  <th>الوصف</th>
                  <th>سعر الوحدة</th>
                  <th>الكمية</th>
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.products.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.description || '-'}</td>
                    <td>${parseFloat(p.priceOfPieace || '0').toFixed(2)}</td>
                    <td>${p.quantity}</td>
                    <td>${calcProductTotal(p).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="row">
                <span>المجموع:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div class="row">
                <span>VAT (15%):</span>
                <span>${(subtotal * 0.15).toFixed(2)}</span>
              </div>
              <div class="row grand">
                <span>الإجمالي:</span>
                <span>${(subtotal * 1.15).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>معاينة الفاتورة</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>جاري تحميل الفاتورة...</p>
            </div>
          ) : invoice ? (
            <div className="invoice-preview">
              {/* Header Section */}
              <div className="invoice-header">
                <div className="company-logo">
                  <div className="logo-placeholder">
                    <img src="/img/maraken.jpg" alt="مراكن الورد" className="logo-image" />
                  </div>
                 
                </div>
                <div className="company-info">
                  <div className="company-name">مؤسسه وادي الدرر للمقاولات</div>
                  <div className="company-sub">مراكن الورد</div>
                  <div className="company-details">سجل تجاري: 4031360492</div>
                  <div className="company-details">الرقم الضريبي: 300527769300003</div>
                  <div className="company-details">جده, جده المنطقه الغربيه 2136</div>
                </div>
              </div>

              {/* Main Title */}
              <div className="main-title">
                <h1>عرض الاسعار</h1>
              </div>

              {/* Document Details */}
              <div className="document-details">
                <div className="offer-details">
                  <div className="detail-item">
                    <span className="detail-label">رقم عرض الاسعار:</span>
                    <span className="detail-value">{invoice._id.slice(-6)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">تاريخ عرض الاسعار:</span>
                    <span className="detail-value">{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div className="client-details">
                  <div className="detail-label">فاتورة إلى:</div>
                  <div className="client-name">{invoice.clientType === 'فردي' ? invoice.clientData.fullName : `${invoice.clientData.firstName} ${invoice.clientData.lastName}`}</div>
                  {invoice.clientType === 'تجاري' && invoice.clientData.businessName && (
                    <div className="client-details">{invoice.clientData.businessName}</div>
                  )}
                  <div className="client-phone">{invoice.clientData.phone || ''}</div>
                  <div className="client-address">{[invoice.clientData.city, invoice.clientData.government, invoice.clientData.country, invoice.clientData.postalCode].filter(Boolean).join('، ')}</div>
                </div>
              </div>

              {/* Products Table */}
              <table className="products-table">
                <thead>
                  <tr>
                    <th>البند</th>
                    <th>الوصف</th>
                    <th>سعر الوحدة</th>
                    <th>الكمية</th>
                    <th>المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.products.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.description || '-'}</td>
                      <td className="price-cell">{parseFloat(p.priceOfPieace || '0').toFixed(2)}</td>
                      <td className="quantity-cell">{p.quantity}</td>
                      <td className="total-cell">{calcProductTotal(p).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Section */}
              <div className="summary-section">
                <div className="summary-row">
                  <span className="summary-label">المجموع:</span>
                  <span className="summary-value">{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">VAT (15%):</span>
                  <span className="summary-value">{(subtotal * 0.15).toFixed(2)}</span>
                </div>
                <div className="summary-row grand-total">
                  <span className="summary-label">الإجمالي:</span>
                  <span className="summary-value">{(subtotal * 1.15).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>حدث خطأ في تحميل الفاتورة</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="print-btn" onClick={printPdf}>
            <i className="fas fa-file-pdf"></i>
            حفظ PDF / طباعة
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal; 