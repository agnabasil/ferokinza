/**
 * FEROKINZA — website form endpoint.
 *
 * Receives the contact and RFQ forms from ferokinza.com, validates and
 * sanitises every field, then appends the submission to its own sheet.
 *
 * Deployment steps: apps-script/README.md in the website repo.
 * After editing this file you must redeploy: Deploy → Manage deployments →
 * pencil → Version: New version → Deploy.
 */

/* ------------------------------------------------------------------ config */

// Blank = the spreadsheet this script is bound to. Set an ID only if the
// script lives standalone.
var SPREADSHEET_ID = '';

// Copied on every submission. Set to '' to turn notifications off.
var NOTIFY_EMAIL = 'info@ferokinza.com';

// Only these origins may post. A request with no origin (curl, the test
// script) is allowed through, so this is a spam filter, not an access control.
var ALLOWED_ORIGINS = [
  'https://ferokinza.com',
  'https://www.ferokinza.com'
];

// Seconds during which the same person submitting the same form again is
// treated as a double-click rather than a second enquiry.
var DUPLICATE_WINDOW_SECONDS = 25;

var INCOTERMS = ['EXW', 'FCA', 'FOB', 'CIF', 'CIP', 'DAP', 'DDP'];

/**
 * One entry per form.
 *   key    – the `form` value posted by the page
 *   tab    – sheet name
 *   fields – [field name, column heading, rules]
 *
 * Rules: required, min, max, type ('email' | 'phone' | 'date' | 'choice').
 */
var FORMS = {
  contact: {
    tab: 'Contact',
    label: 'Contact enquiry',
    fields: [
      ['name', 'Name', { required: true, min: 2, max: 80 }],
      ['email', 'Email', { required: true, max: 120, type: 'email' }],
      ['message', 'Message', { required: true, min: 10, max: 3000 }]
    ]
  },
  rfq: {
    tab: 'RFQ',
    label: 'Request for quotation',
    fields: [
      ['rName', 'Name', { required: true, min: 2, max: 80 }],
      ['rCompany', 'Company', { max: 120 }],
      ['rEmail', 'Email', { required: true, max: 120, type: 'email' }],
      ['rPhone', 'Phone / WhatsApp', { max: 40, type: 'phone' }],
      ['rCountry', 'Destination country', { required: true, min: 2, max: 60 }],
      ['rProduct', 'Products & specifications', { required: true, min: 5, max: 4000 }],
      ['rQty', 'Quantity', { required: true, min: 1, max: 120 }],
      ['rIncoterm', 'Incoterm', { type: 'choice', choices: INCOTERMS }],
      ['rDate', 'Required by', { type: 'date' }]
    ]
  }
};

// Columns appended after the form's own fields.
var META_HEADINGS = ['Source page', 'Referrer'];

/* ------------------------------------------------------------- entry points */

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    var params = (e && e.parameter) || {};

    // Honeypot: invisible to people, filled in by bots.
    if (params.website) return json({ ok: true });

    var origin = String(params.origin || '');
    if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return json({ ok: false, code: 'origin', error: 'This form cannot be submitted from ' + origin + '.' });
    }

    var config = FORMS[String(params.form || '').toLowerCase()];
    if (!config) return json({ ok: false, code: 'form', error: 'Unknown form.' });

    var checked = validate(config, params);
    if (checked.error) return json({ ok: false, code: 'validation', error: checked.error });

    if (isDuplicate(config, checked.values)) {
      return json({ ok: true, duplicate: true });
    }

    lock.waitLock(20000);

    var row = [new Date()];

    config.fields.forEach(function (field) {
      row.push(forSpreadsheet(checked.values[field[0]]));
    });

    row.push(forSpreadsheet(clean(params.page, 300)));
    row.push(forSpreadsheet(clean(params.referrer, 300)));

    getSheet(config).appendRow(row);

    notify(config, checked.values);

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, code: 'server', error: 'Server error. Please email info@ferokinza.com.' });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/** Health check — open the /exec URL in a browser to confirm it is live. */
function doGet() {
  return json({ ok: true, service: 'ferokinza-forms' });
}

/* -------------------------------------------------------------- validation */

/**
 * Anything matching these is markup or a script, never a genuine enquiry.
 * Angle brackets on their own are allowed — part specs legitimately contain
 * things like "seal <2mm" — so each pattern needs a real tag or scheme.
 */
var MALICIOUS = [
  /<\s*\/?\s*(script|iframe|object|embed|link|meta|style|svg|form|base)\b/i,
  /<[^>]+\son\w+\s*=/i,          // event handler inside a tag
  /\b(javascript|vbscript)\s*:/i,
  /data\s*:\s*text\/html/i,
  /&#x?[0-9a-f]{2,};.*<\s*\w/i   // entity-encoded tag
];

/** Leading characters that make a spreadsheet treat a cell as a formula. */
var FORMULA_START = /^[=+\-@\t\r]/;

