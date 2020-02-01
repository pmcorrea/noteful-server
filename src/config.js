// Respect env variables and establish defaults
module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost/noteful',
    JWT_SECRET: process.env.JWT_SECRET || 'secret123'
  }