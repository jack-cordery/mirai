lint:
	pre-commit run

test:
	go test -race -timeout 1s ./...

build:
	@go build -o bin/mirai  ./cmd/mirai

install:
	@go install ./...

clean:
	@rm  $(shell go env GOPATH)/bin/mirai;
	@rm -rf ./bin

compose:
	docker compose --env-file .env.local up --build

generate-sql:
	sqlc generate

format-sql:
	pnpx sql-formatter -l postgresql --fix $(file)

migrate-force:
	@echo "Running migration force to version $(VERSION). Ensure you have run compose, so that the containers are running"
	@set -o allexport; source .env.local; set +o allexport; \
	docker compose --env-file .env.local run --rm --remove-orphans migrate -path /migrations/ -database "postgres://$$POSTGRES_USER:$$POSTGRES_PASSWORD@psql:5432/$$POSTGRES_DB?sslmode=disable" force $(VERSION)

migrate-up:
	@echo "Running migration up. Ensure you have run compose, so that the containers are running"
	@set -o allexport; source .env.local; set +o allexport; \
	docker compose --env-file .env.local run --rm --remove-orphans migrate -path /migrations/ -database "postgres://$$POSTGRES_USER:$$POSTGRES_PASSWORD@psql:5432/$$POSTGRES_DB?sslmode=disable" up

migrate-down:
	@echo "Running migration down $(N). Ensure you have run compose, so that the containers are running"
	@set -o allexport; source .env.local; set +o allexport; \
	docker compose --env-file .env.local run --rm --remove-orphans migrate -path /migrations/ -database "postgres://$$POSTGRES_USER:$$POSTGRES_PASSWORD@psql:5432/$$POSTGRES_DB?sslmode=disable" down $(N)

create-migration:
	migrate create -ext sql -dir db/migrations -seq $(NAME)
