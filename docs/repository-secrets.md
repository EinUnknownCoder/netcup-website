# Repository-Secrets fuer den netcup-Deploy

Diese Anleitung beschreibt, wie du die Werte fuer den GitHub-Actions-Workflow
`.github/workflows/deploy.yml` bekommst und in GitHub als Repository-Secrets
eintraegst.

Der Workflow braucht diese Secrets:

| Secret | Beispiel | Zweck |
| --- | --- | --- |
| `NETCUP_SSH_HOST` | `hosting123456.a2f00.netcup.net` | Server/Host fuer SSH und SFTP |
| `NETCUP_SSH_PORT` | `22` | SSH-Port |
| `NETCUP_SSH_USER` | `hosting123456` | SSH-/Webhosting-Benutzer |
| `NETCUP_SSH_KEY` | kompletter privater Deploy-Key | Authentifizierung fuer GitHub Actions |
| `NETCUP_REMOTE_PATH` | `/var/www/vhosts/deine-domain.de/httpdocs/` | Zielordner auf dem Webspace |

## 1. Host und Benutzer bei netcup finden

1. Logge dich bei netcup ein.
2. Oeffne das Webhosting Control Panel fuer deinen Webhosting-Tarif.
3. Suche den Bereich fuer Webhosting-Zugang, FTP oder SSH/SFTP.
4. Notiere den Hostnamen fuer SFTP/SSH. Bei netcup sieht er typischerweise so
   aus: `hosting123456.a2f00.netcup.net`.
5. Notiere den Webhosting-Benutzer. Oft entspricht er dem Hosting-Namen, z. B.
   `hosting123456`.

Das wird spaeter:

```text
NETCUP_SSH_HOST=hosting123456.a2f00.netcup.net
NETCUP_SSH_USER=hosting123456
```

## 2. SSH-Port festlegen

Bei netcup-Webhosting ist der SSH/SFTP-Port in der Regel `22`, sofern in deinem
Control Panel nichts anderes angegeben ist.

Das wird:

```text
NETCUP_SSH_PORT=22
```

## 3. Zielordner auf dem Webspace finden

Im Webhosting Control Panel kannst du pro Domain den Document Root bzw.
Zielordner sehen oder setzen. Das ist der Ordner, aus dem deine Webseite
ausgeliefert wird.

Typische Varianten sind:

```text
/var/www/vhosts/deine-domain.de/httpdocs/
/httpdocs/
/www/
```

Wenn du unsicher bist, verbinde dich einmal per SSH:

```bash
ssh hosting123456@hosting123456.a2f00.netcup.net
pwd
ls
```

Dann pruefe, welcher Ordner zu deiner Domain gehoert:

```bash
ls -la
find . -maxdepth 3 -type d -name "httpdocs"
```

Das wird:

```text
NETCUP_REMOTE_PATH=/var/www/vhosts/deine-domain.de/httpdocs/
```

Wichtig: Der Workflow nutzt `rsync --delete`. Alles im Zielordner, was nicht in
`public/` liegt, wird beim Deploy geloescht. Verwende deshalb nur den Ordner,
der ausschliesslich diese Webseite enthalten soll.

## 4. Deploy-SSH-Key erzeugen

Erzeuge lokal einen eigenen SSH-Key nur fuer dieses Deployment:

```bash
ssh-keygen -t ed25519 -C "github-actions-netcup-deploy" -f ~/.ssh/netcup_github_actions
```

Wenn du nach einer Passphrase gefragt wirst, druecke fuer dieses GitHub-Actions-
Deployment Enter. GitHub Actions kann einen passwortgeschuetzten Key nicht ohne
weitere Einrichtung verwenden.

Danach hast du zwei Dateien:

```text
~/.ssh/netcup_github_actions
~/.ssh/netcup_github_actions.pub
```

Die `.pub`-Datei ist der Public Key. Die Datei ohne `.pub` ist der Private Key.

## 5. Public Key bei netcup hinterlegen

Der Public Key muss fuer deinen SSH-Benutzer auf dem netcup-Webspace erlaubt
werden.

Zeige den Public Key an:

```bash
cat ~/.ssh/netcup_github_actions.pub
```

Falls dein netcup-Control-Panel eine SSH-Key-Verwaltung fuer Webhosting anbietet,
fuege dort den Public Key ein.

Falls es keine SSH-Key-Maske gibt, kannst du den Key per SSH hinterlegen:

```bash
ssh hosting123456@hosting123456.a2f00.netcup.net
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Fuege in `authorized_keys` den kompletten Inhalt von
`~/.ssh/netcup_github_actions.pub` als eigene Zeile ein.

Teste danach lokal:

```bash
ssh -i ~/.ssh/netcup_github_actions hosting123456@hosting123456.a2f00.netcup.net
```

Wenn du ohne Passwortabfrage auf den Server kommst, ist der Key korrekt
eingerichtet.

## 6. Private Key fuer GitHub kopieren

Zeige den privaten Key an:

```bash
cat ~/.ssh/netcup_github_actions
```

Kopiere den kompletten Inhalt, inklusive dieser Zeilen:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Das wird:

```text
NETCUP_SSH_KEY=<kompletter privater key>
```

Den privaten Key niemals committen, verschicken oder in normale Dateien im Repo
schreiben.

## 7. Secrets in GitHub eintragen

1. Oeffne dein Repository auf GitHub:
   `https://github.com/EinUnknownCoder/netcup-website`
