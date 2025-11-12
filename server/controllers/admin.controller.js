import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";

export const signupAdmin = async (req, res) => {
    const { name, email, password, role } = req.body;
    
    try {
        // التحقق من وجود جميع الحقول المطلوبة
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                message: "جميع الحقول مطلوبة",
                missingFields: {
                    name: !name,
                    email: !email,
                    password: !password,
                    role: !role
                }
            });
        }

        // التحقق من طول الاسم
        if (name.trim().length < 2) {
            return res.status(400).json({ 
                message: "الاسم يجب أن يكون حرفين على الأقل" 
            });
        }

        // التحقق من صحة البريد الإلكتروني
        if (!validator.isEmail(email)) {
            return res.status(400).json({ 
                message: "البريد الإلكتروني غير صحيح" 
            });
        }

        // التحقق من طول كلمة المرور
        if (password.length < 6) {
            return res.status(400).json({ 
                message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" 
            });
        }

        // التحقق من صحة الدور
        if (role !== "moderator" && role !== "manager") {
            return res.status(400).json({ 
                message: "الدور غير صحيح. يجب أن يكون 'moderator' أو 'manager'" 
            });
        }

        // التحقق من عدم وجود البريد الإلكتروني مسبقاً
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ 
                message: "البريد الإلكتروني مستخدم بالفعل" 
            });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // إنشاء المدير الجديد
        const admin = await Admin.create({ 
            name: name.trim(), 
            email: email.toLowerCase(), 
            password: hashedPassword, 
            role 
        });

        // إزالة كلمة المرور من الاستجابة
        const adminResponse = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt
        };

        res.status(201).json({ 
            message: "تم إنشاء الحساب بنجاح",
            admin: adminResponse 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // التحقق من وجود البريد الإلكتروني وكلمة المرور
        if (!email || !password) {
            return res.status(400).json({ 
                message: "البريد الإلكتروني وكلمة المرور مطلوبان" 
            });
        }

        // التحقق من صحة البريد الإلكتروني
        if (!validator.isEmail(email)) {
            return res.status(400).json({ 
                message: "البريد الإلكتروني غير صحيح" 
            });
        }

        // البحث عن المدير
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ 
                message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
            });
        }

        // التحقق من كلمة المرور
        const isPasswordCorrect = await bcrypt.compare(password, admin.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ 
                message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
            });
        }

        // إنشاء JWT token
        const token = jwt.sign(
            { 
                id: admin._id,
                email: admin.email,
                role: admin.role 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // إزالة كلمة المرور من الاستجابة
        const adminResponse = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt
        };

        res.status(200).json({ 
            message: "تم تسجيل الدخول بنجاح",
            ...adminResponse,
            token 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const getCurrentAdmin = async (req, res) => {
    try {
        // المدير موجود في req.admin من middleware
        const adminResponse = {
            _id: req.admin._id,
            name: req.admin.name,
            email: req.admin.email,
            role: req.admin.role,
            createdAt: req.admin.createdAt
        };

        res.status(200).json({ 
            message: "تم جلب معلومات المدير بنجاح",
            admin: adminResponse 
        });
    } catch (error) {
        console.error('Get current admin error:', error);
        res.status(500).json({ 
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const listAdmins = async (req, res) => {
    try {
        const filters = {};
        if (req.query.role) {
            filters.role = req.query.role;
        }

        const admins = await Admin.find(filters)
            .sort({ name: 1 })
            .select("_id name role createdAt");

        res.status(200).json({ admins });
    } catch (error) {
        console.error('List admins error:', error);
        res.status(500).json({
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};