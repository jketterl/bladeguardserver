Ext.onReady(function(){
	Ext.USE_NATIVE_JSON = true
	Ext.Loader.setConfig({
		enabled:true,
		paths:{
			'BGT':'/static/js/BGT',
			'Ext.ux':'/static/js/ext-ux'
		}
	});

	var login = Ext.create('BGT.LoginWindow', {
		success:function(){
			var app = Ext.create('BGT.App');
		}
	});
	login.show();
});
