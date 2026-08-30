# Windows setup

From PowerShell in the MERLIN folder:

```powershell
Copy-Item .env.example .env
npm install
npm run seed
npm start
```

Then open:

```text
http://localhost:3000
```

Edit `.env` in Notepad or VS Code and add the OpenAI API key if you want the AI/research functions.

The non-AI functions—DXF registry, inventory, product records and dashboard—do not require an OpenAI key.

## Start with the real business

On first use:

1. Add only inventory you actually possess now.
2. Upload the DXFs you actually have now.
3. Mark commercial-rights state accurately.
4. Do not fill unknown material thickness/cost/paint usage with estimates just to make the dashboard look complete.
5. As you make test cuts, record real times and failures.

That data becomes MERLIN's permanent business memory.
