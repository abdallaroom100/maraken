// إضافة مصروف وهمي عند الضغط على الزر (بدون Backend)
document.getElementById('expense-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('تمت إضافة المصروف (تجريبي)');
});
