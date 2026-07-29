import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
console.log('SKU seed scaffold ready; add seed records in a later phase.');
await connectDatabase();
await disconnectDatabase();
