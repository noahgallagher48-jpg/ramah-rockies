/**
 * Ramah in the Rockies — favorites collector.
 * Receives favorites from the gallery site and appends them to a Google Sheet,
 * one row per favorited photo: [Timestamp, Name, Email, Tier, Photo].
 * Also emails a summary to NOTIFY_EMAIL on each submission (set to "" to disable).
 *
 * DEPLOY (one time, ~2 minutes):
 *  1. Go to https://script.google.com  ->  New project.
 *  2. Delete the sample code, paste THIS whole file, Save.
 *  3. Click Deploy  ->  New deployment  ->  type: Web app.
 *  4. "Execute as": Me.  "Who has access": Anyone.  Deploy.
 *  5. Authorize when prompted (it's your own script).
 *  6. Copy the Web app URL (ends in /exec) and send it to Noah/Claude.
 */

var SHEET_ID = "1CWIzaKhCaLwbqlOUJlKJ-K8CWqza3ohRIE5P5aeoJek";
var NOTIFY_EMAIL = "noahgallagher48@gmail.com"; // set "" to turn off email notifications

function tierOf(name) {
  if (name.indexOf("_T2") !== -1) return "Tier 2";
  if (name.indexOf("_T3") !== -1) return "Tier 3";
  return "Tier 1";
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var name = (data.name || "").toString().slice(0, 200);
    var email = (data.email || "").toString().slice(0, 200);
    var favs = Array.isArray(data.favorites) ? data.favorites : [];
    var when = new Date();

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Email", "Tier", "Photo"]);
    }
    favs.forEach(function (photo) {
      sheet.appendRow([when, name, email, tierOf(String(photo)), String(photo)]);
    });

    if (NOTIFY_EMAIL && favs.length) {
      var body = name + (email ? " (" + email + ")" : "") + " picked " + favs.length +
        " favorite(s):\n\n" + favs.join("\n") +
        "\n\nSheet: https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit";
      MailApp.sendEmail(NOTIFY_EMAIL, "Ramah favorites from " + (name || "a viewer"), body);
    }
    return ok({ saved: favs.length });
  } catch (err) {
    return ok({ error: String(err) });
  }
}

function doGet() {
  return ok({ status: "ready" });
}

function ok(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
