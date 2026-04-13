const StellarSdk = require('stellar-sdk');

/**
 * Pi Network Transaction Tool
 * 
 * Usage 1 (Sign Only):  node sign_pi.js sign <seed> <xdr> <horizonUrl>
 * Usage 2 (Build & Sign): node sign_pi.js build <seed> <destination> <amount> <memoText> <horizonUrl>
 */

const mode = process.argv[2];

if (mode === 'sign') {
    const seed = process.argv[3];
    const xdr = process.argv[4];
    const horizonUrl = process.argv[5] || 'https://api.testnet.minepi.com';

    if (!seed || !xdr) {
        console.log(JSON.stringify({ success: false, error: 'Missing seed or XDR' }));
        process.exit(1);
    }

    (async () => {
        try {
            const server = new StellarSdk.Server(horizonUrl, { allowHttp: true });
            const keypair = StellarSdk.Keypair.fromSecret(seed);
            const transaction = new StellarSdk.Transaction(xdr, 'Pi Testnet');
            
            transaction.sign(keypair);
            const result = await server.submitTransaction(transaction);
            console.log(JSON.stringify({ success: true, txid: result.hash }));
        } catch (e) {
            console.log(JSON.stringify({ success: false, error: e.response ? e.response.data : e.message }));
        }
    })();
} 
else if (mode === 'build') {
    const seed = process.argv[3];
    const destination = process.argv[4];
    const amount = process.argv[5];
    const memoText = process.argv[6];
    const horizonUrl = process.argv[7] || 'https://api.testnet.minepi.com';

    if (!seed || !destination || !amount || !memoText) {
        console.log(JSON.stringify({ success: false, error: 'Missing build arguments' }));
        process.exit(1);
    }

    (async () => {
        try {
            const server = new StellarSdk.Server(horizonUrl, { allowHttp: true });
            const keypair = StellarSdk.Keypair.fromSecret(seed);
            const sourceAccount = await server.loadAccount(keypair.publicKey());

            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: '100', // Standard fee
                networkPassphrase: 'Pi Testnet',
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: destination,
                asset: StellarSdk.Asset.native(),
                amount: amount
            }))
            .addMemo(StellarSdk.Memo.text(memoText))
            .setTimeout(60)
            .build();

            transaction.sign(keypair);
            const result = await server.submitTransaction(transaction);
            console.log(JSON.stringify({ success: true, txid: result.hash }));
        } catch (e) {
            const errorDetail = e.response && e.response.data && e.response.data.extras 
                ? e.response.data.extras.result_codes 
                : (e.response ? e.response.data : e.message);
            console.log(JSON.stringify({ success: false, error: errorDetail }));
        }
    })();
}
else {
    // Original behavior for backward compatibility if no mode specified
    const seed = process.argv[2];
    const xdr = process.argv[3];
    const horizonUrl = process.argv[4] || 'https://api.testnet.minepi.com';
    
    (async () => {
        try {
            const server = new StellarSdk.Server(horizonUrl, { allowHttp: true });
            const keypair = StellarSdk.Keypair.fromSecret(seed);
            const transaction = new StellarSdk.Transaction(xdr, 'Pi Testnet');
            transaction.sign(keypair);
            const result = await server.submitTransaction(transaction);
            console.log(JSON.stringify({ success: true, txid: result.hash }));
        } catch (e) {
            console.log(JSON.stringify({ success: false, error: e.message }));
        }
    })();
}
