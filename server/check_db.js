const { Client } = require('pg');
require('dotenv').config({path: '../.env'});
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  const res = await client.query("SELECT * FROM \"Score\" WHERE mssv='PS47261'");
  console.log(res.rows);
  await client.end();
}
main();
