import 'dotenv/config';
import { openDatabase, migrateDatabase } from '../src/db/database.js';
import { seedCurrentBusiness } from '../src/db/seed.js';
const db = openDatabase();
migrateDatabase(db);
seedCurrentBusiness(db);
console.log('MERLIN current-business seed applied.');
