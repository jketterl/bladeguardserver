Ext.define('BGT.admin.events.Form', {
	extend:'Ext.form.Panel',
	requires:[
		'BGT.admin.map.Map',
		'Ext.ux.form.DateTimeField'
	],
	defaults:{
		anchor:'100%'
	},
	items:[{
		xtype:'textfield',
		fieldLabel:'Name',
		name:'title'
	},{
		xtype:'combobox',
		fieldLabel:'Strecke',
		name:'map',
		store:{
			model:'BGT.admin.map.Map'
		},
		displayField:'name',
		valueField:'id'
	},{
		xtype:'datetimefield',
		fieldLabel:'Start',
		name:'start',
		format:'d.m.Y H:i'
	},{
		xtype:'datetimefield',
		fieldLabel:'Ende',
		name:'end',
		format:'d.m.Y H:i'
	}]
});
