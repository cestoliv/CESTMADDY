import express, { Response } from 'express';
import 'colors'

import routes from './routes';

const app = express();

app.set('trust proxy', 1);

app.use('/', routes);

app.listen(3000, () => {
    console.log(`\ncestmaddy started on ::3000`.magenta.bold)
})
