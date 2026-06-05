# Listmonk self-hosted pour WebConceptor — remplace Brevo après le 17 juin
FROM listmonk/listmonk:v4.1.0

# Port Railway
EXPOSE 9000

# Listmonk lit la config depuis l'env et /listmonk/config.toml
# Variables critiques (à set dans Railway):
# - LISTMONK_app__admin_username
# - LISTMONK_app__admin_password
# - LISTMONK_db__host = ${{Postgres.PGHOST}}
# - LISTMONK_db__port = ${{Postgres.PGPORT}}
# - LISTMONK_db__user = ${{Postgres.PGUSER}}
# - LISTMONK_db__password = ${{Postgres.PGPASSWORD}}
# - LISTMONK_db__database = ${{Postgres.PGDATABASE}}
# - LISTMONK_db__ssl_mode = require
#
# Au premier démarrage il faut faire migrer la DB :
# Override startCommand temporairement avec : ./listmonk --install --yes
# Puis remettre le start normal.

CMD ["./listmonk"]
