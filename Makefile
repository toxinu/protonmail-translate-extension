EXTENSION_NAME = protonmail-translate
VERSION = $(shell python3 -c "import json; print(json.load(open('manifest.json'))['version'])")

.PHONY: pack clean

pack:
	zip -r $(EXTENSION_NAME)-$(VERSION).zip \
		manifest.json \
		background.js \
		content.js \
		content.css \
		popup/ \
		icons/ \
		LICENSE \
		README.md

clean:
	rm -f $(EXTENSION_NAME)-*.zip
