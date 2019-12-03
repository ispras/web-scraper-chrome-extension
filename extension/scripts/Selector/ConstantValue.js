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

        let dfd = $.Deferred();
        let data = {};
        data[this.id] = this.value;

        dfd.resolve([data]);
        return dfd.promise();
    },

    getDataColumns: function () {
        return [this.id];
    },

    getFeatures: function () {
        return ['value']
    }
};
