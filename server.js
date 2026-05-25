// 加载环境变量（如果存在 .env 文件）
require('dotenv').config();

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// ============================================================
// 重要：从环境变量读取配置，如果没有则使用硬编码的测试值
// 注意：测试密钥仅用于作业演示，生产环境请务必使用环境变量！
// ============================================================
const SHOP_ID = process.env.SHOP_ID || '1367464';
const SECRET_KEY = process.env.SECRET_KEY || 'test_EN-raAsqyqfDne6g3pGfkqahT_q_J9ebQ0RBhgIhz9k';

// 打印配置信息（密钥只显示前几位，用于调试）
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
        
        // 检查 ЮKassa 是否返回错误
        if (!response.ok) {
            console.error('❌ ЮKassa 错误:', data);
            return res.status(response.status).json({ 
                success: false, 
                error: data.description || '支付网关错误' 
            });
        }
        
        console.log(`✅ 支付创建成功! ID: ${data.id}`);
        res.json({ 
            success: true, 
            confirmation_token: data.confirmation.confirmation_token, 
            payment_id: data.id 
        });
        
    } catch (error) {
        console.error('❌ 服务器错误:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 健康检查接口（用于 Render 验证服务是否正常运行）
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