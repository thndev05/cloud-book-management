require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const { readConnection, writeConnection } = require('./database');

const app = express();

const PORT = process.env.PORT || 3000;

// ========================
// Personalization
// ========================

const FULL_NAME = 'Trần Hoàng Nhật';
const MSSV = '23IT199';

const PRODUCT_PREFIX = MSSV.slice(-3);
const VAT_RATE = Number(MSSV.slice(-1)) + 5;

// ========================
// Middleware
// ========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'hbs');

// ========================
// Stateless Session
// ========================

app.use(
    session({
        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_SESSION_URI,
            dbName: 'DB_23IT199',
            collectionName: 'sessions'
        }),

        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }
    })
);

// ========================
// GET /
// ========================

app.get('/', (req, res) => {
    res.redirect('/books');
});

// ========================
// GET /books
// READ account
// ========================

app.get('/books', async (req, res) => {
    try {
        const books = await readConnection
            .db
            .collection('books')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.render('index', {
            books,
            fullName: FULL_NAME,
            mssv: MSSV,
            vat: VAT_RATE
        });

    } catch (error) {
        console.error(error);

        res.status(500).send('Không thể đọc dữ liệu sách');
    }
});

// ========================
// POST /books
// WRITE account
// ========================

app.post('/books', async (req, res) => {
    try {
        const {
            productCode,
            name,
            price
        } = req.body;

        // ------------------------
        // Validate required fields
        // ------------------------

        if (!productCode || !name || !price) {
            return res.status(400).send(
                'Vui lòng nhập đầy đủ thông tin'
            );
        }

        // ------------------------
        // Validate product prefix
        // ------------------------

        if (!productCode.startsWith(PRODUCT_PREFIX)) {
            return res.status(400).send(
                `Mã sản phẩm phải bắt đầu bằng ${PRODUCT_PREFIX}`
            );
        }

        const originalPrice = Number(price);

        if (Number.isNaN(originalPrice) || originalPrice <= 0) {
            return res.status(400).send(
                'Giá sản phẩm không hợp lệ'
            );
        }

        // ------------------------
        // Calculate VAT
        // ------------------------

        const vatAmount = originalPrice * VAT_RATE / 100;

        const finalPrice = originalPrice + vatAmount;

        // ------------------------
        // Save session
        // ------------------------

        req.session.lastAction = 'CREATE_BOOK';

        // ------------------------
        // Save book
        // WRITE account
        // ------------------------

        await writeConnection
            .db
            .collection('books')
            .insertOne({
                productCode,
                name,

                price: originalPrice,

                vatRate: VAT_RATE,

                vatAmount,

                finalPrice,

                createdAt: new Date()
            });

        res.redirect('/books');

    } catch (error) {
        console.error(error);

        res.status(500).send(
            'Không thể thêm sách'
        );
    }
});

// ========================
// Start server
// ========================

app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});