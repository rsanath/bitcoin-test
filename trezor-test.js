const TrezorConnect = require('@trezor/connect').default;
const { TRANSPORT_EVENT, DEVICE_EVENT } = require('@trezor/connect');

/**
 * Please note, that this example needs:
 * - Trezor bridge running
 * - Device connected to USB
 */
const runExample = async () => {
    await TrezorConnect.init({
        manifest: {
            appUrl: 'my app',
            email: 'app@myapp.meow',
        },
    });

    // this event will be fired when bridge starts or stops or there is no bridge running
    TrezorConnect.on(TRANSPORT_EVENT, event => {
        console.log(event);
    });

    // this event will be fired when device connects, disconnects or changes
    TrezorConnect.on(DEVICE_EVENT, event => {
        console.log(event);
    });

    const result = await TrezorConnect.getFeatures();

    console.log(result);

    if (!result.success) {
        process.exit(1);
    } else {
        process.exit(0);
    }
};

async function getPublicKey() {
    try {
        await TrezorConnect.init({
            manifest: {
                appUrl: 'my app',
                email: 'app@myapp.meow'
            },
        });

        // Specify the HD wallet path (e.g., m/44'/0'/0'/0)
        const path = "m/49'/0";

        // Call TrezorConnect to get the public key
        const response = await TrezorConnect.getPublicKey({
            path: path,
            coin: 'btc', // specify the coin (e.g., btc for Bitcoin)
            showOnTrezor: true,

        });
        if (response.success) {
            const publicKey = response.payload.publicKey
            console.log('Public Key:', publicKey);
        } else {
            console.error('Error:', response.payload.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// runExample();
getPublicKey();