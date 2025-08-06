// ملف اختبار نظام دفع الرواتب
// يمكنك تشغيل هذا الملف للتحقق من أن النظام يعمل بشكل صحيح

const testSalaryPayment = async () => {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🧪 بدء اختبار نظام دفع الرواتب...\n');

    try {
        // 1. الحصول على قائمة الرواتب
        console.log('1️⃣ جلب قائمة الرواتب...');
        const salariesResponse = await fetch(`${baseURL}/workers/salaries?year=2025&month=8`);
        const salariesData = await salariesResponse.json();
        
        if (salariesData.success && salariesData.data.length > 0) {
            const salary = salariesData.data[0];
            console.log(`✅ تم العثور على راتب: ${salary.workerId?.name} - ${salary.year}/${salary.month}`);
            console.log(`   الحالة الحالية: ${salary.isPaid ? 'مدفوع' : 'غير مدفوع'}`);
            console.log(`   المبلغ: ${salary.finalSalary} ريال\n`);

            // 2. دفع الراتب
            console.log('2️⃣ محاولة دفع الراتب...');
            const payResponse = await fetch(`${baseURL}/workers/salaries/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN_HERE' // استبدل بالتوكن الحقيقي
                },
                body: JSON.stringify({
                    salaryId: salary._id,
                    paymentMethod: 'cash',
                    notes: 'دفع تجريبي',
                    adminId: null
                })
            });

            const payData = await payResponse.json();
            console.log(`📤 استجابة الدفع: ${payData.message}`);
            console.log(`   النجاح: ${payData.success}`);
            
            if (payData.success) {
                console.log(`   بيانات الدفع:`, payData.data);
            }

            // 3. التحقق من حالة الدفع
            console.log('\n3️⃣ التحقق من حالة الدفع...');
            const statusResponse = await fetch(`${baseURL}/workers/salaries/${salary._id}/payment-status`);
            const statusData = await statusResponse.json();
            
            if (statusData.success) {
                console.log(`✅ حالة الدفع: ${statusData.data.salary.isPaid ? 'مدفوع' : 'غير مدفوع'}`);
                console.log(`   متسق: ${statusData.data.isConsistent}`);
                console.log(`   سجل الدفع: ${statusData.data.payment ? 'موجود' : 'غير موجود'}`);
                console.log(`   سجل المصروفات: ${statusData.data.expense ? 'موجود' : 'غير موجود'}`);
            }

        } else {
            console.log('❌ لم يتم العثور على رواتب للاختبار');
        }

    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error.message);
    }

    console.log('\n🏁 انتهى الاختبار');
};

// تشغيل الاختبار إذا كان الملف يعمل مباشرة
if (typeof window === 'undefined') {
    testSalaryPayment();
}

export { testSalaryPayment }; 