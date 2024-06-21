fmt:
	go fmt ./...
	deno fmt
.PHONY: fmt

clean:
	rm -rf ./public/*
.PHONY: clean

ssg:
	go run ./main.go
	cp ./static/* ./public
.PHONY: ssg

local: ssg
	rsync -vr ./public/ erock@pgs.sh:/starfx-local
.PHONY: dev

prod: ssg
	rsync -vr ./public/ erock@pgs.sh:/starfx-prod
.PHONY: prod
