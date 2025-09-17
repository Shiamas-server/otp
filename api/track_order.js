import { google } from "googleapis";

const SPREADSHEET_ID = "1ahHKCxmGke-osX9DCQvkYISnJuSbyRujJOh4mvkVUhw";
const SHEET_NAME = "Sheet1";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  const { orderNumber, email } = req.body;

  if (!orderNumber || !email) {
    return res
      .status(400)
      .json({ message: "Order number and email are required." });
  }

  try {
    // ✅ 用環境變數 (不需要 JSON 憑證檔)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});


    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No data found in the sheet." });
    }

    const order = rows.slice(1).find((row) => {
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
    shipmentStatus,
  ] = order;

  // Add a check to ensure shippingAddress is a string before replacing newlines
const formattedShippingAddress = shippingAddress.replace(/\n/g, '<br>');

  const formattedOrder = {
    orderNumber: orderNum,
    shippingAddress: formattedShippingAddress, // Use the checked value
    shipoutDate: shipoutDate,
    estimatedArrivalDate: arrivalDate,
    shipmentStatus: shipmentStatus,
  };

  return res.json({ order: formattedOrder });
} else {
      return res.status(404).json({
        message: "Order not found. Please check your order number and email.",
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
}
