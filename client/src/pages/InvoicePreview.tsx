import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './InvoicePreview.css';

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

const InvoicePreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/${id}`);
        if (!res.ok) throw new Error('Invoice not found');
        const data = await res.json();
        setInvoice(data);
      } catch (e) {
        navigate('/invoices-list');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const calcProductTotal = (p: Product) => {
    const price = parseFloat(p.priceOfPieace) || 0;
    const qty = parseFloat(p.quantity) || 0;
    const discount = p.discount || 0;
    const subtotal = price * qty;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const subtotal = invoice?.products.reduce((t, p) => t + calcProductTotal(p), 0) || 0;
  const vat = invoice?.products.reduce((t, p) => t + (p.tax === 'القيمة المضافة' ? calcProductTotal(p) * 0.14 : 0), 0) || 0;
  const grand = subtotal + vat;

  const printPdf = () => {
    window.print();
  };

  if (loading) return <div className="invoice-preview-container"><p>جاري التحميل...</p></div>;
  if (!invoice) return null;

  const clientName = invoice.clientType === 'فردي'
    ? invoice.clientData.fullName
    : `${invoice.clientData.firstName} ${invoice.clientData.lastName}`;

  return (
    <div className="invoice-preview-container">
      <div className="preview-actions no-print">
        <button onClick={() => navigate(-1)} className="back-btn"><i className="fas fa-arrow-right"></i> رجوع</button>
        <button onClick={printPdf} className="print-btn"><i className="fas fa-file-pdf"></i> حفظ PDF / طباعة</button>
      </div>

      <div className="invoice-a4">
        <div className="header">
          <div className="title">عروض الأسعار</div>
          <div className="brand-mark" />
        </div>

        <div className="parties">
          <div className="to">
            <div className="label">إلى:</div>
            <div className="name">{clientName}</div>
            {invoice.clientType === 'تجاري' && invoice.clientData.businessName && (
              <div className="business">{invoice.clientData.businessName}</div>
            )}
            <div className="addr">{invoice.clientData.city || ''}، {invoice.clientData.government || ''}</div>
            <div className="addr">{invoice.clientData.country || ''} {invoice.clientData.postalCode || ''}</div>
          </div>
          <div className="from">
            <div className="label">الورد</div>
            <div className="name">بحواري الحمرزة</div>
            <div className="addr">أبها، السعودية</div>
            <div className="addr">13795</div>
          </div>
        </div>

        <div className="meta">
          <div>عرض الأسعار# {invoice._id.slice(-6)}</div>
          <div>تاريخ عرض الأسعار: {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</div>
        </div>

        <table className="items">
          <thead>
            <tr>
              <th>البند</th>
              <th>التفاصيل</th>
              <th>سعر الوحدة</th>
              <th>الكمية</th>
              <th>الخصم</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{p.description || '-'}</td>
                <td>{parseFloat(p.priceOfPieace || '0').toFixed(2)}</td>
                <td>{p.quantity}</td>
                <td>{p.discount ? `${p.discount}%` : '-'}</td>
                <td>{calcProductTotal(p).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="row"><span>المجموع:</span><span>{subtotal.toFixed(2)} ج.م</span></div>
          <div className="row"><span>القيمة المضافة (14%):</span><span>{vat.toFixed(2)} ج.م</span></div>
          <div className="row grand"><span>الإجمالي:</span><span>{grand.toFixed(2)} ج.م</span></div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview; 