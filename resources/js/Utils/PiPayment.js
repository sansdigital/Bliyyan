import axios from 'axios';

export const createPiPayment = async (productId, discountCode = null, addressId = null) => {
    try {
        // 1. Dapatkan detail pesanan dari server
        const response = await axios.post(route('pi.create-order'), {
            product_id: productId,
            discount_code: discountCode,
            address_id: addressId
        });

        const { amount, memo, paymentId } = response.data;

        // 2. Gunakan Pi SDK untuk membuat pembayaran
        const payment = await window.Pi.createPayment({
            amount: amount,
            memo: memo,
            metadata: { productId: productId, discountCode: discountCode, addressId: addressId },
        }, {
            onReadyForServerApproval: (paymentId) => {
                return axios.post(route('pi.approve'), { paymentId });
            },
            onReadyForServerCompletion: (paymentId, txid) => {
                return axios.post(route('pi.complete'), { paymentId, txid });
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
        const response = await axios.post(route('pi.create-order'), {
            cart_checkout: true,
            discount_code: discountCode,
            address_id: addressId
        });

        const { amount, memo, paymentId } = response.data;

        const payment = await window.Pi.createPayment({
            amount: amount,
            memo: memo,
            metadata: { cartCheckout: true, discountCode: discountCode, addressId: addressId },
        }, {
            onReadyForServerApproval: (paymentId) => {
                return axios.post(route('pi.approve'), { paymentId });
            },
            onReadyForServerCompletion: (paymentId, txid) => {
                return axios.post(route('pi.complete'), { paymentId, txid });
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
