module.exports = function(client) {
    return {
        prompts: function (callback) {
            client.elements('.prompt', function(error, webObject){
                expect(error).toBeFalsy();
                callback(webObject.value);
            });
            return client;
        }
    }
};
