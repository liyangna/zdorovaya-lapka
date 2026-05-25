// 在文件最开头添加
require('dotenv').config();

const SHOP_ID = process.env.SHOP_ID;
const SECRET_KEY = process.env.SECRET_KEY;

console.log('SHOP_ID:', SHOP_ID);

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(express.static('.'));

const SHOP_ID = '1367464';
const SECRET_KEY = 'test_EN-raAsqyqfDne6g3pGfkqahT_q_J9ebQ0RBhgIhz9k';

app.post('/api/create-payment', async (req, res) => {
    const { amount, description } = req.body;
    
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
        res.json({ success: true, confirmation_token: data.confirmation.confirmation_token, payment_id: data.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Тест оплаты: http://localhost:${PORT}/payment.html?amount=100&service=Тест`);
});