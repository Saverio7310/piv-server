import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import express, { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import compression from 'compression';
import { router } from './routes/productsRouter';
import { routerV2 } from './routes/productsRouterV2';
import rateLimiter from './middleware/rateLimiter';
import cors from 'cors';
import axios, { AxiosResponse } from 'axios';

const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3030;
const app = express();

app.set('trust proxy', 1); //get original client's ip

app.use(helmet()); //set security headers
const origin = process.env.CLIENT_CORS_ORIGIN?.split(',');
const methods = process.env.CLIENT_CORS_METHODS?.split(',') || ['GET'];
app.use(cors({
    origin: origin,
    methods: methods,
    credentials: false,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(compression());

app.get('/healthz', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(200).send('ok');
});

app.use('*', rateLimiter);

app.use('/api/v1/', router);
app.use('/api/v2/', routerV2);

app.use('*', (req, res, next) => {
    const data = {
        message: 'Page Not Found',
    };
    res.status(404).send(JSON.stringify(data));
});

const hanldeErrorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
};

app.use(hanldeErrorMiddleware);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);

    //Self ping so that Render instance does not sleep
    const url: string = process.env.SELF_PING_URL ?? '';

    if (!url) {
        console.warn('SELF_PING_URL is not set. Skipping self-ping.');
    } else {
        setInterval(() => {
            axios.get(url)
                .then((res: AxiosResponse) => console.log(`Pinged ${url}: ${res.status}`))
                .catch((err: Error) => console.error(`Error pinging ${url}: ${err.message}`));
        }, 1000 * 60 * 10); // every 10 minutes
    }
});