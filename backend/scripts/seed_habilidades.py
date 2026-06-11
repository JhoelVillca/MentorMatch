import asyncio
import os
import sys

# Agregar el directorio raíz del backend al path para poder importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal
from app.models.main_models import CategoriaHabilidad, Habilidad

SEED_DATA = {
    "Desarrollo Web Frontend": [
        "React", "Vue.js", "Angular", "Svelte", "HTML/CSS", "Tailwind CSS", "Next.js", "TypeScript"
    ],
    "Desarrollo Web Backend": [
        "Node.js", "FastAPI", "Django", "Flask", "Spring Boot", "Ruby on Rails", "Laravel", "Go"
    ],
    "Desarrollo Móvil": [
        "Flutter", "React Native", "Swift", "Kotlin", "iOS Development", "Android Development"
    ],
    "Bases de Datos": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQL Server", "Oracle"
    ],
    "Ciencia de Datos e IA": [
        "Python", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Pandas", "NLP", "Visión Artificial"
    ],
    "DevOps y Cloud": [
        "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "CI/CD", "Terraform", "Linux"
    ],
    "Diseño y UX/UI": [
        "Figma", "Adobe XD", "Sketch", "Prototipado", "Investigación de Usuarios", "Diseño de Interfaces"
    ],
    "Habilidades Blandas": [
        "Liderazgo Técnico", "Oratoria", "Gestión del Tiempo", "Agile/Scrum", "Mentoría", "Negociación"
    ]
}

async def run_seed():
    print("🌱 Iniciando seeder de Habilidades...")
    async with AsyncSessionLocal() as session:
        for cat_name, skills in SEED_DATA.items():
            # Verificar si la categoría ya existe
            res = await session.execute(select(CategoriaHabilidad).filter_by(nombre_categoria=cat_name))
            categoria = res.scalars().first()

            if not categoria:
                categoria = CategoriaHabilidad(
                    nombre_categoria=cat_name,
                    descripcion=f"Habilidades relacionadas con {cat_name}"
                )
                session.add(categoria)
                await session.flush() # Para obtener el ID generado
                print(f"📁 Categoría creada: {cat_name}")

            for skill_name in skills:
                # Verificar si la habilidad ya existe
                res = await session.execute(select(Habilidad).filter_by(nombre_habilidad=skill_name))
                habilidad = res.scalars().first()

                if not habilidad:
                    habilidad = Habilidad(
                        id_categoria=categoria.id_categoria,
                        nombre_habilidad=skill_name,
                        validada_por_admin=True # Sembradas por default como validadas
                    )
                    session.add(habilidad)
                    print(f"   ⚡ Habilidad creada: {skill_name}")

        await session.commit()
        print("✅ Seeding completado exitosamente.")

if __name__ == "__main__":
    asyncio.run(run_seed())
