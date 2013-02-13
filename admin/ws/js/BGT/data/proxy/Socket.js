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
	}
});
