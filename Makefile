SHELL := /bin/bash

rootFiles := manifest.json  save_dialog.css  save_dialog.html  save_dialog.js  tabtxt.js
iconsFiles := icons/icon32.png icons/icon48.png

fname := $(shell echo "`name=\`grep -Po '(?<=  "name": ").+(?=",)' manifest.json\`; name="$${name// /_}"; name="$${name,,}"; echo "$${name//[^[:alnum:]._]/}"`-`grep -Po '(?<=  "version": ").+(?=",)' manifest.json`.zip")

all: lint build

build: $(fname)

$(fname): $(rootFiles) $(iconsFiles)
	web-ext build -n $@ -a . -oi `cat .buildignore`

lint:
	web-ext lint
