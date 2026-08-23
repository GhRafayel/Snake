SHELL := /bin/bash

NVM_URL = https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh
NODE_VERSION = 20

all: certs up 

## Generate self-signed TLS certificates for local development
certs:
	mkdir -p nginx/certs
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/certs/key.pem \
		-out nginx/certs/cert.pem \
		-subj "/C=US/ST=Dev/L=Dev/O=Dev/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:192.168.64.17"

## Install NVM and Node.js if not already installed
setup:
	@echo "Checking for NVM..."
	@if [ -d "$$HOME/.nvm" ]; then \
		echo "NVM directory already exists. Skipping install."; \
		exit 0; \
	else \
		echo "Installing NVM..."; \
		curl -o- $(NVM_URL) | bash; \
	fi
	@echo "Installing NVM..."
	@curl -o- $(NVM_URL) | bash
	@echo "NVM installed. Now configuring environment..."
	@# We must source nvm and install node in the SAME line using ';' or '&&'
	export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	nvm install $(NODE_VERSION); \
	nvm use $(NODE_VERSION); \
	npm install -g npm@latest

init_modules:
	@echo "Updating node modules..."
	@echo "Note: If you see 'command not found: nvm', make sure to run 'make setup' first to install NVM and Node.js."
	cd ./frontend && npm ci
	cd ./backend && npm ci

admin:
	docker compose exec backend npm run seed:admin

## Build images without starting containers
build:
	docker compose build

## Build and start all services (foreground)
up:
	docker compose up --build

## Build and start all services (background)
up-d:
	docker compose up --build -d

## Run only the nginx container (no frontend/backend deps started)
nginx:
	docker compose up --build --no-deps nginx

## Stop all services
down:
	docker compose down

## Stop and remove volumes (wipes database!)
clean:
	docker compose down -v


## Remove everythings
fclean: clean
	# This deletes all unused data (containers, networks, and CACHE)
	docker system prune -f
	# To be even more aggressive (deletes all unused images too)
	docker system prune -a --volumes
	rm -rf frontend/.next
	rm -rf frontend/node_modules/.cache
	npm cache clean --force

## Rebuild everything
re: down up

## Follow logs for all services
logs:
	docker compose logs -f

## Follow logs for a specific service: make log s=backend
log:
	docker compose logs -f $(s)

## Run Prisma migrations inside the backend container
migrate:
	docker exec -it backend npx prisma migrate dev

generate:
	docker exec -it backend npx prisma generate

prisma-reset:
	docker exec -it backend npx prisma migrate reset

## Open Prisma Studio (web-based DB GUI) — runs on port 5555
studio:
	docker exec -it backend npx prisma studio --port 5555

## Open a shell in a service: make shell s=backend
shell:
	docker compose exec $(s) sh

update-backend:
	docker compose build --no-cache backend
	docker compose up -d --force-recreate backend
	docker container prune -f

update-frontend:
	docker compose build --no-cache frontend
	docker compose up -d --force-recreate frontend
	docker container prune -f

.PHONY: all up up-d build down logs certs migrate prisma-reset studio clean re nginx