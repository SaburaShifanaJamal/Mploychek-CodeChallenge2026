import 'dotenv/config';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET is missing. Add it to the .env file.');
}

export const JWT_SECRET: string = secret;
export const PORT = Number(process.env.PORT) || 4000;