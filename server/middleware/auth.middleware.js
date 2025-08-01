import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Token مطلوب للوصول لهذا المورد' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({ 
                message: 'Token غير صحيح' 
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Token غير صحيح' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token منتهي الصلاحية' 
            });
        }
        
        return res.status(500).json({ 
            message: 'حدث خطأ في التحقق من Token' 
        });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ 
                message: 'يجب تسجيل الدخول أولاً' 
            });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({ 
                message: 'ليس لديك صلاحية للوصول لهذا المورد' 
            });
        }

        next();
    };
}; 