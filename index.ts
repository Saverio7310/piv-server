import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}`});

import express, { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { router } from './routes/productsRouter';
import cors from 'cors';

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

app.use('/api/v1/', router);

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
});