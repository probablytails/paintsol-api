export const config = {
  auth0: {
    // this should be false. routes are selectively set to authRequired instead
    authRequired: false, 
    auth0Logout: true,
    // choose a highly random key at least 32 characters
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    imageBucket: process.env.AWS_IMAGE_BUCKET
  },
  db: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  },
  web: {
    baseUrl: process.env.WEB_BASE_URL
  }
}
