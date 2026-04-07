import axios from 'axios';

/**
 * Ensures the user has the 'payments' scope before creating a payment.
 * Pi SDK requires explicit authentication with payments scope at point of purchase.
 */
const ensurePaymentsScope = async () => {
    if (typeof window.Pi === 'undefined') {
        throw new Error("Buka melalui Pi Browser untuk melakukan pembayaran.");
    }

    const scopes = ['username', 'payments'];
    await window.Pi.authenticate(scopes, async (payment) => {
        console.log("Incomplete payment found:", payment);
        try {
            await axios.post(route('pi.approve'), { paymentId: payment.identifier });
        } catch (e) { console.error(e); }
    });
};

export const createPiPayment = async (productId, discountCode = null, addressId = null) => {
    try {
        // Step 1: Ensure payments scope
        await ensurePaymentsScope();

        // Step 2: Create order on server
        const response = await axios.post(route('pi.create-order'), {
            product_id: productId,
            discount_code: discountCode,
            address_id: addressId
        });

        const { amount, memo, order_id } = response.data;

        // Step 3: Create Pi payment
        const payment = await window.Pi.createPayment({
            amount: amount,
            memo: memo,
            metadata: { productId, discountCode, addressId, order_id },
        }, {
            onReadyForServerApproval: async (paymentId) => {
                await axios.post(route('pi.approve'), { paymentId, order_id });
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
                await axios.post(route('pi.complete'), { paymentId, txid, order_id });
            },
            onCancel: (paymentId) => {
                return axios.post(route('pi.cancel'), { paymentId });
            },
            onError: (error, payment) => {
                console.error("Pi Payment Error:", error);
                if (payment) {
                    axios.post(route('pi.cancel'), { paymentId: payment.identifier });
                }
            },
        });

        return payment;
    } catch (error) {
        console.error("Payment initiation failed:", error);
        throw error;
    }
};

export const createCartPiPayment = async (discountCode = null, addressId = null) => {
    try {
        // Step 1: Ensure payments scope
        await ensurePaymentsScope();

        // Step 2: Create order on server
        const response = await axios.post(route('pi.create-order'), {
            cart_checkout: true,
            discount_code: discountCode,
            address_id: addressId
        });

        const { amount, memo, order_id } = response.data;

        // Step 3: Create Pi payment
        const payment = await window.Pi.createPayment({
            amount: amount,
            memo: memo,
            metadata: { cartCheckout: true, discountCode, addressId, order_id },
        }, {
            onReadyForServerApproval: async (paymentId) => {
                await axios.post(route('pi.approve'), { paymentId, order_id });
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
                await axios.post(route('pi.complete'), { paymentId, txid, order_id });
            },
            onCancel: (paymentId) => {
                return axios.post(route('pi.cancel'), { paymentId });
            },
            onError: (error, payment) => {
                console.error("Cart Pi Payment Error:", error);
                if (payment) {
                    axios.post(route('pi.cancel'), { paymentId: payment.identifier });
                }
            },
        });

        return payment;
    } catch (error) {
        console.error("Cart Payment initiation failed:", error);
        throw error;
    }
};