var EMAIL = /^[^\s@<>"';]+@[^\s@<>"';.]+\.[^\s@<>"';]{2,}$/;
var PHONE = /^[0-9+()\-.\/\s]{5,40}$/;
var DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Trims, removes control characters, and caps the length. */
function clean(value, max) {
  var text = String(value == null ? '' : value);

  text = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  return max && text.length > max ? text.slice(0, max) : text;
}

function validate(config, params) {
  var values = {};

  for (var i = 0; i < config.fields.length; i++) {
    var name = config.fields[i][0];
    var label = config.fields[i][1];
    var rules = config.fields[i][2] || {};
    var value = clean(params[name], rules.max);

    if (!value) {
      if (rules.required) return { error: label + ' is required.' };
      values[name] = '';
      continue;
    }

    if (rules.min && value.length < rules.min) {
      return { error: label + ' is too short (minimum ' + rules.min + ' characters).' };
    }

    for (var m = 0; m < MALICIOUS.length; m++) {
      if (MALICIOUS[m].test(value)) {
        return { error: label + ' cannot contain code or markup. Please describe it in plain text.' };
      }
    }

    if (rules.type === 'email' && !EMAIL.test(value)) {
      return { error: 'Please enter a valid email address.' };
    }

    if (rules.type === 'phone' && !PHONE.test(value)) {
      return { error: label + ' may only contain digits and + ( ) - . characters.' };
    }

    if (rules.type === 'date' && !DATE.test(value)) {
      return { error: label + ' must be a date in YYYY-MM-DD format.' };
    }

    if (rules.type === 'choice' && rules.choices.indexOf(value) === -1) {
      return { error: label + ' is not one of the accepted options.' };
    }

    values[name] = value;
  }

  return { values: values };
}

/**
 * Neutralises spreadsheet formula injection. A leading apostrophe forces the
 * cell to be text; Sheets does not display it.
 */
function forSpreadsheet(value) {
  return FORMULA_START.test(value) ? "'" + value : value;
}

/** True when the same address submitted the same form moments ago. */
function isDuplicate(config, values) {
  var who = values.email || values.rEmail || '';
  if (!who) return false;

  var cache = CacheService.getScriptCache();
  var key = 'submitted:' + config.tab + ':' + who.toLowerCase();

  if (cache.get(key)) return true;

  cache.put(key, '1', DUPLICATE_WINDOW_SECONDS);
  return false;
}

/* ------------------------------------------------------------------- sheet */

function getSpreadsheet() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

/** Returns the sheet for this form, creating it with a header row if needed. */
function getSheet(config) {
  var spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.getSheetByName(config.tab);

  if (sheet) return sheet;

  sheet = spreadsheet.insertSheet(config.tab);

  var headings = ['Timestamp'].concat(
    config.fields.map(function (field) { return field[1]; }),
    META_HEADINGS
  );

  sheet.appendRow(headings);
  sheet.getRange(1, 1, 1, headings.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  return sheet;
}

/* ------------------------------------------------------------ notification */

function notify(config, values) {
  if (!NOTIFY_EMAIL) return;

  var lines = config.fields.map(function (field) {
    return field[1] + ': ' + (values[field[0]] || '—');
  });

  var who = values.name || values.rName || values.rCompany || 'website';
  var replyTo = values.email || values.rEmail || '';

  // Build the options without undefined keys - MailApp rejects some of those.
  var options = {
    to: NOTIFY_EMAIL,
    subject: config.label + ' — ' + who,
    body: lines.join('\n'),
    name: 'FEROKINZA website'
  };

  if (replyTo) options.replyTo = replyTo;

  try {
    MailApp.sendEmail(options);
    console.log('notified ' + NOTIFY_EMAIL + ' (quota left: ' +
      MailApp.getRemainingDailyQuota() + ')');
  } catch (err) {
    // A failed notification must never lose the row already written.
    console.error('notify failed for ' + NOTIFY_EMAIL + ': ' + err);
  }
}

/**
 * Run this from the Apps Script editor (select it, press Run) when
 * notifications are not arriving. Everything it finds is printed to the
 * execution log, and it sends one test message to NOTIFY_EMAIL.
 */
function checkEmailSetup() {
  console.log('Script runs as:      ' + Session.getEffectiveUser().getEmail());
  console.log('Notifications go to: ' + (NOTIFY_EMAIL || '(disabled)'));
  console.log('Emails left today:   ' + MailApp.getRemainingDailyQuota());

  if (!NOTIFY_EMAIL) {
    console.log('NOTIFY_EMAIL is empty, so nothing would ever be sent.');
    return;
  }

  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'FEROKINZA test notification',
      body: 'If you are reading this, MailApp works and ' + NOTIFY_EMAIL +
            ' receives mail from this script.',
      name: 'FEROKINZA website'
    });
    console.log('Sent. If it does not arrive, check spam, then confirm that ' +
                NOTIFY_EMAIL + ' is a real mailbox and not just an alias or a ' +
                'forwarding address that drops mail.');
  } catch (err) {
    console.error('MailApp refused it: ' + err);
  }
}

/* ------------------------------------------------------------------ helper */

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
