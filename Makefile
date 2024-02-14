clean:
	rm -rf ./docs/public/*
	echo "" > ./docs/public/.gitkeep
.PHONY: clean

ssg: clean
	cd docs && go run ./main.go
	cp ./docs/static/* ./docs/public
.PHONY: ssg

local: ssg
	rsync -vr ./docs/public/ erock@pgs.sh:/starfx-local
.PHONY: dev

prod: ssg
	rsync -vr ./docs/public/ erock@pgs.sh:/starfx-prod
.PHONY: prod
