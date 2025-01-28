import express, { ErrorRequestHandler } from 'express';
import bodyParser from 'body-parser';
import { router } from './routes/productsRouter';
import cors from 'cors';

const port = 3030;
const app = express();

app.use(cors());
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