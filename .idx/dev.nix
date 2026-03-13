{ pkgs, ... }: {
  # 1. Actualizamos el canal a uno más reciente (2024)
  channel = "stable-25.05";

  # 2. Subimos la versión de Node
  packages = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.nodejs_22 # <--- EL CAMBIO MÁGICO
    pkgs.postgresql_15
  ];

  # 3. EL SERVICIO (Nivel Raíz, fuera de 'idx')
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_15;
  };

  # 4. Configuración de IDX
  idx = {
    extensions = [
      "ms-python.python"
      "ckotzb.postgresql"
      "bradlc.vscode-tailwindcss"
    ];

    # Vistas previas
    previews = {
      enable = true;
      previews = {
        frontend = {
          command = ["npm" "run" "dev" "--prefix" "frontend" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
        };
        backend = {
          command = ["./venv/bin/python" "-m" "uvicorn" "main:app" "--reload" "--host" "0.0.0.0" "--port" "$PORT"];
          cwd = "backend";
          manager = "web";
        };
      };
    };

    # Ciclo de vida del espacio de trabajo
    workspace = {
      onCreate = {
        setup-all = ''
          cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
          cd ../frontend && npm install
        '';
      };
      onStart = {
        # Creamos la DB solo si no existe
        create-db = "createdb -U postgres mentormatch || true";
      };
    };
  };
}
