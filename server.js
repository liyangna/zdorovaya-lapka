const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// ============================================================
// 从环境变量读取配置，如果没有则使用硬编码的测试值
// ============================================================
const SHOP_ID = process.env.SHOP_ID || '1367464';
const SECRET_KEY = process.env.SECRET_KEY || 'test_EN-raAsqyqfDne6g3pGfkqahT_q_J9ebQ0RBhgIhz9k';

console.log('========================================');
console.log('ЮKassa Payment Server Starting...');
console.log('SHOP_ID:', SHOP_ID);
console.log('SECRET_KEY:', SECRET_KEY ? SECRET_KEY.substring(0, 15) + '...' : 'NOT SET');
console.log('========================================');

// API: 创建支付
app.post('/api/create-payment', async (req, res) => {
    const { amount, description } = req.body;
    
    console.log(`📥 Получен запрос: ${description}, сумма: ${amount} ₽`);
    
    const paymentData = {
        amount: { value: amount.toString(), currency: 'RUB' },
        confirmation: { type: 'embedded' },
        capture: true,
        description: description || 'Оплата услуг ветеринарной клиники'
    };
    
    try {
        const response = await fetch('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Idempotence-Key': uuidv4(),
                'Authorization': 'Basic ' + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64')
            },
            body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('❌ ЮKassa ошибка:', data);
            return res.status(response.status).json({ 
                success: false, 
                error: data.description || 'Ошибка платежного шлюза' 
            });
        }
        
        console.log(`✅ Платеж создан! ID: ${data.id}`);
        res.json({ 
            success: true, 
            confirmation_token: data.confirmation.confirmation_token, 
            payment_id: data.id 
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('');
    console.log(`✅ Сервер успешно запущен!`);
    console.log(`   Адрес: http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Тест оплаты: http://localhost:${PORT}/payment.html?amount=100&service=Тест`);
    console.log('');
});