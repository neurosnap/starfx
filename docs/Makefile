clean:
	rm -rf ./public/*
	echo "" > ./public/.gitkeep
.PHONY: clean

ssg: clean
	go run ./main.go
	cp ./static/* ./public
.PHONY: ssg

local: ssg
	rsync -vr ./public/ erock@pgs.sh:/starfx-local
.PHONY: dev

prod: ssg
	rsync -vr ./public/ erock@pgs.sh:/starfx-prod
.PHONY: prod
