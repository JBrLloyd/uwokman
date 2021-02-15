import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import exphbs from 'express-handlebars';
// import flash from 'express-flash';
import helmet from 'helmet';
import lusca from 'lusca';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { cancelRequestHandler, errorHandler } from './middleware';
import * as routes from './routes';
import swagger from './swagger.json';
import { logStream } from './util/logger';


// Create Express server
const app = express();

// app.enable("trust proxy");
app.use(helmet());
app.use(cors());

// Express configuration
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
app.use(require('morgan')('combined', { 'stream': logStream }));

// app.use(flash());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

app.use(cancelRequestHandler);

// Handlebars
const hbs = exphbs.create({
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    isdefined: function (value: any) { return value !== undefined && value !== null; },
    gte: function (value1: any, value2: any) {
      const valuesAreDefined = value1 !== undefined && value2 !== undefined;
      return valuesAreDefined && Number(value1) >= Number(value2);
    },
    boolean: function (value: any) {
      return value !== undefined && Boolean(value);
    },
    msToHumanReadable: function (valueMS: any): string {
      if (valueMS === undefined || valueMS === null) {
        return '';
      }

      const milliseconds = Number(valueMS);

      const secs = (milliseconds % 60000) / 1000;
      const twoDigitSecs = secs >= 10 ? secs.toFixed(0) : `0${secs.toFixed(0)}`;
      const mins = Math.floor(milliseconds / 60000);
      return `${mins}:${twoDigitSecs}`;
    },
    mathPercentage: function (value1: any, value2: any) {
      if (value1 === undefined && value2 === undefined) {
        return 0;
      }

      return ((Number(value1) / Number(value2)) * 100).toFixed(0);
    },
  }
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swagger));

routes.setup(app);

app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(errorHandler);

export default app;
