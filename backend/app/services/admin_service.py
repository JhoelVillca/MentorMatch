from sqlalchemy.orm import Session

from app.repositories import user_repository
from app.schemas.admin import AdminUserRow


def list_registered_users(db: Session) -> list[AdminUserRow]:
    rows = user_repository.list_users_for_admin(db)
    out: list[AdminUserRow] = []
    for row in rows:
        roles_display = (row.roles or "").strip() or "—"
        out.append(
            AdminUserRow(
                email=row.email,
                fecha_creacion=row.fecha_creacion,
                estado_cuenta=row.estado_cuenta or "activo",
                rol=roles_display,
            )
        )
    return out
