# Rishabh Growth Partners API

This project serves the provided page and stores its growth-audit form submissions in SQLite.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Open <http://localhost:3000>. The SQLite database is created at `data/leads.sqlite` on first start. Set `PORT` to change the HTTP port or `DB_PATH` to use a different database file.

## API

### `POST /api/leads`

Accepts JSON:

```json
{
  "name": "Name",
  "email": "Client@gmail.com",
  "phone": "+91 98765 43210"
}
```

On success, returns HTTP `201`:

```json
{
  "message": "Your audit request has been received.",
  "leadId": 1
}
```

Invalid fields return HTTP `400` with an `error` message. Submissions are validated on the server and inserted using a parameterized SQLite statement.
