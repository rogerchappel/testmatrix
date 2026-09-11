test:
	@node -e "console.log('make test ok')"

build:
	@node -e "console.log('make build ok')"

alpha beta:
	@node -e "console.log('make multi-target ok')"

gamma::
	@node -e "console.log('make double-colon ok')"

.PHONY: lint2 fullcheck

lint2 : tools
	@node -e "console.log('make spaced single-colon ok')"

fullcheck	:: extras
	@node -e "console.log('make tabbed double-colon ok')"
