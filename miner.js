module.exports = {

 	run: function (creep) {
		var source = Game.getObjectById(creep.memory.sourceId);
        if(source != null) {
            var error = creep.harvest(source);
            if (error == ERR_NOT_IN_RANGE || creep.pos.getRangeTo(source) > 1) {
                creep.moveTo(source);
            }
        }
        var dropOff = creep.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.name != creep.name});
        if (dropOff.length > 0) {
            var error = creep.transfer(dropOff[0], RESOURCE_ENERGY);
            if (error < 0 && error != -6 && error != -8 && error != -4) {
                console.log(creep.name + " error transfering energy. " + error);
            }
        }
	}
};
