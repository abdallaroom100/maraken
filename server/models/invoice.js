// import mongoose, { Schema } from "mongoose";

// const individualClientSchema = new Schema({
//   fullName: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },

//   addressLine: String,
//   secondAddressLine: String,
//   city: String,
//   country: String,
//   government: String,
//   postalCode: String,
// });


// const businessClientSchema = new Schema({
//     businessName:{
//         type:String,
//         required:true
//     },
//     firstName:{
//         type:String,
//         required:true
//     },
//     lastName:{
//         type:String,
//         required:true
//     },
//     email:{
//         type:String,
//         required:true
//     },
//     phone:{
//         type:String,
//         required:true
//     },
//     addressLine: String,
//   secondAddressLine: String,
//   city: String,
//   country: String,
//   government: String,
//   postalCode: String,
//   commericalRegister:String,
//   taxCard:String
// })

// const invoiceSchema = new Schema(
//   {
//     clientType: {
//       type: String,
//       enum: ["فردي", "تجاري"],
//     },
//     clientData:{
        
//     }
//   },
//   {
//     timestamps: true,
//   }
// );
import mongoose, { Schema } from "mongoose";

// ======================
// Client Schemas
// ======================
const individualClientSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine: String,
  secondAddressLine: String,
  city: String,
  country: String,
  government: String,
  postalCode: String,
}, { _id: false });

const businessClientSchema = new Schema({
  businessName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine: String,
  secondAddressLine: String,
  city: String,
  country: String,
  government: String,
  postalCode: String,
  commericalRegister: String,
  taxCard: String
}, { _id: false });



// ======================
// products schema
// ======================

const productsSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    priceOfPieace:{
        type:String,
        required:true
    },
    quantity:{
        type:String,
        required:true
    },
    description:String,
    discount:Number,
    tax:{
        type:String,
        enum:["","القيمة المضافة"]
    }
       
},{
    _id:false
})
// ======================
// Base Invoice Schema
// ======================
const invoiceBaseSchema = new Schema({
  clientType: {
    type: String,
    required: true
  },
  products:{
    type:[productsSchema],
    required:true
  }
}, { timestamps: true, discriminatorKey: 'clientType' });

const Invoice = mongoose.model('Invoice', invoiceBaseSchema);

// ======================
// Discriminators
// ======================
const IndividualInvoice = Invoice.discriminator("فردي", new Schema({
  clientData: { type: individualClientSchema, required: true }
}));

const BusinessInvoice = Invoice.discriminator("تجاري", new Schema({
  clientData: { type: businessClientSchema, required: true }
}));

export { Invoice, IndividualInvoice, BusinessInvoice };
