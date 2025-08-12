import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InvoiceModal from '../components/InvoiceModal';
import './CreateInvoice.css';

interface Product {
  name: string;
  priceOfPieace: string;
  quantity: string;
  description?: string;
  discount?: number;
  tax?: string;
  total?: number;
}

interface IndividualClientData {
  fullName: string;
  email: string;
  phone: string;
  addressLine?: string;
  secondAddressLine?: string;
  city?: string;
  country?: string;
  government?: string;
  postalCode?: string;
}

interface BusinessClientData {
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine?: string;
  secondAddressLine?: string;
  city?: string;
  country?: string;
  government?: string;
  postalCode?: string;
  commericalRegister?: string;
  taxCard?: string;
}

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [clientType, setClientType] = useState<'فردي' | 'تجاري' | ''>('فردي');
  const [products, setProducts] = useState<Product[]>([
    { name: '', priceOfPieace: '', quantity: '', description: '', discount: 0, tax: '', total: 0 }
  ]);
  const [individualClient, setIndividualClient] = useState<IndividualClientData>({
    fullName: '',
    email: '',
    phone: '',
    addressLine: '',
    secondAddressLine: '',
    city: '',
    country: '',
    government: '',
    postalCode: ''
  });
  const [businessClient, setBusinessClient] = useState<BusinessClientData>({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine: '',
    secondAddressLine: '',
    city: '',
    country: '',
    government: '',
    postalCode: '',
    commericalRegister: '',
    taxCard: ''
  });
  const [showPreview, setShowPreview] = useState(false);

  // حساب المجموع لكل منتج
  const calculateProductTotal = (product: Product): number => {
    const price = parseFloat(product.priceOfPieace) || 0;
    const quantity = parseFloat(product.quantity) || 0;
    const discount = product.discount || 0;
    const subtotal = price * quantity;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  // حساب المجموع الكلي
  const calculateGrandTotal = (): number => {
    return products.reduce((total, product) => {
      return total + calculateProductTotal(product);
    }, 0);
  };

  // حساب الضريبة
  const calculateTax = (): number => {
    return products.reduce((total, product) => {
      if (product.tax === 'القيمة المضافة') {
        return total + (calculateProductTotal(product) * 0.15);
      }
      return total;
    }, 0);
  };

  // حساب المجموع النهائي
  const calculateFinalTotal = (): number => {
    return calculateGrandTotal() + calculateTax();
  };

  // تحديث المجموع عند تغيير البيانات
  useEffect(() => {
    const updatedProducts = products.map(product => ({
      ...product,
      total: calculateProductTotal(product)
    }));
    setProducts(updatedProducts);
  }, []);

  // تحديث المجموع عند تغيير بيانات المنتجات
  const updateProductWithTotal = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    updatedProducts[index].total = calculateProductTotal(updatedProducts[index]);
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: '', priceOfPieace: '', quantity: '', description: '', discount: 0, tax: '', total: 0 }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clientData = clientType === 'فردي' ? individualClient : businessClient;
      
      const response = await fetch('/api/invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientType,
          clientData,
          products
        }),
      });

      if (response.ok) {
        
        toast.success('تم إنشاء الفاتورة بنجاح');
        navigate('/invoices-list');
      } else {
        const error = await response.json();
        toast.error(error.error || 'حدث خطأ في إنشاء الفاتورة');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('حدث خطأ في إنشاء الفاتورة');
    }
  };

  const handlePreview = () => {
    if (!clientType) {
      toast.error('يرجى اختيار نوع العميل أولاً');
      return;
    }
    
    // التحقق من البيانات المطلوبة
    if (clientType === 'فردي') {
      if (!individualClient.fullName || !individualClient.email || !individualClient.phone) {
        toast.error('يرجى ملء البيانات المطلوبة للعميل');
        return;
      }
    } else {
      if (!businessClient.firstName || !businessClient.lastName || !businessClient.email || !businessClient.phone || !businessClient.businessName) {
        toast.error('يرجى ملء البيانات المطلوبة للعميل');
        return;
      }
    }

    // التحقق من المنتجات
    for (let i = 0; i < products.length; i++) {
      const { name, priceOfPieace, quantity } = products[i];
      if (!name || !priceOfPieace || !quantity) {
        toast.error(`يرجى ملء البيانات المطلوبة للمنتج رقم ${i + 1}`);
        return;
      }
    }

    setShowPreview(true);
  };

  return (
    <div className="create-invoice-container">
      <div className="create-invoice-header !mb-0 !p-0">
        <h1>إنشاء فاتورة جديدة</h1>
        <div className="header-actions">
          <button 
            className="preview-button"
            onClick={handlePreview}
          >
            <i className="fas fa-eye"></i>
            معاينة
          </button>
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-right"></i>
            رجوع
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invoice-form !p-0 !gap-0">
        {/* اختيار نوع العميل */}
        <div className="form-section !mb-0 !border-none ">
            <div className="container mx-auto max-w-[500px] flex flex-col justify-center items-center whitespace-nowrap">
                 <h3>نوع العميل</h3>
           <div className="client-type-selector">
             <label className={`client-type-option  max-w-[200px] ${clientType === 'فردي' ? 'active' : ''}`}>
               <input
                 type="radio"
                 name="clientType"
                 value="فردي"
                 checked={clientType === 'فردي'}
                 onChange={(e) => setClientType(e.target.value as 'فردي')}
               />
               <span>عميل فردي</span>
             </label>
             <label className={`client-type-option max-w-[200px] ${clientType === 'تجاري' ? 'active' : ''}`}>
               <input
                 type="radio"
                 name="clientType"
                 value="تجاري"
                 checked={clientType === 'تجاري'}
                 onChange={(e) => setClientType(e.target.value as 'تجاري')}
               />
               <span>عميل تجاري</span>
             </label>
           </div>  
            </div>
        
        </div>

        {/* بيانات العميل */}
        {clientType && (
            <div className="form-section !mb-0 !border-none !rounded-none">
            <h3>بيانات العميل</h3>
            <div className="client-data-form">
              {clientType === 'فردي' ? (
                // نموذج العميل الفردي
                <div className="individual-client-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>الاسم الكامل *</label>
                      <input
                        type="text"
                        value={individualClient.fullName}
                        onChange={(e) => setIndividualClient({...individualClient, fullName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>البريد الإلكتروني *</label>
                      <input
                        type="email"
                        value={individualClient.email}
                        onChange={(e) => setIndividualClient({...individualClient, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>رقم الهاتف *</label>
                      <input
                        type="tel"
                        value={individualClient.phone}
                        onChange={(e) => setIndividualClient({...individualClient, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>عنوان الشارع</label>
                      <input
                        type="text"
                        value={individualClient.addressLine}
                        onChange={(e) => setIndividualClient({...individualClient, addressLine: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>عنوان إضافي</label>
                      <input
                        type="text"
                        value={individualClient.secondAddressLine}
                        onChange={(e) => setIndividualClient({...individualClient, secondAddressLine: e.target.value})}
                      />
                    </div>
                  </div>
                
                
                  <div className="form-row">
                    <div className="form-group">
                      <label>المدينة</label>
                      <input
                        type="text"
                        value={individualClient.city}
                        onChange={(e) => setIndividualClient({...individualClient, city: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>المحافظة</label>
                      <input
                        type="text"
                        value={individualClient.government}
                        onChange={(e) => setIndividualClient({...individualClient, government: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>الرمز البريدي</label>
                      <input
                        type="text"
                        value={individualClient.postalCode}
                        onChange={(e) => setIndividualClient({...individualClient, postalCode: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>الدولة</label>
                      <input
                        type="text"
                        value={individualClient.country}
                        onChange={(e) => setIndividualClient({...individualClient, country: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // نموذج العميل التجاري
                <div className="business-client-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>الاسم التجاري *</label>
                      <input
                        type="text"
                        value={businessClient.businessName}
                        onChange={(e) => setBusinessClient({...businessClient, businessName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>الاسم الأول *</label>
                      <input
                        type="text"
                        value={businessClient.firstName}
                        onChange={(e) => setBusinessClient({...businessClient, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>الاسم الأخير *</label>
                      <input
                        type="text"
                        value={businessClient.lastName}
                        onChange={(e) => setBusinessClient({...businessClient, lastName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>البريد الإلكتروني *</label>
                      <input
                        type="email"
                        value={businessClient.email}
                        onChange={(e) => setBusinessClient({...businessClient, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>رقم الهاتف *</label>
                      <input
                        type="tel"
                        value={businessClient.phone}
                        onChange={(e) => setBusinessClient({...businessClient, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
             
                  <div className="form-row">
                    
                    <div className="form-group">
                      <label>عنوان الشارع</label>
                      <input
                        type="text"
                        value={businessClient.addressLine}
                        onChange={(e) => setBusinessClient({...businessClient, addressLine: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>عنوان إضافي</label>
                      <input
                        type="text"
                        value={businessClient.secondAddressLine}
                        onChange={(e) => setBusinessClient({...businessClient, secondAddressLine: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>المدينة</label>
                      <input
                        type="text"
                        value={businessClient.city}
                        onChange={(e) => setBusinessClient({...businessClient, city: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>المحافظة</label>
                      <input
                        type="text"
                        value={businessClient.government}
                        onChange={(e) => setBusinessClient({...businessClient, government: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>الرمز البريدي</label>
                      <input
                        type="text"
                        value={businessClient.postalCode}
                        onChange={(e) => setBusinessClient({...businessClient, postalCode: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                   
                    <div className="form-group">
                      <label>السجل التجاري</label>
                      <input
                        type="text"
                        value={businessClient.commericalRegister}
                        onChange={(e) => setBusinessClient({...businessClient, commericalRegister: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>البطاقة الضريبية</label>
                      <input
                        type="text"
                        value={businessClient.taxCard}
                        onChange={(e) => setBusinessClient({...businessClient, taxCard: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* المنتجات */}
        <div className="form-section !mb-0 !border-none !rounded-none">
          <div className="section-header">
            <h3>المنتجات</h3>
            <button type="button" className="add-product-btn" onClick={addProduct}>
              <i className="fas fa-plus"></i>
              إضافة
            </button>
          </div>
          
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th className="item-header">
                    <div className="header-content">
                      <span>البند</span>
                      <div className="sort-buttons">
                        <i className="fas fa-chevron-up"></i>
                        <i className="fas fa-chevron-down"></i>
                      </div>
                    </div>
                  </th>
                  <th>الوصف</th>
                  <th>سعر الوحدة</th>
                  <th>الكمية</th>
                  <th>الخصم %</th>
                  <th>الضريبة</th>
                  <th>المجموع</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="item-cell">
                      <div className="item-content">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProductWithTotal(index, 'name', e.target.value)}
                          placeholder="اسم المنتج"
                          className="item-input"
                        />
                        <div className="item-status">
                          <span className="status-badge">بند غير مضاف (إضافة منتج جديد)</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <textarea
                        value={product.description || ''}
                        onChange={(e) => updateProductWithTotal(index, 'description', e.target.value)}
                        placeholder="وصف المنتج..."
                        className="description-textarea"
                        rows={2}
                      />
                    </td>
                    <td>
                                              <input
                          type="number"
                          step="0.01"
                          value={product.priceOfPieace}
                          onChange={(e) => updateProductWithTotal(index, 'priceOfPieace', e.target.value)}
                          placeholder="0.00"
                          className="price-input"
                        />
                    </td>
                    <td>
                                              <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProductWithTotal(index, 'quantity', e.target.value)}
                          placeholder="0"
                          className="quantity-input"
                        />
                    </td>
                    <td>
                      <div className="discount-input-container">
                                                  <input
                            type="number"
                            step="0.01"
                            value={product.discount || 0}
                            onChange={(e) => updateProductWithTotal(index, 'discount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="discount-input"
                          />
                        <span className="discount-symbol">%</span>
                      </div>
                    </td>
                    <td>
                                              <select
                          value={product.tax || ''}
                          onChange={(e) => updateProductWithTotal(index, 'tax', e.target.value)}
                          className="tax-select"
                        >
                        <option value="">بدون ضريبة</option>
                        <option value="القيمة المضافة">القيمة المضافة (15%)</option>
                      </select>
                    </td>
                    <td className="total-cell">
                      <span className="total-amount">
                        {calculateProductTotal(product).toFixed(2)} ج.م
                      </span>
                    </td>
                    <td>
                      {products.length > 1 && (
                        <button
                          type="button"
                          className="remove-product-btn"
                          onClick={() => removeProduct(index)}
                          title="حذف المنتج"
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص الفاتورة */}
          <div className="invoice-summary">
            <div className="summary-row">
              <span className="summary-label">الإجمالي:</span>
              <span className="summary-value">{calculateGrandTotal().toFixed(2)} ج.م</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">القيمة المضافة (15%):</span>
              <span className="summary-value">{calculateTax().toFixed(2)} ج.م</span>
            </div>
            <div className="summary-row total-row">
              <span className="summary-label">الإجمالي:</span>
              <span className="summary-value">{calculateFinalTotal().toFixed(2)} ج.م</span>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
            إلغاء
          </button>
          <button type="submit" className="submit-btn">
            <i className="fas fa-save"></i>
            إنشاء الفاتورة
          </button>
        </div>
      </form>

      {/* Modal المعاينة */}
      <InvoiceModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        invoiceId={null}
        previewData={{
          clientType: clientType as 'فردي' | 'تجاري',
          clientData: clientType === 'فردي' ? individualClient : businessClient,
          products,
          createdAt: new Date().toISOString()
        }}
      />
    </div>
  );
};

export default CreateInvoice; 