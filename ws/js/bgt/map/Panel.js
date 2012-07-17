Ext.define('BGT.map.Panel', {
	extend:'Ext.panel.Panel',
	listeners:{
		render:function(){
			this.map = new google.maps.Map(this.body.dom, {
				center:new google.maps.LatLng(48.132501, 11.543460),
				zoom:14,
				mapTypeId:google.maps.MapTypeId.ROADMAP
			});
			this.on('resize', function(){
				google.maps.event.trigger(map, 'resize');
			});
		}
	}
});
