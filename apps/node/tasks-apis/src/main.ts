import express, { NextFunction, Request, Response } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import * as http from 'http';
import * as socketIo from 'socket.io';
import cors from 'cors';
import * as path from 'path';
import rateLimit from 'express-rate-limit';
import { developmentConfig, stagingConfig, productionConfig } from '@tms-workspace/configurations';
import { dbConnection } from './app/database/models/monogoConnection';
import { connect, set } from 'mongoose';
import { Logger } from '@tms-workspace/apis-core';
import * as Enviornment from './enviornment';
import TaskReportController from './app/api/tasks-reports/controller/tasks_reports.controller';

class App {
  public controller = new TaskReportController();
  public app: express.Application;
  public env: string;
  public port: string | number;
  private server: http.Server;
  private io: socketIo.Server;
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
    this.server = http.createServer(this.app);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.io = require('socket.io')(this.server);
    this.setupSocketEvents();
    // this.startServer();

    
    this.port =
      _NODE_ENV == 'development'
        ? developmentConfig.default.TASKS_APIS_PORT
        : _NODE_ENV == 'staging'
        ? stagingConfig.default.TASKS_APIS_PORT
        : productionConfig.default.TASKS_APIS_PORT;
    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  // public listen() {
  //   this.app.listen(this.port, () => {
  //     console.log(`app is listening to the port ${this.port}`);
  //     //  logger.info(`🚀 ==> ENV: [${this.env}] - App listening on the port ${this.port}`);
  //   });
  // }

  public startServer(): void {
    this.server.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private connectToDatabase() {
    connect(dbConnection.url)
      .then(() => {
        console.log('MongoDB Database Connection Successfully', dbConnection.url);
      })
      .catch((err) => {
        console.log(`MongoDB Database not connected properly bcz ${err.message}`);
      });
    // DB.sequelize
    //   .sync({ alter: true })
    //   .then(() => console.log('Database synced successfully!!'))
    //   .catch(err => console.log(err));
  }

  private setupSocketEvents(): void {
    this.io.on('connection', (socket: socketIo.Socket) => {
        console.log('A user connected');

        // Listen for export events from the frontend
        socket.on('exportReportEvent', async(data: any) => {
            console.log('Received data from client:', data);
            const res=await this.controller.getUserTaskReportExport(data)
            // Send data back to the client
            socket.emit('exportReportResponse', res);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
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
