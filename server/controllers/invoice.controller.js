import { response } from "express";
import { IndividualInvoice, BusinessInvoice, Invoice } from "../models/invoice.js";

const careateIndividualClient = async (clientData, products, req) => {
  try {
    const {
      fullName,
      email,
      phone,
    } = clientData;
    if (!fullName || !email || !phone) {
      return "من فضلك قم بملئ الحقول المطلوبه";
    }
    
    for(let i = 0 ; i < products.length ; i++){
     const {name,priceOfPieace,quantity} = products[i]
     if(!name || !priceOfPieace || !quantity){
        return `من فضلك قم بملئ الحقول المطلوبه للمنتج رقم ${i+1}`
     }
    }
    const newClient = await IndividualInvoice.create({
      clientType: "فردي",
      clientData,
      products: products,
    });

    req.newClient = newClient
    return null
  } catch (error) {
    console.log(error)
    return "حدث خطأ في إنشاء الفاتورة"
  }
};
const createBusinessClient = async (clientData, products, req) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
    } = clientData;
    if (!firstName || !lastName || !email || !phone) {
      return "من فضلك قم بملئ الحقول المطلوبه";
    }
    
    for(let i = 0 ; i < products.length ; i++){
     const {name,priceOfPieace,quantity} = products[i]
     if(!name || !priceOfPieace || !quantity){
        return `من فضلك قم بملئ الحقول المطلوبه للمنتج رقم ${i+1}`
     }
    }
    const newClient =  await BusinessInvoice.create({
      clientType: "تجاري",
      clientData,
      products: products,
    });

    req.newClient = newClient
    return null
    
  } catch (error) {
    console.log(error)
    return "حدث خطأ في إنشاء الفاتورة"
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { clientType, clientData, products } = req.body;

    let createClientError 
    if(clientType == "فردي"){
     
      createClientError = await careateIndividualClient(clientData,products,req)
    } else if(clientType == "تجاري"){
      createClientError = await createBusinessClient(clientData,products,req)
    } else {
        return res.status(400).json({erorr:"نوع العميل غير معروف"})
    }
    if(typeof createClientError == "string"){
        return res.status(400).json({error:createClientError})
    }
    
    return res.status(200).json(req?.newClient)
  } catch (error) {
    console.log(error.message);
    console.log("error in create invoice controller");
    return res.status(500).json({error: "حدث خطأ في إنشاء الفاتورة"})
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const allInvoices = await Invoice.find().sort({ createdAt: -1 });
    return res.status(200).json(allInvoices);
  } catch (error) {
    console.log(error.message);
    console.log("error in get all invoices controller");
    return res.status(500).json({error: "حدث خطأ في جلب الفواتير"})
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    
    if (!deletedInvoice) {
      return res.status(404).json({error: "الفاتورة غير موجودة"});
    }
    
    return res.status(200).json({message: "تم حذف الفاتورة بنجاح"});
  } catch (error) {
    console.log(error.message);
    console.log("error in delete invoice controller");
    return res.status(500).json({error: "حدث خطأ في حذف الفاتورة"})
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ error: "الفاتورة غير موجودة" });
    }
    return res.status(200).json(invoice);
  } catch (error) {
    console.log(error.message);
    console.log("error in get invoice by id controller");
    return res.status(500).json({ error: "حدث خطأ في جلب الفاتورة" });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientType, clientData, products } = req.body;

    // التحقق من وجود الفاتورة
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return res.status(404).json({ error: "الفاتورة غير موجودة" });
    }

    // التحقق من صحة البيانات
    if (clientType === 'فردي') {
      const { fullName, email, phone } = clientData;
      if (!fullName || !email || !phone) {
        return res.status(400).json({ error: "من فضلك قم بملئ الحقول المطلوبه" });
      }
    } else if (clientType === 'تجاري') {
      const { firstName, lastName, email, phone, businessName } = clientData;
      if (!firstName || !lastName || !email || !phone || !businessName) {
        return res.status(400).json({ error: "من فضلك قم بملئ الحقول المطلوبه" });
      }
    } else {
      return res.status(400).json({ error: "نوع العميل غير معروف" });
    }

    // التحقق من المنتجات
    for (let i = 0; i < products.length; i++) {
      const { name, priceOfPieace, quantity } = products[i];
      if (!name || !priceOfPieace || !quantity) {
        return res.status(400).json({ error: `من فضلك قم بملئ الحقول المطلوبه للمنتج رقم ${i + 1}` });
      }
    }

    // تحديث الفاتورة
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        clientType,
        clientData,
        products
      },
      { new: true }
    );

    return res.status(200).json(updatedInvoice);
  } catch (error) {
    console.log(error.message);
    console.log("error in update invoice controller");
    return res.status(500).json({ error: "حدث خطأ في تحديث الفاتورة" });
  }
};
