var SelectorValue = {

    canReturnMultipleRecords: function () {
        return false;
    },

    canHaveChildSelectors: function () {
        return true;
    },

    canHaveLocalChildSelectors: function () {
        return true;
    },

    canCreateNewJobs: function () {
        return false;
    },

    willReturnElements: function () {
        return false;
    },

    _getData: function (parentElement) {

        var dfd = $.Deferred();

        var elements = this.getDataElements(parentElement);

        var result = [];
        $(elements).each(function (k, element) {
            $(element).val(this.insertValue);
        }.bind(this));


        var data = {};
        data[this.id] = this.insertValue;
        result.push(data);


        dfd.resolve(result);
        return dfd.promise();
    },

    getDataColumns: function () {
        return [];
    },

    getFeatures: function () {
        return ['insertValue']
    }
};
