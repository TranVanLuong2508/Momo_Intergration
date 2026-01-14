import express, { Request, Response } from 'express';
import * as crypto from 'crypto';
import * as https from 'https';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

interface MomoRequestBody {
    partnerCode: string;
    partnerName: string;
    storeId: string;
    requestId: string;
    amount: number;
    orderId: string;
    orderInfo: string;
    redirectUrl: string;
    ipnUrl: string;
    lang: string;
    requestType: string;
    autoCapture: boolean;
    extraData: string;
    orderGroupId: string;
    signature: string;
}

interface MomoResponse {
    resultCode: number;
    [key: string]: any;
}

app.post('/api/create', (req: Request, res: Response) => {
    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';
    const orderInfo = '123456';
    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/api/result';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/result';
    const requestType = 'payWithMethod';
    const amount = 500000;
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;
    const extraData = '';
    const paymentCode =
        'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==';
    const orderGroupId = '';
    const autoCapture = true;
    const lang = 'vi';

    //before sign HMAC SHA256 with format
    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    const rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        amount +
        '&extraData=' +
        extraData +
        '&ipnUrl=' +
        ipnUrl +
        '&orderId=' +
        orderId +
        '&orderInfo=' +
        orderInfo +
        '&partnerCode=' +
        partnerCode +
        '&redirectUrl=' +
        redirectUrl +
        '&requestId=' +
        requestId +
        '&requestType=' +
        requestType;
    //puts raw signature
    console.log('--------------------RAW SIGNATURE----------------');
    console.log(rawSignature);
    //signature
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    console.log('--------------------SIGNATURE----------------');
    console.log(signature);

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        partnerName: 'Test',
        storeId: 'MomoTestStore',
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData,
        orderGroupId: orderGroupId,
        signature: signature,
    } as MomoRequestBody);

    //Create the HTTPS objects
    const options: https.RequestOptions = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
        },
    };

    //Send the request and get the response
    const req2 = https.request(options, (res2) => {
        console.log(`Status: ${res2.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res2.headers)}`);
        res2.setEncoding('utf8');

        res2.on('data', (body: string) => {
            const response: MomoResponse = JSON.parse(body);
            res.status(201).json({
                message: 'Create payment request successfully',
                data: response,
            });
        });

        res2.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req2.on('error', (e: Error) => {
        console.log(`problem with request: ${e.message}`);
    });

    // write data to request body
    console.log('Sending....');
    req2.write(requestBody);
    req2.end();
});

app.get('/api/result', (req: Request, res: Response) => {
    console.log('result: ', req.query);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
