module.exports = {

 	run: function (creep) {
		var source = Game.getObjectById(creep.memory.sourceId);
        if(source) {
            let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType = STRUCTURE_CONTAINER});
            if (containers.length > 0 && creep.pos.getRangeTo(containers[0]) > 0) {
                creep.moveTo(containers[0], {range:0});
            }
            var error = creep.harvest(source);
            if (error == ERR_NOT_IN_RANGE || creep.pos.getRangeTo(source) > 1) {
                creep.moveTo(source);
            } else {
                let structures = creep.pos.lookFor(LOOK_STRUCTURES);
                if (structures.length > 0) {
                    let s = structures[0];
                    if (s instanceof StructureContainer && s.hits < s.hitsMax) {
                        creep.repair(s);
                    }
                }
            }
        }
	}
};
