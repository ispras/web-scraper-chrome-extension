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
            var validate = {
                isDefined: function isDefined(value) {
                    return typeof value != 'undefined' && value !== "";
                },
                notEmpty: function (value) {
                    return value !== "";
                },
                isString: function (value) {
                    return typeof value === 'string' || value instanceof String;
                },
                isNotUndefinedOrEmpty: function (value) {
                    return this.isDefined(value) && this.notEmpty(value);
                }
            };

            $(data).each(function (i, element) {
                var content = element[this.id],
                    isString = validate.isString(content),
                    isUnderlyingString = !isString && validate.notEmpty($(content).text()),
                    isArray = Array.isArray(content),
                    textManipulationAvailable = (isString || isUnderlyingString) && validate.isDefined(this.textmanipulation);
                
                if (textManipulationAvailable) {
                    content = isString ? content : $(content).text();

                    if (validate.isNotUndefinedOrEmpty(this.textmanipulation.regex)) {
                        try {
                            content = $.trim(content);
                            var matches = content.match(new RegExp(this.textmanipulation.regex, 'gm')),
                                regexgroup = this.textmanipulation.regexgroup,
                                groupDefined = validate.isNotUndefinedOrEmpty(regexgroup);

                            regexgroup = groupDefined ? groupDefined : 0;


                            if (matches !== null) {
                                content = matches[regexgroup];
                            }
                            else {
                                content = '';
                            }
                        } catch (e) { console.log("%c Skipping regular expression: " + e.message, 'background: red; color: white;');}
                    }

                    if (validate.isNotUndefinedOrEmpty(this.textmanipulation.removeHtml)) {
                        content = $("<div/>").html(content).text();
                    }

                    if (validate.isNotUndefinedOrEmpty(this.textmanipulation.trimText)) {
                        content = content.trim();
                    }

                    if (validate.isNotUndefinedOrEmpty(this.textmanipulation.replaceText)) {
                        var regex = new RegExp(this.textmanipulation.replaceText, 'gm'),
                            replace = regex.test(content) ? regex : this.textmanipulation.replaceText,
                            replacement = this.textmanipulation.replacementText;

                        content = content.replace(replace, replacement);
                    }

                    if (validate.isNotUndefinedOrEmpty(this.textmanipulation.textPrefix)) {
                        content = this.textmanipulation.textPrefix + content;
                    }

                    if (validate.isNotUndefinedOrEmpty(this.textmanipulation.textSuffix)) {
                        content += this.textmanipulation.textPrefix;
                    }

                    element[this.id] = content;
                } else if (isArray && !validate.isDefined(this.textmanipulation)) {
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
        }
    };

    return Selector;
})();

