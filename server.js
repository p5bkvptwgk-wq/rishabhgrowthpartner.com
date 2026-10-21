const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const app = express();
const port = Number(process.env.PORT) || 3000;
const databasePath =
    process.env.DB_PATH || path.join(__dirname, 'data', 'leads.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
`);

const insertLead = database.prepare(`
    INSERT INTO leads (name, email, phone)
    VALUES (@name, @email, @phone)
`);

app.use(express.json({ limit: '10kb' }));

app.post('/api/leads', (request, response, next) => {
    const body = request.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return response.status(400).json({ error: 'A JSON object is required.' });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = phone.replace(/\D/g, '');

    if (name.length < 1 || name.length > 100) {
        return response.status(400).json({
            error: 'Name is required and must be 100 characters or fewer.'
        });
    }

    if (email.length > 254 || !emailPattern.test(email)) {
        return response.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (
        phone.length > 30 ||
        !/^\+?[0-9\s().-]+$/.test(phone) ||
        phoneDigits.length < 7 ||
        phoneDigits.length > 15
    ) {
        return response.status(400).json({ error: 'Enter a valid phone number.' });
    }

    try {
        const result = insertLead.run({ name, email, phone });
        return response.status(201).json({
            message: 'Your audit request has been received.',
            leadId: Number(result.lastInsertRowid)
        });
    } catch (error) {
        return next(error);
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return response.status(400).json({ error: 'Request body must be valid JSON.' });
    }

    if (error.type === 'entity.too.large') {
        return response.status(413).json({ error: 'Request body is too large.' });
    }

    console.error('Request failed:', error);
    return response.status(500).json({ error: 'Unable to process the request.' });
});

app.listen(port, () => {
    console.log(`Rishabh Growth Partners API listening on http://localhost:${port}`);
});
