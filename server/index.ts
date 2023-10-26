import express, { Request, Response } from 'express'
import cors from 'cors'
import getRoutes from './routes'
const apiMetrics = require('prometheus-api-metrics');

const app = express()
const PORT = 8080

const options: cors.CorsOptions = {
  origin: '*',
	allowedHeaders: ['Content-Type', 'api_key', 'Authorization'],
}
app.use(cors<Request>(options))
app.use(apiMetrics())
app.use((req, res, next) => {
	console.log(new Date().toISOString(), req.originalUrl);
	next();
});

export default () => {
	getRoutes(app)
	app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`))
}

