Ext.define('BGT.data.proxy.Socket', {
	extend:'Ext.data.proxy.Proxy',
	alias:'proxy.socket',
	read:function(operation, callback, scope){
		var me = this,
		    command = Ext.create(me.commands.read, function(command){
			operation.setCompleted();
			if (command.wasSuccessful()){
				var result = operation.resultSet = me.getReader().read(command.getResult());
				if (result.success) operation.setSuccessful();
			} else {
				me.fireEvent('exception', me, null, operation);
			}
			Ext.callback(callback, scope || me, [operation]);
		});
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
	}
});
