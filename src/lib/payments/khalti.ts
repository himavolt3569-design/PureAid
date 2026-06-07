export interface KhaltiPaymentPayload {
  return_url: string;
  website_url: string;
  amount: number;
  purchase_order_id: string;
  purchase_order_name: string;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
}

export async function initiateKhaltiPayment(payload: KhaltiPaymentPayload) {
  // In production, you would fetch this key securely from environment variables
  const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;

  if (!KHALTI_SECRET_KEY) {
    throw new Error('Khalti Secret Key is missing');
  }

  try {
    const response = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to initiate Khalti payment');
    }

    // Returns pidx and payment_url to redirect the user
    return data;
  } catch (error) {
    console.error('Khalti Payment Initiation Error:', error);
    throw error;
  }
}
