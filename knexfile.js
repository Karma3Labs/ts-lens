const fs = require('fs')

// Update with your config settings.
const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  default: {
    client: 'pg',
    connection: connection
  },
  aws: {
    client: 'pg',
    connection: {
      ...connection, 
      ssl: {
        ca: fs.readFileSync('./aws/global-bundle.pem'),
      }
    }
  }
};
