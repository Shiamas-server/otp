const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

const KEY_FILE_PATH = './shopify-order-tracking-page-8d0bb599bd3b.json'; // IMPORTANT: Use your actual file name
const SPREADSHEET_ID = '1ahHKCxmGke-osX9DCQvkYISnJuSbyRujJOh4mvkVUhw';
const SHEET_NAME = 'Sheet1';

app.use(express.json());
app.use(cors());

app.post('/api/track_order', async (req, res) => {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
        return res.status(400).json({ message: 'Order number and email are required.' });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:I`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found in the sheet.' });
        }

        const order = rows.slice(1).find(row => {
            // Assuming your columns are in this order: ID#, Order#, Name, Customer Email, Order date, Shipping address, Shipout date, Est arrival date, Shipment status
            const orderId = row[1];
            const customerEmail = row[3];
            return orderId === orderNumber && customerEmail === email;
        });

        if (order) {
            const [
                id,
                orderNum,
                name,
                customerEmail,
                orderDate,
                shippingAddress,
                shipoutDate,
                arrivalDate,
                shipmentStatus
            ] = order;

            const formattedOrder = {
                orderNumber: orderNum,
                shippingAddress: shippingAddress,
                shipoutDate: shipoutDate,
                estimatedArrivalDate: arrivalDate,
                shipmentStatus: shipmentStatus,
            };

            res.json({ order: formattedOrder });
        } else {
            res.status(404).json({ message: 'Order not found. Please check your order number and email.' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});