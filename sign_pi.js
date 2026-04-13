const StellarSdk = require('stellar-sdk');

// Configuration
const HORIZON_URL = 'https://horizon-testnet.pi2.network'; // Pi Testnet Horizon
const NETWORK_PASSPHRASE = 'Pi Network Testnet'; // Passphrase for Pi Testnet

async function signAndSubmit(seed, transactionXdr) {
    try {
        StellarSdk.Network.use(new StellarSdk.Network(NETWORK_PASSPHRASE));
        const server = new StellarSdk.Server(HORIZON_URL);
        const sourceKeys = StellarSdk.Keypair.fromSecret(seed);

        // Load the transaction from XDR
        const transaction = new StellarSdk.Transaction(transactionXdr, NETWORK_PASSPHRASE);

        // Sign the transaction
        transaction.sign(sourceKeys);

        // Submit to the blockchain
        const response = await server.submitTransaction(transaction);
        
        console.log(JSON.stringify({
            success: true,
            txid: response.hash
        }));
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.response ? error.response.data : error.message
        }));
        process.exit(1);
    }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error(JSON.stringify({ success: false, error: "Missing arguments: node sign_pi.js <seed> <xdr>" }));
    process.exit(1);
}

const seed = args[0];
const transactionXdr = args[1];

signAndSubmit(seed, transactionXdr);
