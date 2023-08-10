import express, { Request, Response } from 'express'
import cors from 'cors'
import getRoutes from './routes'
// import * as Sentry from "@sentry/node";
const apiMetrics = require('prometheus-api-metrics');

const app = express()
const PORT = 8080

const options: cors.CorsOptions = {
  origin: '*',
	allowedHeaders: ['Content-Type', 'api_key', 'Authorization'],
}
app.use(cors<Request>(options))
app.use(apiMetrics())

export default () => {
	
	// Sentry.init({
	// 	dsn: process.env.SENTRY_DSN,
	// 	integrations: [
	// 		new Sentry.Integrations.Http({ tracing: true }),
	// 		...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
	// 	],
		
	// 	tracesSampleRate: 1.0,
	// });
	  
	// app.use(Sentry.Handlers.requestHandler());
	// app.use(Sentry.Handlers.tracingHandler());

	getRoutes(app)

	// app.use(Sentry.Handlers.errorHandler());

	app.use((req, res, next) => {
		console.log(new Date().toISOString(), req.originalUrl);
		next();
	});

	app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`))
}

