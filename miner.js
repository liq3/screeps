module.exports = {

 	run: function (creep) {
		var source = Game.getObjectById(creep.memory.sourceId);
        if(source != null) {
            var error = creep.harvest(source);
            if (error == ERR_NOT_IN_RANGE || creep.pos.getRangeTo(source) > 1) {
                creep.moveTo(source);
            }
        }
	}
};
