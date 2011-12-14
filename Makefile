
path_build=./build
path_tools=./tools
path_lib=./lib
path_combine_output=${path_build}/ease.js
path_combine_output_full=${path_build}/ease-full.js
path_browser_test=${path_tools}/browser-test.html
path_test=./test
path_perf_test=${path_test}/perf

perf_tests := $(shell find "$(path_perf_test)" -name 'perf-*.js')

src_js := index.js $(wildcard $(path_lib)/*.js)
src_tests := index.js $(shell find "$(path_test)" -name test-* \
	-o -name *Test* \
	-o -name inc-*.js )

path_doc := ./doc

combine := $(path_tools)/combine
compiler := $(path_tools)/compiler.jar
path_externs_internal := $(path_build)/externs-internal.js

.PHONY: combine min doc test test-combine clean distclean


default: combine min
all:     combine min doc

mkbuild: $(path_build)

# create build dir
$(path_build):
	mkdir -p "$(path_build)"

# combine all modules into easily redistributable ease.js file (intended for
# browser)
$(path_combine_output): $(src_js) | mkbuild
	${combine} > "$(path_combine_output)"
$(path_combine_output_full): $(src_js) $(src_tests) | mkbuild
	INC_TEST=1 "$(combine)" > "${path_combine_output_full}"
$(path_build)/browser-test.html: $(path_browser_test) | $(path_combine_output_full)
	cp "$(path_browser_test)" $@
$(path_build)/browser-test-min.html: $(path_browser_test) | $(path_combine_output_full)
	cat "$(path_browser_test)" | sed 's/ease-full\.js/ease-full\.min\.js/' > $@
combine: $(path_combine_output) $(path_build)/browser-test.html

doc:
	$(MAKE) -C $(path_doc)

test: default
	$(MAKE) -C $(path_test)

# performance tests
perf: default $(perf_tests)
perf-%.js: default
	@node $@

# externs for compilation process
$(path_externs_internal): | mkbuild
	$(path_tools)/mkexterns > $@

# minification process uses Google Closure compiler
min: build/ease.min.js build/ease-full.min.js $(path_build)/browser-test-min.html \
	| combine
$(compiler):
	wget -O- http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz \
		| tar -C $(path_tools) -xzv compiler.jar
build/%.min.js: build/%.js $(path_tools)/externs-global.js  $(path_externs_internal) \
	$(compiler)
	cat $(path_tools)/license.tpl > $@
	java -jar $(compiler) \
		--externs $(path_tools)/externs-global.js \
		--externs $(path_build)/externs-internal.js \
		--js $< >> $@ || rm $@

install: doc-info
	[ -d $(path_info_install) ] || mkdir -p $(path_info_install)
	cp $(path_doc_output_info) $(path_info_install)

uninstall:
	rm $(path_info_install)/easejs.info

# clean up build dir
clean:
	$(MAKE) -C $(path_doc) clean
	rm -rf "${path_build}"

distclean: clean
	rm $(compiler)