2. Gehe zu `Settings`.
3. Gehe zu `Secrets and variables` > `Actions`.
4. Klicke `New repository secret`.
5. Lege nacheinander diese Secrets an:

```text
NETCUP_SSH_HOST
NETCUP_SSH_PORT
NETCUP_SSH_USER
NETCUP_SSH_KEY
NETCUP_REMOTE_PATH
```

GitHub zeigt Secret-Werte nach dem Speichern nicht mehr im Klartext an. Wenn ein
Wert falsch war, ersetzt du das Secret einfach mit `Update`.

## 8. Deploy testen

Wenn alle Secrets gesetzt sind:

1. Oeffne in GitHub den Tab `Actions`.
2. Oeffne den Workflow `Deploy website`.
3. Klicke `Run workflow`.
4. Waehle `main` und starte den Lauf.

Wenn der Lauf gruen ist, wurde `public/` per `rsync` auf deinen netcup-Webspace
kopiert.

## Fehler: `Install SSH key` bricht bei `ssh-keyscan` ab

Wenn der Workflow bei `Install SSH key` mit `Process completed with exit code 1`
abbricht und die letzte sichtbare Zeile `ssh-keyscan -p "***" "***"` ist, liegt
es fast immer an einem dieser Punkte:

- `NETCUP_SSH_HOST` ist nicht der SSH/SFTP-Host, sondern z. B. deine Domain.
- `NETCUP_SSH_PORT` ist falsch. Setze ihn auf `22`, falls netcup nichts anderes
  nennt.
- SSH/SFTP ist fuer den Webhosting-Benutzer nicht aktiviert.
- Der Hostname enthaelt versehentlich `https://`, `sftp://`, Leerzeichen oder
  einen Pfad. Das Secret darf nur der reine Hostname sein.

Teste lokal zuerst:

```bash
ssh-keyscan -p 22 hosting123456.a2f00.netcup.net
```

Wenn dort keine Host-Key-Zeilen ausgegeben werden, wird GitHub Actions denselben
Fehler bekommen. Dann stimmen Host oder Port noch nicht.

Wenn `ssh-keyscan` lokal funktioniert, teste den Login:

```bash
ssh -i ~/.ssh/netcup_github_actions -p 22 hosting123456@hosting123456.a2f00.netcup.net
```

Erst wenn dieser Login klappt, lohnt sich der naechste GitHub-Actions-Lauf.

## Fehler: `Load key "...": error in libcrypto`

Wenn der Workflow bei `rsync` mit dieser Meldung abbricht:

```text
Load key "/home/runner/.ssh/deploy_key": error in libcrypto
Permission denied (publickey,password).
```

dann kann GitHub Actions den privaten SSH-Key nicht lesen. Host und Port sind in
diesem Fall bereits erreichbar, aber `NETCUP_SSH_KEY` ist falsch formatiert oder
passt nicht zum hinterlegten Public Key.

Pruefe `NETCUP_SSH_KEY` in GitHub:

- Es muss der private Key sein, nicht die `.pub`-Datei.
- Der Wert muss mit `-----BEGIN OPENSSH PRIVATE KEY-----` beginnen.
- Der Wert muss mit `-----END OPENSSH PRIVATE KEY-----` enden.
- Kopiere den kompletten Key mehrzeilig in GitHub, nicht mit sichtbaren `\n`.
- Der Key darf fuer dieses einfache Deployment keine Passphrase haben.

So erzeugst du bei Bedarf einen neuen Deploy-Key ohne Passphrase:

```bash
ssh-keygen -t ed25519 -C "github-actions-netcup-deploy" -f ~/.ssh/netcup_github_actions
```

Bei `Enter passphrase` und `Enter same passphrase again` jeweils nur Enter
druecken.

Public Key bei netcup hinterlegen:

```bash
cat ~/.ssh/netcup_github_actions.pub
```

Private Key in GitHub als `NETCUP_SSH_KEY` eintragen:

```bash
cat ~/.ssh/netcup_github_actions
```

Teste lokal vor dem naechsten GitHub-Actions-Lauf:

```bash
ssh-keygen -y -f ~/.ssh/netcup_github_actions > /dev/null
ssh -i ~/.ssh/netcup_github_actions -p 22 hosting123456@hosting123456.a2f00.netcup.net
```

Wenn `ssh-keygen -y` eine Passphrase verlangt, hat der Key eine Passphrase. Wenn
der SSH-Login trotz korrektem Key fehlschlaegt, ist der Public Key noch nicht
fuer diesen netcup-Benutzer hinterlegt.

## Quellen

- GitHub Docs: `Using secrets in GitHub Actions`
  https://docs.github.com/actions/reference/encrypted-secrets
- netcup Helpcenter: `FTP Access`; SFTP laeuft ueber SSH und benoetigt
  SSH-Zugriff.
  https://www.netcup.com/en/helpcenter/documentation/web-hosting/ftp-access
- netcup Helpcenter: `Webhosting Interface`; dort sind Webhosting-Zugang und
  Document Root beschrieben.
  https://helpcenter.netcup.com/en/wiki/web-hosting/interface
