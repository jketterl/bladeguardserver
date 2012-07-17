Ext.define('BGT.Event', {
	extend:'Ext.data.Model',
	fields:[
		{name:'timestamp', type:'date'},
		{name:'type', type:'text'},
		{name:'data', type:'object'}
	]
});
