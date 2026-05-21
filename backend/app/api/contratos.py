from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_mentee_user_id
from app.models.main_models import PaqueteMentor, ContratoMentoria, TransaccionPago, PerfilMentor, PerfilMentee

router = APIRouter(prefix="/contratos", tags=["Contratos y Transacciones"])

class AdquirirPaqueteReq(BaseModel):
    id_paquete: UUID

@router.post("/adquirir", status_code=status.HTTP_201_CREATED)
async def adquirir_contrato(
    req: AdquirirPaqueteReq,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    try:
        res_mentee = await db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
        mentee = res_mentee.scalars().first()
        if not mentee:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Perfil de mentee incompleto")

        res_paq = await db.execute(
            select(PaqueteMentor, PerfilMentor)
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .filter(PaqueteMentor.id_paquete == req.id_paquete)
            .with_for_update()
        )
        row = res_paq.first()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Paquete no encontrado")
        
        paquete, mentor = row

        if not paquete.estado_activo or mentor.estado_verificacion != 'verificado':
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "El paquete no esta disponible para compra")

        res_dup = await db.execute(
            select(ContratoMentoria).filter(
                ContratoMentoria.id_mentee == mentee.id_mentee,
                ContratoMentoria.id_paquete == paquete.id_paquete,
                ContratoMentoria.estado_contrato.in_(['pendiente_pago', 'activo'])
            )
        )
        if res_dup.scalars().first():
            raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un contrato activo o en proceso para este paquete")

        nuevo_contrato = ContratoMentoria(
            id_mentee=mentee.id_mentee,
            id_paquete=paquete.id_paquete,
            estado_contrato="pendiente_pago",
            horas_consumidas=0
        )
        db.add(nuevo_contrato)
        await db.flush()

        nueva_trx = TransaccionPago(
            id_contrato=nuevo_contrato.id_contrato,
            monto_pagado=paquete.precio_total,
            moneda="USD",
            estado_pago="procesando"
        )
        db.add(nueva_trx)
        
        await db.commit()
        await db.refresh(nuevo_contrato)
        
        return {"id_contrato": str(nuevo_contrato.id_contrato), "estado": nuevo_contrato.estado_contrato}

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Fallo de integridad transaccional: {str(e)}")

@router.get("/me")
async def listar_mis_contratos(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    res_mentee = await db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
    mentee = res_mentee.scalars().first()
    
    if not mentee:
        return []

    query = (
        select(ContratoMentoria, PaqueteMentor.titulo_paquete)
        .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
        .filter(ContratoMentoria.id_mentee == mentee.id_mentee)
    )
    res = await db.execute(query)
    
    return [
        {
            "id_contrato": c.ContratoMentoria.id_contrato,
            "estado": c.ContratoMentoria.estado_contrato,
            "horas_consumidas": c.ContratoMentoria.horas_consumidas,
            "fecha": c.ContratoMentoria.fecha_adquisicion,
            "paquete": c.titulo_paquete
        }
        for c in res.all()
    ]