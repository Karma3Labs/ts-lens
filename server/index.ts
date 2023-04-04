import express, { Request } from 'express'
import cors from 'cors'
import Tracing from '@sentry/tracing'
import Recommender from '../recommender/index'
import getRoutes from './routes'
import * as Sentry from "@sentry/node";

const app = express()
const PORT = 8080

const options: cors.CorsOptions = {
    origin: '*',
	allowedHeaders: ['Content-Type', 'api_key', 'Authorization'],
}
app.use(cors<Request>(options))

export default (recommender: Recommender) => {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		integrations: [
			new Sentry.Integrations.Http({ tracing: true }),
			...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
		],
		
		tracesSampleRate: 1.0,
	});
	  
	app.use(Sentry.Handlers.requestHandler());
	app.use(Sentry.Handlers.tracingHandler());

	getRoutes(app, recommender)

	app.use(Sentry.Handlers.errorHandler());

	app.listen(PORT, () => console.log(`Magic is happening on port: ${PORT}`))
}

