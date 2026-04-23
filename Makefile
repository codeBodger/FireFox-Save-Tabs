SHELL := /bin/bash

rootFiles := manifest.json  save_dialog.css  save_dialog.html  save_dialog.js  tabtxt.js
iconsFiles := icons/icon32.png icons/icon48.png

name := $(shell echo "`name=\`grep -Po '(?<=  "name": ").+(?=",)' manifest.json\`; echo "${name// /_}"`-`grep -Po '(?<=  "version": ").+(?=",)' manifest.json`.zip")

all: lint build

build: $(name)

$(name): $(rootFiles) $(iconsFiles)
	web-ext build -n $@ -a . -oi `cat .buildignore`

lint:
	web-ext lint
