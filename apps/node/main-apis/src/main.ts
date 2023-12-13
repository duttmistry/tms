import express, { NextFunction, Request, Response } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import cors from 'cors';
import * as path from 'path';
import { developmentConfig, stagingConfig, productionConfig } from '@tms-workspace/configurations';
import { Logger } from '@tms-workspace/apis-core';
import nodeCron from './app/api/cron/index';
import rateLimit from 'express-rate-limit';
import * as Enviornment from './enviornment';
class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public windowMs: string | number;
  public maxRequestsPerWindow: string | number;
  public Limiter_Message: string | number;
  public limiter: any;
  public limiterShow:boolean;
  constructor(routes: Routes[]) {
    const _NODE_ENV =  Enviornment.default.state|| 'development';
    this.limiterShow = _NODE_ENV == 'development'
    ? developmentConfig.default.LIMITER
    : _NODE_ENV == 'staging'
    ? stagingConfig.default.LIMITER
    : productionConfig.default.LIMITER;
    this.windowMs = _NODE_ENV == 'development'
    ? developmentConfig.default.WINDOWMS
    : _NODE_ENV == 'staging'
    ? stagingConfig.default.WINDOWMS
    : productionConfig.default.WINDOWMS;

    this.maxRequestsPerWindow = _NODE_ENV == 'development'
    ? developmentConfig.default.MAX_REQUESTS_PER_WINDOW
    : _NODE_ENV == 'staging'
    ? stagingConfig.default.MAX_REQUESTS_PER_WINDOW
    : productionConfig.default.MAX_REQUESTS_PER_WINDOW;

    this.Limiter_Message = _NODE_ENV == 'development'
    ? developmentConfig.default.LIMITER_MESSAGE
    : _NODE_ENV == 'staging'
    ? stagingConfig.default.LIMITER_MESSAGE
    : productionConfig.default.LIMITER_MESSAGE;
    this.limiter = rateLimit({
      windowMs: Number(this.windowMs), // 15 minutes
      max: Number(this.maxRequestsPerWindow), // limit each IP to 100 requests per windowMs
      message: this.Limiter_Message,
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
    this.app = express();
    this.port =
      _NODE_ENV == 'development'
        ? developmentConfig.default.MAIN_APIS_PORT
        : _NODE_ENV == 'staging'
        ? stagingConfig.default.MAIN_APIS_PORT
        : productionConfig.default.MAIN_APIS_PORT;
    //this.port = 3500; // 3002 staging port

    if (process.argv[2] === 'db:migrate') {
      this.connectToDatabase();
    }

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`app is listening to the port ${this.port}`);
      //  logger.info(`🚀 ==> ENV: [${this.env}] - App listening on the port ${this.port}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private connectToDatabase() {
    // DB.sequelize
    //   .sync({ alter: true })
    //   .then(() => console.log('Database synced successfully!!'))
    //   .catch(err => console.log(err));
  }

  private initializeMiddlewares() {
    this.app.use(morgan(developmentConfig.LOG_FORMAT || stagingConfig.LOG_FORMAT || productionConfig.LOG_FORMAT, { Logger }));
    this.app.use(cors({ origin: '*', credentials: true }));
    //this.app.use(hpp());
    //this.app.use(helmet());
    //this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    if(this.limiterShow){
    this.app.set('https://tms-production-task-apis.cybercom.in', 1);
    this.app.use(this.limiter);
    }
    //this.app.use(cookieParser());
    //this.app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

      this.app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'public', 'uploads')));
    nodeCron;
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    //this.app.use(errorMiddleware);

    //Logging the error
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      const caller_line = err.stack.split('\n')[1];
      const index = caller_line.indexOf('at ');
      const clean = caller_line.slice(index + 2, caller_line.length);
      // const lineNumber = clean.substr(-6, 2);
      console.log('Error: ' + err.message);
      console.log(`Error occured at: ` + clean);
      next();
    });
  }

  
}

export default App;
