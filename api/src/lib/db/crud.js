const crud = (client, tableName, exposedFields, searchableFieldsList, sortableFieldsList, idOptions = {}, extraOptions = {}) => {
    const idFieldName = idOptions.name || 'id';
    const idAutoGenerated = !!idOptions.autogenerated;

    const historyTable = extraOptions.historyTable;
    const watchedFields = extraOptions.watchedFields || exposedFields;

    const searchableFields = searchableFieldsList || exposedFields;
    const sortableFields = sortableFieldsList || exposedFields;

    const select = require('./queries/select')(client, tableName, exposedFields, idFieldName);

    const selectPage = require('./queries/selectPage')(client, tableName, exposedFields, searchableFields, sortableFields, idOptions, extraOptions);

    const version = historyTable ? require('./queries/version')(client, tableName, historyTable, exposedFields, idFieldName, idAutoGenerated) : null;

    const batchInsert = require('./queries/batchInsert')(client, tableName, exposedFields, idFieldName, idAutoGenerated, version);

    const batchUpdate = require('./queries/batchUpdate')(client, tableName, exposedFields, idFieldName);

    const batchDelete = require('./queries/batchDelete')(client, tableName, exposedFields, idFieldName);

    const insertOne = require('./queries/insertOne')(client, tableName, exposedFields, idAutoGenerated, idFieldName, version);

    const hasChange = require('./queries/hasChange')(select, watchedFields);

    const updateOne = require('./queries/updateOne')(client, tableName, exposedFields, idFieldName, idAutoGenerated, version, hasChange);

    const removeOne = require('./queries/removeOne')(client, tableName, exposedFields, idFieldName, version);

    function* exists(entityId) {
        const result = yield client.query_(`SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE ${idFieldName} = $entityId)`, {entityId});

        return result.rows[0].exists;
    }

    return {
        selectAll: select.selectAll,
        selectOne: select.selectOneById,
        selectOneById: select.selectOneById,
        countAll: select.countAll,
        refresh: select.refresh,
        selectPage,
        batchDelete,
        batchInsert,
        batchUpdate,
        insertOne,
        updateOne,
        removeOne,
        exists,
        version,
        hasChange,
    };
};

crud.getFormattedDateField = function getFormattedDateField(fieldName, asName) {
    return `to_char(${fieldName} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ${asName || fieldName}`;
};

export default crud;
