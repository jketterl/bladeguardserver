Ext.onReady(function(){
	Ext.USE_NATIVE_JSON = true
	Ext.Loader.setConfig({
		enabled:true,
		paths:{
			'BGT':'/admin/static/js/BGT'
		}
	});

	var login = Ext.create('BGT.LoginWindow');
	login.show();
});
