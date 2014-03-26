Ext.define('BGT.data.proxy.Socket', {
	extend:'Ext.data.proxy.Proxy',
	alias:'proxy.socket',
	read:function(operation, callback, scope){
		var me = this,
		    command = me.commands.read,
		    cb = function(command){
                operation.setCompleted();
                if (command.wasSuccessful()){
                    var result = operation.resultSet = me.getReader().read(command.getResult());
                    if (result.success) operation.setSuccessful();
                } else {
                    me.fireEvent('exception', me, null, operation);
                }
                Ext.callback(callback, scope || me, [operation]);
		    };
		if (typeof(command) == 'object') {
			command = Ext.create(command.command, command.params, cb);
		} else {
			command = Ext.create(command, cb);
		}
		me.socket.sendCommand(command);
	},
	create:function(operation, callback, scope){
		var me = this,
		    record = operation.getRecords()[0],
		    command = Ext.create(me.commands.create, record, function(command){
                operation.setSuccessful(command.wasSuccessful());
                operation.setCompleted();
                if (command.wasSuccessful()){
                    record.set(command.getResult());
                }
                Ext.callback(callback, scope || me, [operation]);
            });
		me.socket.sendCommand(command);
	},
    update:function(operation, callback, scope){
        var me = this,
            record = operation.getRecords()[0],
            command = Ext.create(me.commands.update, record, function(command){
                operation.setSuccessful(command.wasSuccessful());
                operation.setCompleted();
                if (command.wasSuccessful()) {
                    record.set(command.getResult());
                }
                Ext.callback(callback, scope || me, [operation]);
            });
        me.socket.sendCommand(command);
    }
});
