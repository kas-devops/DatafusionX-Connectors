import express from "express";
import cors from "cors";
import { Pool } from "pg";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: "postgres-rds.cmbgykw68jfd.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Postgres#2026",
  ssl: { rejectUnauthorized: false },
});

async function createTable() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS public`);
  await pool.query(`DROP TABLE IF EXISTS public.jira_connections`);
  await pool.query(`
    CREATE TABLE public.jira_connections (
      id SERIAL PRIMARY KEY,
      instance_url VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Table ready!");
}
createTable();

app.post("/api/connect", async (req, res) => {
  const { instanceUrl, email, apiToken } = req.body;
  const authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64");
  try {
    await axios.get(`${instanceUrl}/rest/api/3/myself`, {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    await pool.query(
      `INSERT INTO public.jira_connections (instance_url, email) VALUES ($1, $2)`,
      [instanceUrl, email]
    );
    res.json({ success: true, message: "Connected to Jira!" });
  } catch (error: any) {
    console.error("Connect error:", error.response?.data || error.message);
    res.status(400).json({ success: false, message: "Connection failed!" });
  }
});

app.post("/api/fetch-issues", async (req, res) => {
  const { instanceUrl, email, apiToken, search } = req.body;
  const authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64");
  try {
    const jql = search
      ? `text ~ "${search}" ORDER BY created DESC`
      : `project is not EMPTY ORDER BY created DESC`;
    const response = await axios.get(`${instanceUrl}/rest/api/3/search/jql`, {
      headers: { Authorization: authHeader, Accept: "application/json" },
      params: {
        jql,
        maxResults: 20,
        fields: "summary,status,priority,assignee,created,issuetype,project",
      },
    });
    res.json({ success: true, issues: response.data.issues });
  } catch (error: any) {
    console.error("Fetch error:", error.response?.data || error.message);
    res.status(400).json({ success: false, message: "Failed to fetch issues!" });
  }
});

app.listen(5002, () => console.log("🚀 Jira Server running on port 5002"));