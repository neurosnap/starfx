fmt:
	deno fmt
.PHONY:

lint:
	deno lint
.PHONY: lint

test:
	deno test --allow-env --allow-read
.PHONY: test
