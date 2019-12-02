var ConstantValue = {

    canReturnMultipleRecords: function () {
        return false;
    },

    canHaveChildSelectors: function () {
        return false;
    },

    canHaveLocalChildSelectors: function () {
        return false;
    },

    canCreateNewJobs: function () {
        return false;
    },

    willReturnElements: function () {
        return false;
    },

    _getData: function (parentElement) {

        var dfd = $.Deferred();
        var result = [];
        var data = {};
        data[this.id] = this.insertValue;
        result.push(data);
        dfd.resolve(result);
        return dfd.promise();
    },

    getDataColumns: function () {
        return [this.id];
    },

    getFeatures: function () {
        return ['insertValue']
    }
};
