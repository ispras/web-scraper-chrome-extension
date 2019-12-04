var Selector = (function () {

    function Selector(selector) {
        this.updateData(selector);
        this.initType();
    };

    Selector.prototype = {
        /**
        * Manipulates return data from selector.
        * @param data
        */
        manipulateData: function (data) {

            var regex = function (content, regex, regexgroup) {
                try {
                    content = $.trim(content);
                    var matches = content.match(new RegExp(regex, 'gm')),
                        groupDefined = regexgroup !== "";

                    regexgroup = groupDefined ? regexgroup : 0;


                    if (matches !== null) {
                        return matches[regexgroup];
                    }
                    else {
                        return '';
                    }
                } catch (e) { console.log("%c Skipping regular expression: " + e.message, 'background: red; color: white;'); }
            };

            var removeHtml = function (content) {
                return $("<div/>").html(content).text();
            }

            var trimText = function (content) {
                return content.trim();
            }

            var replaceText = function (content, replaceText, replacementText) {
                var replace;
                try {
                    var regex = new RegExp(replaceText, 'gm');
                    replace = regex.test(content) ? regex : replaceText;
                } catch (e) { replace = replaceText; }

                return content.replace(replace, replacementText);
            }

            var textPrefix = function (content, prefix) {
                return content = prefix + content;
            }

            var textSuffix = function (content, suffix) {
                return content += suffix;
            }

            $(data).each(function (i, element) {
                var content = element[this.id],
                    isString = typeof content === 'string' || content instanceof String,
                    isUnderlyingString = !isString && $(content).text() !== "",
                    isArray = Array.isArray(content),
                    isTextmManipulationDefined = typeof this.textmanipulation != 'undefined' && this.textmanipulation !== "",
                    textManipulationAvailable = (isString || isUnderlyingString) && isTextmManipulationDefined;

                if (textManipulationAvailable) {
                    content = isString ? content : $(content).text();

                    // use key in object since unit tests might not define each property
                    var keys = []
                    for (var key in this.textmanipulation) {
                        if (!this.textmanipulation.hasOwnProperty(key)) { continue; }
                        keys.push(key)
                    }

                    function propertyIsAvailable(key) {
                        return keys.indexOf(key) >= 0;
                    }

                    if (propertyIsAvailable("regex")) {
                        var group = this.textmanipulation.regexgroup;
                        var value = this.textmanipulation.regex;
                        group = typeof group != 'undefined' ? group : "";
                        if (value !== '') { content = regex(content, value, group); }
                    }

                    if (propertyIsAvailable("removeHtml")) {
                        if (this.textmanipulation.removeHtml) {
                            content = removeHtml(content);
                        }
                    }

                    if (propertyIsAvailable("trimText")) {
                        if (this.textmanipulation.trimText) {
                            content = trimText(content);
                        }
                    }

                    if (propertyIsAvailable("replaceText")) {
                        var replacement = this.textmanipulation.replacementText;
                        replacement = typeof replacement != 'undefined' ? replacement : "";
                        content = replaceText(content, this.textmanipulation.replaceText, replacement);
                    }

                    if (propertyIsAvailable("textPrefix")) {
                        if (this.textmanipulation.textPrefix !== '') {
                            content = textPrefix(content, this.textmanipulation.textPrefix)
                        };
                    }

                    if (propertyIsAvailable("textSuffix")) {
                        if (this.textmanipulation.textSuffix !== '') {
                            content = textSuffix(content, this.textmanipulation.textSuffix)
                        };
                    }

                    element[this.id] = content;
                } else if (isArray && isTextmManipulationDefined) {
                    element[this.id] = JSON.stringify(content);
                    this.manipulateData(element);
                }

            }.bind(this));
        },

        /**
         * Is this selector configured to return multiple items?
         * @returns {boolean}
         */
        willReturnMultipleRecords: function () {
            return this.canReturnMultipleRecords() && this.multiple;
        },

        /**
         * Update current selector configuration
         * @param data
         */
        updateData: function (data) {
            var allowedKeys = ['id', 'type', 'selector', 'parentSelectors'];
            allowedKeys = allowedKeys.concat(window[data.type].getFeatures());

            // update data
            for (var key in data) {
                if (allowedKeys.indexOf(key) !== -1 || typeof data[key] === 'function') {
                    this[key] = data[key];
                }
            }

            // remove values that are not needed for this type of selector
            for (var key in this) {
                if (allowedKeys.indexOf(key) === -1 && typeof this[key] !== 'function') {
                    delete this[key];
                }
            }
        },

        /**
         * CSS selector which will be used for element selection
         * @returns {string}
         */
        getItemCSSSelector: function () {
            return "*";
        },

        /**
         * override objects methods based on seletor type
         */
        initType: function () {

            if (window[this.type] === undefined) {
                throw "Selector type not defined " + this.type;
            }

            // overrides objects methods
            for (var i in window[this.type]) {
                this[i] = window[this.type][i];
            }
        },

        /**
         * Check whether a selector is a paren selector of this selector
         * @param selectorId
         * @returns {boolean}
         */
        hasParentSelector: function (selectorId) {
            return (this.parentSelectors.indexOf(selectorId) !== -1);
        },

        removeParentSelector: function (selectorId) {
            var index = this.parentSelectors.indexOf(selectorId);
            if (index !== -1) {
                this.parentSelectors.splice(index, 1);
            }
        },

        renameParentSelector: function (originalId, replacementId) {
            if (this.hasParentSelector(originalId)) {
                var pos = this.parentSelectors.indexOf(originalId);
                this.parentSelectors.splice(pos, 1, replacementId);
            }
        },

        getDataElements: function (parentElement) {

            var elements = ElementQuery(this.selector, parentElement);
            if (this.multiple) {
                return elements;
            }
            else if (elements.length > 0) {
                return [elements[0]];
            }
            else {
                return [];
            }
        },

        stringReplace: function(url, stringReplacement){

            if (stringReplacement && stringReplacement.replaceString) {
                var replace;
                var replacement = stringReplacement.replacementString || "";
                try {
                    var regex = new RegExp(stringReplacement.replaceString, 'gm');
                    replace = regex.test(url) ? regex : stringReplacement.replaceString;
                } catch (e) {
                    replace = stringReplacement.replaceString;
                }

                return url.replace(replace, replacement);
            } else {
                return url;
            }

        },

        getData: function (parentElement) {

            var d = $.Deferred();
            var timeout = this.delay || 0;

            // this works much faster because $.whenCallSequentially isn't running next data extraction immediately
            if (timeout === 0) {
                var deferredData = this._getData(parentElement);
                deferredData.done(function (data) {
                    this.manipulateData(data);
                    d.resolve(data);
                }.bind(this));
            }
            else {
                setTimeout(function () {
                    var deferredData = this._getData(parentElement);
                    deferredData.done(function (data) {
                        this.manipulateData(data);
                        d.resolve(data);
                    }.bind(this));
                }.bind(this), timeout);
            }

            return d.promise();
        },


        getFilenameFromUrl: function(url) {

            var parts = url.split("/");
            var filename = parts[parts.length-1];
            filename = filename.replace(/\?/g, "");
            if(filename.length > 130) {
                filename = filename.substr(0, 130);
            }
            return filename;
        },

        downloadFileAsBase64: function(url) {

            var deferredResponse = $.Deferred();
            var xhr = new XMLHttpRequest();
            var fileName = this.getFilenameFromUrl(url);
            xhr.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if(this.status == 200) {
                        var blob = this.response;
                        var mimeType = blob.type;
                        var deferredBlob = Base64.blobToBase64(blob);

                        deferredBlob.done(function(fileBase64) {
                            deferredResponse.resolve({
                                mimeType: mimeType,
                                fileBase64: fileBase64,
                                filename: fileName
                            });
                        });
                    }
                    else {
                        deferredResponse.reject(xhr.statusText);
                    }
                }
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();

            return deferredResponse.promise();
        }
    };

    return Selector;
})();

