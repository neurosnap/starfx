clean:
	rm -rf ./docs/public/*
	echo "" > ./docs/public/.gitkeep
.PHONY: clean

ssg: clean
	go run ./docs/main.go
	cp ./docs/static/* ./docs/public
.PHONY: ssg

local: ssg
	rsync -vr ./docs/public/ erock@pgs.sh:/docs-local
.PHONY: dev
