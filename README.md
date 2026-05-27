# Meine Konzertchronik

Statische Webseite fuer eine persoenliche Liste von Konzerten und Artists, die
ich live gesehen habe.

## Konzertdaten pflegen

Die Daten liegen in `public/data/concerts.json`.

Beispiel:

```json
{
  "date": "2025-08-16",
  "artist": "Beispiel Artist",
  "venue": "Beispielhalle",
  "city": "Berlin",
  "country": "Deutschland",
  "type": "Konzert"
}
```

## Lokal ansehen

Da die Seite Daten per `fetch()` laedt, sollte sie ueber einen kleinen lokalen
Server geoeffnet werden:

```bash
python3 -m http.server 8000 --directory public
```

Danach im Browser `http://localhost:8000` oeffnen.

## Deployment zu netcup

Der Workflow `.github/workflows/deploy.yml` deployed bei jedem Push auf `main`
den Inhalt von `public/` per `rsync` auf den Server.

Eine ausfuehrliche Schritt-fuer-Schritt-Anleitung zum Ermitteln und Eintragen
der Secrets steht in `docs/repository-secrets.md`.

In GitHub muessen unter `Settings > Secrets and variables > Actions` diese
Repository-Secrets angelegt werden:

- `NETCUP_SSH_HOST`: Hostname des netcup-Servers, z. B. `hosting123456.a2f00.netcup.net`
- `NETCUP_SSH_PORT`: SSH-Port, meistens `22`
- `NETCUP_SSH_USER`: SSH-/Webhosting-Benutzer
- `NETCUP_SSH_KEY`: privater SSH-Key fuer den Deploy-Zugriff
- `NETCUP_REMOTE_PATH`: Zielordner auf dem Server, z. B. `/var/www/vhosts/example.com/httpdocs/`

Der Public-Key zum privaten Deploy-Key muss vorher im netcup-Hosting fuer den
SSH-Benutzer hinterlegt werden.
