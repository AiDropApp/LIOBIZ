import { getDb } from "../lib/db";

// Ensures schema + admin seed exist
getDb();
console.log("SQLite ready at data/liobiz.db");
console.log("Admin: admin@liobiz.com / Admin@12345");
